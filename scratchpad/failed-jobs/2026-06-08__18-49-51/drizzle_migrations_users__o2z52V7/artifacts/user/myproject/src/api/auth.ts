import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/password";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleRegister(request: Request): Promise<Response> {
  let body: { email?: string; password?: string; displayName?: string | null };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { email, password, displayName = null } = body;

  if (!email || !password) {
    return json({ error: "email and password are required" }, 400);
  }

  const db = drizzle((env as Env).DB);

  // Check for existing user
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existing) {
    return json({ error: "Email already exists" }, 409);
  }

  const password_hash = await hashPassword(password);
  const created_at = Date.now();

  const inserted = await db
    .insert(users)
    .values({
      email,
      password_hash,
      created_at,
      display_name: displayName ?? null,
    })
    .returning({
      id: users.id,
      email: users.email,
      display_name: users.display_name,
    })
    .get();

  return json(
    {
      id: inserted.id,
      email: inserted.email,
      displayName: inserted.display_name ?? null,
    },
    201
  );
}

export async function handleLogin(request: Request): Promise<Response> {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { email, password } = body;

  if (!email || !password) {
    return json({ error: "email and password are required" }, 400);
  }

  const db = drizzle((env as Env).DB);

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user) {
    return json({ error: "Invalid credentials" }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return json({ error: "Invalid credentials" }, 401);
  }

  return json({
    id: user.id,
    email: user.email,
    displayName: user.display_name ?? null,
  });
}

export async function handleListUsers(): Promise<Response> {
  const db = drizzle((env as Env).DB);

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      display_name: users.display_name,
      created_at: users.created_at,
    })
    .from(users)
    .all();

  return json(
    allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.display_name ?? null,
      createdAt: u.created_at,
    }))
  );
}
