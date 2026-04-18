import { pgTable, text, serial, timestamp, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assessmentsTable = pgTable("assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  symptoms: text("symptoms").array().notNull().default([]),
  tempCelsius: real("temp_celsius"),
  heartRateBpm: integer("heart_rate_bpm"),
  spo2Percent: integer("spo2_percent"),
  durationDays: integer("duration_days"),
  patternMatches: jsonb("pattern_matches").notNull().default([]),
  isAtypical: boolean("is_atypical").notNull().default(false),
  firstDoseAt: timestamp("first_dose_at", { withTimezone: true }),
  firstDoseDrug: text("first_dose_drug"),
  referralAt: timestamp("referral_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAssessmentSchema = createInsertSchema(assessmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessmentsTable.$inferSelect;
