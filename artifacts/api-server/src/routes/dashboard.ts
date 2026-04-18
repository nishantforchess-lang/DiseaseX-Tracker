import { Router, type IRouter } from "express";
import { eq, gte, count, sql } from "drizzle-orm";
import { db, patientsTable, assessmentsTable, outbreakAlertsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetPatientQueueResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    activeResult,
    todayResult,
    outbreakResult,
    referralResult,
    firstDoseResult,
    atypicalResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(patientsTable).where(eq(patientsTable.status, "active")),
    db.select({ count: count() }).from(assessmentsTable).where(gte(assessmentsTable.createdAt, startOfDay)),
    db.select({ count: count() }).from(outbreakAlertsTable).where(eq(outbreakAlertsTable.status, "active")),
    db.select({ count: count() }).from(patientsTable).where(eq(patientsTable.status, "referred")),
    db.select({ count: count() }).from(assessmentsTable).where(sql`${assessmentsTable.firstDoseAt} IS NOT NULL`),
    db.select({ count: count() }).from(assessmentsTable).where(
      sql`${assessmentsTable.isAtypical} = true AND ${assessmentsTable.createdAt} >= ${oneWeekAgo}`
    ),
  ]);

  const allActiveAssessments = await db
    .select()
    .from(assessmentsTable)
    .innerJoin(patientsTable, eq(assessmentsTable.patientId, patientsTable.id))
    .where(eq(patientsTable.status, "active"));

  let criticalCases = 0;
  for (const row of allActiveAssessments) {
    const matches = row.assessments.patternMatches as Array<{ confidencePercent: number }>;
    if (Array.isArray(matches) && matches.some((m) => m.confidencePercent >= 70)) {
      criticalCases++;
    }
  }

  const summary = {
    activeCases: activeResult[0]?.count ?? 0,
    assessmentsToday: todayResult[0]?.count ?? 0,
    activeOutbreakAlerts: outbreakResult[0]?.count ?? 0,
    criticalCases,
    referralsPending: referralResult[0]?.count ?? 0,
    firstDosesAdministered: firstDoseResult[0]?.count ?? 0,
    atypicalCasesThisWeek: atypicalResult[0]?.count ?? 0,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/patient-queue", async (_req, res): Promise<void> => {
  const activePatients = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.status, "active"))
    .orderBy(patientsTable.createdAt);

  const queue = await Promise.all(
    activePatients.map(async (patient) => {
      const assessments = await db
        .select()
        .from(assessmentsTable)
        .where(eq(assessmentsTable.patientId, patient.id))
        .orderBy(assessmentsTable.createdAt);

      const latestAssessment = assessments[assessments.length - 1];

      if (!latestAssessment) return null;

      const matches = latestAssessment.patternMatches as Array<{
        disease: string;
        confidencePercent: number;
        reasoning: string;
        protocolId: number | null;
      }>;

      const topMatch = matches?.[0] ?? null;
      const topConfidence = topMatch?.confidencePercent ?? 0;

      let urgency: "low" | "monitor" | "critical";
      if (topConfidence >= 70 || latestAssessment.isAtypical) {
        urgency = "critical";
      } else if (topConfidence >= 40) {
        urgency = "monitor";
      } else {
        urgency = "low";
      }

      return {
        patient,
        latestAssessment,
        topMatch: topMatch ?? undefined,
        urgency,
      };
    }),
  );

  const filtered = queue.filter((q): q is NonNullable<typeof q> => q !== null);
  res.json(GetPatientQueueResponse.parse(filtered));
});

export default router;
