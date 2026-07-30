// src/dashboard/routes.ts
// Speculative module, built on explicit override -- see Documents/HANDOFF.md.
// Deliberately just aggregates existing cases/disputes data -- no new schema.
import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware";
import { getPool } from "../db/pool";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.use(requireRole("coach", "admin"));

dashboardRouter.get("/", async (_req, res) => {
  const pool = getPool();
  const [cases, avgDaysOpen, disputes] = await Promise.all([
    pool.query(
      `SELECT status, COUNT(*)::int AS count FROM cases GROUP BY status`
    ),
    pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, CURRENT_TIMESTAMP) - opened_at)) / 86400)::float AS avg_days
       FROM cases`
    ),
    pool.query(
      `SELECT status, COUNT(*)::int AS count FROM disputes GROUP BY status`
    ),
  ]);

  const caseCounts: Record<string, number> = {};
  for (const row of cases.rows) caseCounts[row.status] = row.count;

  const disputeCounts: Record<string, number> = {};
  for (const row of disputes.rows) disputeCounts[row.status] = row.count;

  res.json({
    activeCases: caseCounts.active ?? 0,
    closedCases: caseCounts.closed ?? 0,
    avgDaysOpen: avgDaysOpen.rows[0]?.avg_days ?? null,
    disputesByStatus: disputeCounts,
  });
});
