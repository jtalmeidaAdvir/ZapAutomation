import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const authorizedNumbers = pgTable("authorized_numbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull().unique(),
  label: text("label").notNull(),
  dateAdded: timestamp("date_added").notNull().default(sql`now()`),
});

export const insertAuthorizedNumberSchema = createInsertSchema(authorizedNumbers).omit({
  id: true,
  dateAdded: true,
});

export type InsertAuthorizedNumber = z.infer<typeof insertAuthorizedNumberSchema>;
export type AuthorizedNumber = typeof authorizedNumbers.$inferSelect;

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  content: text("content").notNull(),
  direction: text("direction").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  password: text("password").notNull(),
  company: text("company").notNull(),
  instance: text("instance").notNull(),
  line: text("line").notNull(),
  grantType: text("grant_type").notNull(),
});

export const insertSettingsSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(1, "Password é obrigatório"),
  company: z.string().min(1, "Company é obrigatório"),
  url: z.string().url("URL inválido").min(1, "URL é obrigatório"),
  instance: z.string().min(1, "Instance é obrigatório"),
  line: z.string().min(1, "Line é obrigatório"),
  grantType: z.string().min(1, "Grant Type é obrigatório"),
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;