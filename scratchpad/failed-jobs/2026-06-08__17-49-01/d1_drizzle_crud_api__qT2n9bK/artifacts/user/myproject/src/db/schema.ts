import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  created_at: integer('created_at').notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});
