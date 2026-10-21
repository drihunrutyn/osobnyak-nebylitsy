import { ORPCError } from "@orpc/server";
import { and, eq, gte, count, countDistinct, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import * as s from "../database/schema";
import { withVisitor } from "../middleware/visitor";
import { ROLE_NAMES, SECTION_IDS, ACTION_LABELS } from "../../shared/event";

export const event = {
  state: withVisitor.handler(async ({ context }) => {
    const id = context.visitorId;
    const [total, ownVotes, roles, supplies, comments, ready] = await Promise.all([
      db.select({ total: count() }).from(s.votes),
      db.select().from(s.votes).where(eq(s.votes.visitorId, id)),
      db
        .select({ role: s.roleClaims.role })
        .from(s.roleClaims)
        .where(eq(s.roleClaims.visitorId, id)),
      db
        .select({ item: s.supplyClaims.item })
        .from(s.supplyClaims)
        .where(eq(s.supplyClaims.visitorId, id)),
      db.select({ text: s.comments.text }).from(s.comments).where(eq(s.comments.visitorId, id)),
      db
        .select({ item: s.supplyClaims.item, people: countDistinct(s.supplyClaims.visitorId) })
        .from(s.supplyClaims)
        .groupBy(s.supplyClaims.item),
    ]);
    return {
      votes: total[0].total,
      voted: ownVotes.length > 0,
      roles: roles.map((r) => r.role),
      supplies: supplies.map((r) => r.item),
      comments: comments.map((r) => r.text),
      ready,
    };
  }),
  vote: withVisitor.handler(async ({ context }) => {
    await db
      .insert(s.votes)
      .values({ visitorId: context.visitorId, createdAt: Date.now() })
      .onConflictDoNothing();
    return { saved: true };
  }),
  role: withVisitor
    .input(z.object({ role: z.enum(ROLE_NAMES), selected: z.boolean() }))
    .handler(async ({ context, input }) => {
      if (input.selected)
        await db
          .insert(s.roleClaims)
          .values({ visitorId: context.visitorId, role: input.role, createdAt: Date.now() })
          .onConflictDoNothing();
      else
        await db
          .delete(s.roleClaims)
          .where(
            and(eq(s.roleClaims.visitorId, context.visitorId), eq(s.roleClaims.role, input.role)),
          );
      return { saved: true };
    }),
  supply: withVisitor
    .input(z.object({ item: z.number().int().min(0).max(9), selected: z.boolean() }))
    .handler(async ({ context, input }) => {
      if (input.selected)
        await db
          .insert(s.supplyClaims)
          .values({ visitorId: context.visitorId, item: input.item, createdAt: Date.now() })
          .onConflictDoNothing();
      else
        await db
          .delete(s.supplyClaims)
          .where(
            and(
              eq(s.supplyClaims.visitorId, context.visitorId),
              eq(s.supplyClaims.item, input.item),
            ),
          );
      return { saved: true };
    }),
  comment: withVisitor
    .input(z.object({ text: z.string().trim().min(1).max(600) }))
    .handler(async ({ context, input }) => {
      const [recent] = await db
        .select({ total: count() })
        .from(s.comments)
        .where(
          and(
            eq(s.comments.visitorId, context.visitorId),
            gte(s.comments.createdAt, Date.now() - 3600000),
          ),
        );
      if (recent.total >= 10)
        throw new ORPCError("TOO_MANY_REQUESTS", {
          message: "Не больше 10 записок в час. Дайте сейфу передохнуть.",
        });
      await db
        .insert(s.comments)
        .values({
          id: crypto.randomUUID(),
          visitorId: context.visitorId,
          text: input.text,
          createdAt: Date.now(),
        });
      return { saved: true };
    }),
  visit: withVisitor
    .input(
      z.object({
        id: z.string().uuid(),
        source: z.string().max(120),
        campaign: z.string().max(120),
        medium: z.string().max(80),
        device: z.enum(["mobile", "tablet", "desktop"]),
        browser: z.string().max(40),
      }),
    )
    .handler(async ({ context, input }) => {
      const [recent] = await db
        .select({ total: count() })
        .from(s.visits)
        .where(
          and(
            eq(s.visits.visitorId, context.visitorId),
            gte(s.visits.createdAt, Date.now() - 86400000),
          ),
        );
      if (recent.total >= 100) throw new ORPCError("TOO_MANY_REQUESTS");
      await db
        .insert(s.visits)
        .values({ ...input, visitorId: context.visitorId, createdAt: Date.now() })
        .onConflictDoNothing();
      return { saved: true };
    }),
  track: withVisitor
    .input(
      z.object({
        id: z.string().uuid(),
        visitId: z.string().uuid(),
        kind: z.enum(["section", "action"]),
        label: z.enum([...SECTION_IDS, ...ACTION_LABELS]),
      }),
    )
    .handler(async ({ context, input }) => {
      const [visit] = await db
        .select({ id: s.visits.id })
        .from(s.visits)
        .where(and(eq(s.visits.id, input.visitId), eq(s.visits.visitorId, context.visitorId)));
      if (!visit) throw new ORPCError("NOT_FOUND");
      const [recent] = await db
        .select({ total: count() })
        .from(s.events)
        .where(
          and(
            eq(s.events.visitorId, context.visitorId),
            gte(s.events.createdAt, Date.now() - 86400000),
          ),
        );
      if (recent.total >= 2000) throw new ORPCError("TOO_MANY_REQUESTS");
      await db
        .insert(s.events)
        .values({ ...input, visitorId: context.visitorId, createdAt: Date.now() })
        .onConflictDoNothing();
      return { saved: true };
    }),
  heartbeat: withVisitor
    .input(z.object({ visitId: z.string().uuid(), seconds: z.number().int().min(0).max(86400) }))
    .handler(async ({ context, input }) => {
      await db
        .update(s.visits)
        .set({ activeSeconds: sql`max(${s.visits.activeSeconds}, ${input.seconds})` })
        .where(and(eq(s.visits.id, input.visitId), eq(s.visits.visitorId, context.visitorId)));
      return { saved: true };
    }),
};
