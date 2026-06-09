import { defineApp } from "rwsdk/worker";
import { route } from "rwsdk/router";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "./db/schema";

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":");
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return computedHashHex === hashHex;
}

export default defineApp([
  route("/api/auth/register", {
    post: async ({ request, env }) => {
      const db = drizzle(env.DB);
      const body = await request.json() as any;
      if (!body.email || !body.password) {
        return Response.json({ error: "Missing email or password" }, { status: 400 });
      }
      const existingUser = await db.select().from(users).where(eq(users.email, body.email)).get();
      if (existingUser) {
        return Response.json({ error: "Email already exists" }, { status: 409 });
      }
      const passwordHash = await hashPassword(body.password);
      const newUser = await db.insert(users).values({
        email: body.email,
        password_hash: passwordHash,
        createdAt: Date.now(),
        displayName: body.displayName || null,
      }).returning().get();
      return Response.json({
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
      }, { status: 201 });
    }
  }),
  route("/api/auth/login", {
    post: async ({ request, env }) => {
      const db = drizzle(env.DB);
      const body = await request.json() as any;
      if (!body.email || !body.password) {
        return Response.json({ error: "Missing email or password" }, { status: 400 });
      }
      const user = await db.select().from(users).where(eq(users.email, body.email)).get();
      if (!user) {
        return Response.json({ error: "Unknown email or wrong password" }, { status: 401 });
      }
      const valid = await verifyPassword(body.password, user.password_hash);
      if (!valid) {
        return Response.json({ error: "Unknown email or wrong password" }, { status: 401 });
      }
      return Response.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      });
    }
  }),
  route("/api/users", {
    get: async ({ env }) => {
      const db = drizzle(env.DB);
      const allUsers = await db.select().from(users).all();
      return Response.json(allUsers.map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        createdAt: u.createdAt,
      })));
    }
  }),
]);
