import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users-test", {
  id: integer().primaryKey().generatedByDefaultAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});
