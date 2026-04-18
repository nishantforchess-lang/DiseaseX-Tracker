import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, protocolsTable } from "@workspace/db";
import {
  ListProtocolsQueryParams,
  ListProtocolsResponse,
  GetProtocolParams,
  GetProtocolResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/protocols", async (req, res): Promise<void> => {
  const query = ListProtocolsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let protocols;
  const { disease, search } = query.data;

  if (search) {
    protocols = await db
      .select()
      .from(protocolsTable)
      .where(
        or(
          ilike(protocolsTable.title, `%${search}%`),
          ilike(protocolsTable.disease, `%${search}%`),
        ),
      )
      .orderBy(protocolsTable.disease);
  } else if (disease) {
    protocols = await db
      .select()
      .from(protocolsTable)
      .where(ilike(protocolsTable.disease, `%${disease}%`))
      .orderBy(protocolsTable.disease);
  } else {
    protocols = await db.select().from(protocolsTable).orderBy(protocolsTable.disease);
  }

  res.json(ListProtocolsResponse.parse(protocols));
});

router.get("/protocols/:id", async (req, res): Promise<void> => {
  const params = GetProtocolParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [protocol] = await db.select().from(protocolsTable).where(eq(protocolsTable.id, params.data.id));
  if (!protocol) {
    res.status(404).json({ error: "Protocol not found" });
    return;
  }

  res.json(GetProtocolResponse.parse(protocol));
});

export default router;
