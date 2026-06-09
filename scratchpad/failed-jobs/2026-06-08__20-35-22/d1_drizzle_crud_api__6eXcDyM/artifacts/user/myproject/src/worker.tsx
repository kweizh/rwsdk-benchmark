import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { db } from "@/db/db";
import { books } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type AppContext = {};

// Helper to create JSON responses
function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

// Validate that id is a positive integer
function parseId(idStr: string | undefined): number | null {
  if (!idStr) return null;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  render(Document, [route("/", Home)]),

  // API routes
  prefix("/api", [
    // GET /api/books — list all books
    route("/books", {
      get: async () => {
        const allBooks = await db.select().from(books).orderBy(asc(books.id));
        return jsonResponse(allBooks);
      },
      // POST /api/books — create a book
      post: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("Invalid JSON body", 400);
        }

        const { title, author } = body as { title?: string; author?: string };

        if (!title || typeof title !== "string" || title.trim() === "") {
          return errorResponse("title is required", 400);
        }
        if (!author || typeof author !== "string" || author.trim() === "") {
          return errorResponse("author is required", 400);
        }

        const created_at = new Date().toISOString();
        const result = await db.insert(books).values({ title, author, created_at }).returning();
        return jsonResponse(result[0], 201);
      },
    }),

    // GET /api/books/:id — get a single book
    route("/books/:id", {
      get: async ({ params }) => {
        const id = parseId(params.id as string);
        if (id === null) {
          return errorResponse("Invalid book id", 400);
        }

        const result = await db.select().from(books).where(eq(books.id, id));
        if (result.length === 0) {
          return errorResponse("Book not found", 404);
        }
        return jsonResponse(result[0]);
      },
      // PUT /api/books/:id — update a book
      put: async ({ params, request }) => {
        const id = parseId(params.id as string);
        if (id === null) {
          return errorResponse("Invalid book id", 400);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("Invalid JSON body", 400);
        }

        const { title, author } = body as { title?: string; author?: string };

        if (title === undefined && author === undefined) {
          return errorResponse("At least one of title or author is required", 400);
        }

        const updateData: Record<string, string> = {};
        if (title !== undefined) updateData.title = title;
        if (author !== undefined) updateData.author = author;

        const result = await db.update(books).set(updateData).where(eq(books.id, id)).returning();
        if (result.length === 0) {
          return errorResponse("Book not found", 404);
        }
        return jsonResponse(result[0]);
      },
      // DELETE /api/books/:id — delete a book
      delete: async ({ params }) => {
        const id = parseId(params.id as string);
        if (id === null) {
          return errorResponse("Invalid book id", 400);
        }

        const result = await db.delete(books).where(eq(books.id, id)).returning();
        if (result.length === 0) {
          return errorResponse("Book not found", 404);
        }
        return new Response(null, { status: 204 });
      },
    }),
  ]),
]);