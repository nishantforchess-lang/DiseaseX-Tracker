import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const outbreakAlertsTable = pgTable("outbreak_alerts", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  symptomsSummary: text("symptoms_summary").notNull(),
  status: text("status").notNull().default("active"),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertOutbreakAlertSchema = createInsertSchema(outbreakAlertsTable).omit({ id: true, reportedAt: true });
export type InsertOutbreakAlert = z.infer<typeof insertOutbreakAlertSchema>;
export type OutbreakAlert = typeof outbreakAlertsTable.$inferSelect;
