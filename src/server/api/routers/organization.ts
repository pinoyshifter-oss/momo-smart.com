import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const organizationRouter = createTRPCRouter({
  /**
   * Schools matching a name fragment, for the registration search. Public:
   * teachers search before they have an account. Only names, cities and
   * teacher counts are exposed.
   */
  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(2).max(80) }))
    .query(async ({ ctx, input }) => {
      const schools = await ctx.db.organization.findMany({
        where: { name: { contains: input.query, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: 8,
        select: {
          id: true,
          name: true,
          city: true,
          _count: { select: { teachers: true } },
        },
      });

      return schools.map(({ _count, ...school }) => ({
        ...school,
        teacherCount: _count.teachers,
      }));
    }),
});
