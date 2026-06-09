import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const books = sqliteTable('books', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});
