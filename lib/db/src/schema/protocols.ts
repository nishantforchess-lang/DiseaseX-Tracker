import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const protocolsTable = pgTable("protocols", {
  id: serial("id").primaryKey(),
  disease: text("disease").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  immediateAction: text("immediate_action").notNull(),
  steps: text("steps").array().notNull().default([]),
  referralThreshold: text("referral_threshold").notNull(),
  dosageFormula: text("dosage_formula"),
  drugs: text("drugs").array().notNull().default([]),
  whoBased: boolean("who_based").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProtocolSchema = createInsertSchema(protocolsTable).omit({ id: true, createdAt: true });
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type Protocol = typeof protocolsTable.$inferSelect;
