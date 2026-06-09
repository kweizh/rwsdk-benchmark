import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  created_at: integer("created_at").notNull(),
  display_name: text("display_name"),
});
