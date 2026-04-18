import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import assessmentsRouter from "./assessments";
import protocolsRouter from "./protocols";
import outbreaksRouter from "./outbreaks";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(assessmentsRouter);
router.use(protocolsRouter);
router.use(outbreaksRouter);
router.use(dashboardRouter);

export default router;
