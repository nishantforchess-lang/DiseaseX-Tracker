import { Router, type IRouter } from "express";
import { db, outbreakAlertsTable } from "@workspace/db";
import {
  ListOutbreakAlertsResponse,
  CreateOutbreakAlertBody,
  GetDashboardSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/outbreaks", async (_req, res): Promise<void> => {
  const alerts = await db.select().from(outbreakAlertsTable).orderBy(outbreakAlertsTable.reportedAt);
  res.json(ListOutbreakAlertsResponse.parse(alerts));
});

router.post("/outbreaks", async (req, res): Promise<void> => {
  const parsed = CreateOutbreakAlertBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid outbreak body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [alert] = await db
    .insert(outbreakAlertsTable)
    .values({
      ...parsed.data,
      status: "active",
    })
    .returning();

  res.status(201).json(alert);
});

export { GetDashboardSummaryResponse };
export default router;
