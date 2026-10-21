import { and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import * as s from "../database/schema";
import { adminOnly } from "../middleware/auth";

const range = z
  .object({ from: z.iso.date(), to: z.iso.date() })
  .refine((v) => v.from <= v.to, { message: "Дата начала должна быть раньше даты окончания" });
function group(rows: { label: string }[]) {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.label, (counts.get(row.label) || 0) + 1);
  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count,
  );
}
const day = (time: number) => new Date(time + 3 * 3600000).toISOString().slice(0, 10);
export const admin = {
  me: adminOnly.handler(({ context }) => ({ name: context.user.name })),
  stats: adminOnly.input(range).handler(async ({ input }) => {
    const start = new Date(input.from + "T00:00:00+03:00").getTime();
    const end = new Date(input.to + "T23:59:59.999+03:00").getTime();
    const [visits, actions, votes, roles, supplies, comments, first] = await Promise.all([
      db
        .select()
        .from(s.visits)
        .where(and(gte(s.visits.createdAt, start), lte(s.visits.createdAt, end))),
      db
        .select()
        .from(s.events)
        .where(and(gte(s.events.createdAt, start), lte(s.events.createdAt, end))),
      db
        .select()
        .from(s.votes)
        .where(and(gte(s.votes.createdAt, start), lte(s.votes.createdAt, end))),
      db
        .select()
        .from(s.roleClaims)
        .where(and(gte(s.roleClaims.createdAt, start), lte(s.roleClaims.createdAt, end))),
      db
        .select()
        .from(s.supplyClaims)
        .where(and(gte(s.supplyClaims.createdAt, start), lte(s.supplyClaims.createdAt, end))),
      db
        .select({ text: s.comments.text, createdAt: s.comments.createdAt })
        .from(s.comments)
        .where(and(gte(s.comments.createdAt, start), lte(s.comments.createdAt, end)))
        .orderBy(s.comments.createdAt),
      db
        .select({ createdAt: s.visits.createdAt })
        .from(s.visits)
        .orderBy(s.visits.createdAt)
        .limit(1),
    ]);
    const unique = new Set(visits.map((v) => v.visitorId)).size;
    const dailyMap = new Map<
      string,
      { date: string; visits: number; unique: Set<string>; votes: number }
    >();
    for (const v of visits) {
      const key = day(v.createdAt);
      const d = dailyMap.get(key) || { date: key, visits: 0, unique: new Set<string>(), votes: 0 };
      d.visits++;
      d.unique.add(v.visitorId);
      dailyMap.set(key, d);
    }
    for (const v of votes) {
      const key = day(v.createdAt);
      const d = dailyMap.get(key) || { date: key, visits: 0, unique: new Set<string>(), votes: 0 };
      d.votes++;
      dailyMap.set(key, d);
    }
    const eligibleVotes = votes.filter((v) =>
      visits.some((visit) => visit.visitorId === v.visitorId),
    ).length;
    return {
      from: input.from,
      to: input.to,
      collectedSince: first[0]?.createdAt ?? null,
      refreshedAt: Date.now(),
      overview: {
        visits: visits.length,
        unique,
        votes: votes.length,
        conversion: unique ? (eligibleVotes / unique) * 100 : 0,
        missions: actions.filter((a) => a.label === "mission" && a.kind === "action").length,
        comments: comments.length,
        rolePeople: new Set(roles.map((r) => r.visitorId)).size,
        supplyItems: new Set(supplies.map((r) => r.item)).size,
        averageSeconds: visits.length
          ? Math.round(visits.reduce((sum, v) => sum + v.activeSeconds, 0) / visits.length)
          : 0,
      },
      daily: Array.from(dailyMap.values())
        .map((d) => ({ ...d, unique: d.unique.size }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      sources: group(visits.map((v) => ({ label: v.source || "Прямой переход" }))),
      devices: group(visits.map((v) => ({ label: v.device }))),
      browsers: group(visits.map((v) => ({ label: v.browser }))),
      campaigns: group(
        visits
          .filter((v) => v.campaign)
          .map((v) => ({ label: `${v.campaign} / ${v.medium || "без medium"}` })),
      ),
      sections: group(actions.filter((a) => a.kind === "section").map((a) => ({ label: a.label }))),
      actions: group(actions.filter((a) => a.kind === "action").map((a) => ({ label: a.label }))),
      roles: group(roles.map((r) => ({ label: r.role }))),
      supplies: group(supplies.map((r) => ({ label: String(r.item) }))),
      comments: comments.reverse(),
    };
  }),
};
