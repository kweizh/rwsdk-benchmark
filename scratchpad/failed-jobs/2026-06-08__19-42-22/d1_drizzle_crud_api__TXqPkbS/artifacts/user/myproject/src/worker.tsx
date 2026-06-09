import { render, route, prefix } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";

import { Document } from "@/app/document";
import { setCommonHeaders } from "@/app/headers";
import { Home } from "@/app/pages/home";

import { getDb } from "./db/db";
import { books } from "./db/schema";
import { eq } from "drizzle-orm";

export type AppContext = {};

export default defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    // setup ctx here
    ctx;
  },
  prefix("/api", [
    route("/books", {
      async get() {
        const db = getDb();
        const allBooks = await db.select().from(books).orderBy(books.id).all();
        return new Response(JSON.stringify(allBooks), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      },
      async post({ request }) {
        try {
          const body = await request.json() as any;
          if (!body.title || !body.author) {
            return new Response(JSON.stringify({ error: "Missing title or author" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          const db = getDb();
          const [newBook] = await db.insert(books).values({
            title: body.title,
            author: body.author,
          }).returning();
          return new Response(JSON.stringify(newBook), {
            status: 201,
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: "Bad request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }),
    route("/books/:id", {
      async get({ params }) {
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id <= 0) {
          return new Response(JSON.stringify({ error: "Invalid id" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        const db = getDb();
        const [book] = await db.select().from(books).where(eq(books.id, id)).all();
        if (!book) {
          return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify(book), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      },
      async put({ params, request }) {
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id <= 0) {
          return new Response(JSON.stringify({ error: "Invalid id" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        try {
          const body = await request.json() as any;
          if (!body.title && !body.author) {
            return new Response(JSON.stringify({ error: "Missing title or author" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          const db = getDb();
          
          const [book] = await db.select().from(books).where(eq(books.id, id)).all();
          if (!book) {
            return new Response(JSON.stringify({ error: "Not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          const [updatedBook] = await db.update(books)
            .set({
              title: body.title !== undefined ? body.title : book.title,
              author: body.author !== undefined ? body.author : book.author,
            })
            .where(eq(books.id, id))
            .returning();
            
          return new Response(JSON.stringify(updatedBook), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: "Bad request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      },
      async delete({ params }) {
        const id = parseInt(params.id, 10);
        if (isNaN(id) || id <= 0) {
          return new Response(JSON.stringify({ error: "Invalid id" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        const db = getDb();
        
        const [book] = await db.select().from(books).where(eq(books.id, id)).all();
        if (!book) {
          return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        await db.delete(books).where(eq(books.id, id)).run();
        
        return new Response(null, {
          status: 204
        });
      }
    })
  ]),
  render(Document, [route("/", Home)]),
]);
