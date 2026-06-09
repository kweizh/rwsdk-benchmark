import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
