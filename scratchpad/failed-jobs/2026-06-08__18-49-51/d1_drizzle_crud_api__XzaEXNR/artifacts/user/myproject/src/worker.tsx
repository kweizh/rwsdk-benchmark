import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { getDb } from "@/db/db";
import { books } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type AppContext = {};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    ctx;
  },
  ...prefix("/api", [
    // GET /api/books  and  POST /api/books
    route("/books", {
      get: async () => {
        const db = getDb();
        const rows = await db
          .select()
          .from(books)
          .orderBy(asc(books.id));
        return json(rows);
      },
      post: async ({ request }) => {
        let body: { title?: unknown; author?: unknown };
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const title =
          typeof body.title === "string" ? body.title.trim() : "";
        const author =
          typeof body.author === "string" ? body.author.trim() : "";

        if (!title || !author) {
          return json(
            { error: "title and author are required and must not be empty" },
            400
          );
        }

        const db = getDb();
        const result = await db
          .insert(books)
          .values({ title, author })
          .returning();
        const created = result[0];
        return json(created, 201);
      },
    }),

    // GET /api/books/:id  PUT /api/books/:id  DELETE /api/books/:id
    route("/books/:id", {
      get: async ({ params }) => {
        const id = parseId(params.id);
        if (!id) {
          return json({ error: "id must be a positive integer" }, 400);
        }

        const db = getDb();
        const rows = await db
          .select()
          .from(books)
          .where(eq(books.id, id));
        if (rows.length === 0) {
          return json({ error: `Book with id ${id} not found` }, 404);
        }
        return json(rows[0]);
      },

      put: async ({ params, request }) => {
        const id = parseId(params.id);
        if (!id) {
          return json({ error: "id must be a positive integer" }, 400);
        }

        let body: { title?: unknown; author?: unknown };
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const updates: { title?: string; author?: string } = {};
        if (typeof body.title === "string" && body.title.trim()) {
          updates.title = body.title.trim();
        }
        if (typeof body.author === "string" && body.author.trim()) {
          updates.author = body.author.trim();
        }

        if (Object.keys(updates).length === 0) {
          return json(
            { error: "At least one of title or author must be provided" },
            400
          );
        }

        const db = getDb();
        const existing = await db
          .select()
          .from(books)
          .where(eq(books.id, id));
        if (existing.length === 0) {
          return json({ error: `Book with id ${id} not found` }, 404);
        }

        const updated = await db
          .update(books)
          .set(updates)
          .where(eq(books.id, id))
          .returning();
        return json(updated[0]);
      },

      delete: async ({ params }) => {
        const id = parseId(params.id);
        if (!id) {
          return json({ error: "id must be a positive integer" }, 400);
        }

        const db = getDb();
        const existing = await db
          .select()
          .from(books)
          .where(eq(books.id, id));
        if (existing.length === 0) {
          return json({ error: `Book with id ${id} not found` }, 404);
        }

        await db.delete(books).where(eq(books.id, id));
        return new Response(null, { status: 204 });
      },
    }),
  ]),

  render(Document, [route("/", Home)]),
]);
