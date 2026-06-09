import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";
import { db } from "./db/db";
import { books } from "./db/schema";
import { eq, asc } from "drizzle-orm";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  prefix("/api", [
    route("/books", {
      get: async () => {
        try {
          const allBooks = await db.select().from(books).orderBy(asc(books.id));
          return Response.json(allBooks);
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      },
      post: async ({ request }) => {
        try {
          let body: any;
          try {
            body = await request.json();
          } catch (e) {
            return Response.json({ error: "Invalid JSON body" }, { status: 400 });
          }

          if (!body || typeof body !== "object") {
            return Response.json({ error: "Invalid body" }, { status: 400 });
          }

          const { title, author } = body;
          if (typeof title !== "string" || !title.trim() || typeof author !== "string" || !author.trim()) {
            return Response.json({ error: "Title and author are required" }, { status: 400 });
          }

          const [insertedBook] = await db.insert(books).values({
            title: title.trim(),
            author: author.trim()
          }).returning();

          return Response.json(insertedBook, { status: 201 });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }
    }),
    route("/books/:id", {
      get: async ({ params }) => {
        try {
          const id = Number(params.id);
          if (!Number.isInteger(id) || id <= 0) {
            return Response.json({ error: "Invalid ID" }, { status: 400 });
          }

          const [book] = await db.select().from(books).where(eq(books.id, id));
          if (!book) {
            return Response.json({ error: "Book not found" }, { status: 404 });
          }

          return Response.json(book);
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      },
      put: async ({ request, params }) => {
        try {
          const id = Number(params.id);
          if (!Number.isInteger(id) || id <= 0) {
            return Response.json({ error: "Invalid ID" }, { status: 400 });
          }

          let body: any;
          try {
            body = await request.json();
          } catch (e) {
            return Response.json({ error: "Invalid JSON body" }, { status: 400 });
          }

          if (!body || typeof body !== "object") {
            return Response.json({ error: "Invalid body" }, { status: 400 });
          }

          const updateData: Partial<{ title: string; author: string }> = {};

          if ("title" in body) {
            if (typeof body.title !== "string" || !body.title.trim()) {
              return Response.json({ error: "Title cannot be empty" }, { status: 400 });
            }
            updateData.title = body.title.trim();
          }

          if ("author" in body) {
            if (typeof body.author !== "string" || !body.author.trim()) {
              return Response.json({ error: "Author cannot be empty" }, { status: 400 });
            }
            updateData.author = body.author.trim();
          }

          if (Object.keys(updateData).length === 0) {
            return Response.json({ error: "At least one of title or author is required" }, { status: 400 });
          }

          const [existingBook] = await db.select().from(books).where(eq(books.id, id));
          if (!existingBook) {
            return Response.json({ error: "Book not found" }, { status: 404 });
          }

          const [updatedBook] = await db.update(books).set(updateData).where(eq(books.id, id)).returning();
          return Response.json(updatedBook, { status: 200 });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      },
      delete: async ({ params }) => {
        try {
          const id = Number(params.id);
          if (!Number.isInteger(id) || id <= 0) {
            return Response.json({ error: "Invalid ID" }, { status: 400 });
          }

          const [existingBook] = await db.select().from(books).where(eq(books.id, id));
          if (!existingBook) {
            return Response.json({ error: "Book not found" }, { status: 404 });
          }

          await db.delete(books).where(eq(books.id, id));
          return new Response(null, { status: 204 });
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 500 });
        }
      }
    })
  ]),
  render(Document, [route("/", Home)]),
]);
