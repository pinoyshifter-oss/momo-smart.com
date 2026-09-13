import { z } from "zod";

import { createTRPCRouter, superadminProcedure } from "~/server/api/trpc";

export const WAITLIST_PAGE_SIZE = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Early-access requests captured by the public /demo page. */
export const waitlistRouter = createTRPCRouter({
  /** One page of entries, newest first, plus headline counts. */
  list: superadminProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - 7 * DAY_MS);

      const [total, lastWeek, byRole, entries] = await Promise.all([
        ctx.db.waitlistEntry.count(),
        ctx.db.waitlistEntry.count({ where: { createdAt: { gte: since } } }),
        ctx.db.waitlistEntry.groupBy({ by: ["role"], _count: { _all: true } }),
        ctx.db.waitlistEntry.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (input.page - 1) * WAITLIST_PAGE_SIZE,
          take: WAITLIST_PAGE_SIZE,
        }),
      ]);

      return {
        total,
        lastWeek,
        byRole: byRole
          .map((group) => ({ role: group.role, count: group._count._all }))
          .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role)),
        entries,
        page: input.page,
        pageSize: WAITLIST_PAGE_SIZE,
        pageCount: Math.max(1, Math.ceil(total / WAITLIST_PAGE_SIZE)),
      };
    }),
});
