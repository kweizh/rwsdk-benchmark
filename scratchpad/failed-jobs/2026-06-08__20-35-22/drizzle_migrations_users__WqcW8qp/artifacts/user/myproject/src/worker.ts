import { AsyncLocalStorage } from 'async_hooks';
import { defineApp } from 'rwsdk/worker';
import { route } from 'rwsdk/router';
import { drizzle } from 'drizzle-orm/d1';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from './lib/auth';

// AsyncLocalStorage to pass the D1 binding through the request lifecycle
const dbStorage = new AsyncLocalStorage<D1Database>();

function getDb() {
  const db = dbStorage.getStore();
  if (!db) {
    throw new Error('D1 database binding not available in this context');
  }
  return drizzle(db);
}

const app = defineApp([
  route('/api/auth/register', {
    post: async ({ request }) => {
      let body: { email?: string; password?: string; displayName?: string | null };
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { email, password, displayName } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'email and password are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const db = getDb();

      // Check if user already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .get();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Email already exists' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const passwordHash = await hashPassword(password);
      const now = new Date();

      const result = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          createdAt: now,
          displayName: displayName ?? null,
        })
        .returning();

      const user = result[0];

      return new Response(
        JSON.stringify({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      );
    },
  }),

  route('/api/auth/login', {
    post: async ({ request }) => {
      let body: { email?: string; password?: string };
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { email, password } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'email and password are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const db = getDb();

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .get();

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    },
  }),

  route('/api/users', {
    get: async () => {
      const db = getDb();

      const allUsers = await db.select().from(users).all();

      return new Response(
        JSON.stringify(
          allUsers.map((u) => ({
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            createdAt: u.createdAt instanceof Date ? u.createdAt.getTime() : u.createdAt,
          })),
        ),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    },
  }),
]);

// Wrap the app's fetch to inject the D1 binding via AsyncLocalStorage
const originalFetch = app.fetch;

export default {
  __rwRoutes: app.__rwRoutes,
  fetch: async (request: Request, env: Env, cf: ExecutionContext) => {
    return dbStorage.run(env.DB, () => originalFetch(request, env, cf));
  },
};