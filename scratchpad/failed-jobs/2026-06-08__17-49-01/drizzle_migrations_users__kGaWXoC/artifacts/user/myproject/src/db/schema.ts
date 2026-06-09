import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at").notNull(),
  displayName: text("display_name"),
});
