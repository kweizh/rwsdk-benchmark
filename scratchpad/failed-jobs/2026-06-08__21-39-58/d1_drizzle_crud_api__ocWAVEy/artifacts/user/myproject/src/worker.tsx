import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { env } from "cloudflare:workers";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { db } from "@/db/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },

  // API routes
  prefix("/api", [
    route("/books", {
      // GET /api/books — list all books
      get: async () => {
        const allBooks = await db.select().from(books).orderBy(books.id);
        return new Response(JSON.stringify(allBooks), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },

      // POST /api/books — create a book
      post: async ({ request }) => {
        let body: { title?: string; author?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON body" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const { title, author } = body;

        if (!title || typeof title !== "string" || title.trim().length === 0) {
          return new Response(
            JSON.stringify({ error: "title is required" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (
          !author ||
          typeof author !== "string" ||
          author.trim().length === 0
        ) {
          return new Response(
            JSON.stringify({ error: "author is required" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const [created] = await db
          .insert(books)
          .values({ title: title.trim(), author: author.trim() })
          .returning();

        return new Response(JSON.stringify(created), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      },
    }),

    route("/books/:id", {
      // GET /api/books/:id — get a single book
      get: async ({ params }) => {
        const id = parseInt(params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
          return new Response(
            JSON.stringify({ error: "Invalid book id" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const [book] = await db
          .select()
          .from(books)
          .where(eq(books.id, id));

        if (!book) {
          return new Response(
            JSON.stringify({ error: "Book not found" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        return new Response(JSON.stringify(book), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },

      // PUT /api/books/:id — update a book
      put: async ({ request, params }) => {
        const id = parseInt(params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
          return new Response(
            JSON.stringify({ error: "Invalid book id" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        let body: { title?: string; author?: string };
        try {
          body = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON body" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const { title, author } = body;

        if (
          (!title || typeof title !== "string" || title.trim().length === 0) &&
          (!author ||
            typeof author !== "string" ||
            author.trim().length === 0)
        ) {
          return new Response(
            JSON.stringify({
              error: "At least one of title or author is required",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        // Check if book exists
        const [existing] = await db
          .select()
          .from(books)
          .where(eq(books.id, id));

        if (!existing) {
          return new Response(
            JSON.stringify({ error: "Book not found" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const updateData: { title?: string; author?: string } = {};
        if (title && typeof title === "string" && title.trim().length > 0) {
          updateData.title = title.trim();
        }
        if (
          author &&
          typeof author === "string" &&
          author.trim().length > 0
        ) {
          updateData.author = author.trim();
        }

        const [updated] = await db
          .update(books)
          .set(updateData)
          .where(eq(books.id, id))
          .returning();

        return new Response(JSON.stringify(updated), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },

      // DELETE /api/books/:id — delete a book
      delete: async ({ params }) => {
        const id = parseInt(params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
          return new Response(
            JSON.stringify({ error: "Invalid book id" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const [existing] = await db
          .select()
          .from(books)
          .where(eq(books.id, id));

        if (!existing) {
          return new Response(
            JSON.stringify({ error: "Book not found" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        await db.delete(books).where(eq(books.id, id));

        return new Response(null, { status: 204 });
      },
    }),
  ]),

  // Page routes
  render(Document, [route("/", Home)]),
]);
