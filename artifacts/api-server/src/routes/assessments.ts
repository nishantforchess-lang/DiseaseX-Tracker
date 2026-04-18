import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, assessmentsTable, patientsTable } from "@workspace/db";
import {
  ListAssessmentsQueryParams,
  ListAssessmentsResponse,
  CreateAssessmentBody,
  GetAssessmentParams,
  GetAssessmentResponse,
  LogFirstDoseParams,
  LogFirstDoseBody,
  LogFirstDoseResponse,
} from "@workspace/api-zod";
import { runPatternMatcher } from "../lib/pattern-matcher";

const router: IRouter = Router();

router.get("/assessments", async (req, res): Promise<void> => {
  const query = ListAssessmentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let assessments;
  if (query.data.patientId) {
    assessments = await db
      .select()
      .from(assessmentsTable)
      .where(eq(assessmentsTable.patientId, query.data.patientId))
      .orderBy(assessmentsTable.createdAt);
  } else {
    assessments = await db.select().from(assessmentsTable).orderBy(assessmentsTable.createdAt);
  }

  res.json(ListAssessmentsResponse.parse(assessments));
});

router.post("/assessments", async (req, res): Promise<void> => {
  const parsed = CreateAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid assessment body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { patternMatches, isAtypical } = runPatternMatcher(
    parsed.data.symptoms,
    parsed.data.tempCelsius,
    parsed.data.heartRateBpm,
    parsed.data.spo2Percent,
  );

  const [assessment] = await db
    .insert(assessmentsTable)
    .values({
      patientId: parsed.data.patientId,
      symptoms: parsed.data.symptoms,
      tempCelsius: parsed.data.tempCelsius ?? null,
      heartRateBpm: parsed.data.heartRateBpm ?? null,
      spo2Percent: parsed.data.spo2Percent ?? null,
      durationDays: parsed.data.durationDays ?? null,
      notes: parsed.data.notes ?? null,
      patternMatches,
      isAtypical,
    })
    .returning();

  res.status(201).json(GetAssessmentResponse.parse(assessment));
});

router.get("/assessments/:id", async (req, res): Promise<void> => {
  const params = GetAssessmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [assessment] = await db
    .select()
    .from(assessmentsTable)
    .where(eq(assessmentsTable.id, params.data.id));

  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  res.json(GetAssessmentResponse.parse(assessment));
});

router.post("/assessments/:id/first-dose", async (req, res): Promise<void> => {
  const params = LogFirstDoseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = LogFirstDoseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [assessment] = await db
    .update(assessmentsTable)
    .set({
      firstDoseAt: new Date(),
      firstDoseDrug: parsed.data.drug,
      updatedAt: new Date(),
    })
    .where(and(eq(assessmentsTable.id, params.data.id)))
    .returning();

  if (!assessment) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  res.json(LogFirstDoseResponse.parse(assessment));
});

export default router;
