import { defineApp } from "rwsdk/worker";
import { route } from "rwsdk/router";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./utils/crypto";

export default defineApp([
  route("/api/auth/register", {
    post: async ({ request }) => {
      let body: any;
      try {
        body = await request.json();
      } catch (e) {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }

      if (!body || typeof body.email !== "string" || !body.email || typeof body.password !== "string" || !body.password) {
        return Response.json({ error: "Email and password are required" }, { status: 400 });
      }

      const db = drizzle(env.DB, { schema });
      const existingUsers = await db.select().from(schema.users).where(eq(schema.users.email, body.email)).limit(1);
      if (existingUsers.length > 0) {
        return Response.json({ error: "Email already exists" }, { status: 409 });
      }

      const passwordHash = await hashPassword(body.password);
      const now = Date.now();
      const displayName = body.displayName !== undefined ? body.displayName : null;

      const result = await db.insert(schema.users).values({
        email: body.email,
        passwordHash,
        createdAt: now,
        displayName,
      }).returning({
        id: schema.users.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
      });

      const inserted = result[0];
      return Response.json({
        id: inserted.id,
        email: inserted.email,
        displayName: inserted.displayName,
      }, { status: 201 });
    }
  }),

  route("/api/auth/login", {
    post: async ({ request }) => {
      let body: any;
      try {
        body = await request.json();
      } catch (e) {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }

      if (!body || typeof body.email !== "string" || !body.email || typeof body.password !== "string" || !body.password) {
        return Response.json({ error: "Email and password are required" }, { status: 401 });
      }

      const db = drizzle(env.DB, { schema });
      const existingUsers = await db.select().from(schema.users).where(eq(schema.users.email, body.email)).limit(1);
      if (existingUsers.length === 0) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const user = existingUsers[0];
      const isValid = await verifyPassword(body.password, user.passwordHash);
      if (!isValid) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }

      return Response.json({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      }, { status: 200 });
    }
  }),

  route("/api/users", {
    get: async () => {
      const db = drizzle(env.DB, { schema });
      const allUsers = await db.select({
        id: schema.users.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
        createdAt: schema.users.createdAt,
      }).from(schema.users);

      return Response.json(allUsers, { status: 200 });
    }
  })
]);
