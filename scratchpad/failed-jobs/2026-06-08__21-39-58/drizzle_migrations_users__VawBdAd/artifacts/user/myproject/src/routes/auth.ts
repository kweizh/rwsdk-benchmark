import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/password";

function getDb() {
  return drizzle(env.DB);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number): Response {
  return json({ error: message }, status);
}

export async function register(request: Request): Promise<Response> {
  let body: { email?: string; password?: string; displayName?: string | null };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { email, password, displayName } = body;

  if (!email || !password) {
    return jsonError("email and password are required", 400);
  }

  const db = getDb();

  // Check if email already exists
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existing) {
    return jsonError("Email already registered", 409);
  }

  const passwordHash = await hashPassword(password);
  const createdAt = Date.now();

  const result = await db
    .insert(users)
    .values({
      email,
      password_hash: passwordHash,
      display_name: displayName ?? null,
      created_at: createdAt,
    })
    .returning({
      id: users.id,
      email: users.email,
      display_name: users.display_name,
    })
    .get();

  if (!result) {
    return jsonError("Failed to create user", 500);
  }

  return json(
    {
      id: result.id,
      email: result.email,
      displayName: result.display_name,
    },
    201
  );
}

export async function login(request: Request): Promise<Response> {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { email, password } = body;

  if (!email || !password) {
    return jsonError("email and password are required", 400);
  }

  const db = getDb();

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      password_hash: users.password_hash,
      display_name: users.display_name,
    })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user) {
    return jsonError("Invalid email or password", 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return jsonError("Invalid email or password", 401);
  }

  return json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
  });
}

export async function listUsers(): Promise<Response> {
  const db = getDb();

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
      displayName: u.display_name,
      createdAt: u.created_at,
    }))
  );
}
