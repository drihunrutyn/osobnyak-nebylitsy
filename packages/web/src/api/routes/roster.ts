import { ORPCError } from "@orpc/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { participants, catalog, assignments, publications } from "../database/schema";
import { withVisitor } from "../middleware/visitor";
import { adminOnly } from "../middleware/auth";
import { BADGE_TITLES, type PublicResponsibility } from "../../shared/roster";

const name = z.string().trim().min(1, "Укажите имя").max(60);
const date = z.union([z.literal(""), z.iso.date()]).refine(v => !v || v <= new Date().toISOString().slice(0,10), { message: "Дата начала не может быть в будущем" });
const profile = z.object({ name, startedOn: date, badgeTitle: z.enum(BADGE_TITLES), joke: z.string().trim().max(100) });
const item = z.object({ id: z.number().int().positive().optional(), kind: z.enum(["role", "supply"]), title: z.string().trim().min(1).max(140), subtitle: z.string().trim().max(180), description: z.string().trim().max(600), active: z.boolean() });
async function own(visitorId: string) {
  const [p] = await db.select().from(participants).where(eq(participants.visitorId, visitorId));
  if (!p?.active) throw new ORPCError("BAD_REQUEST", { message: "Сначала сохраните своё имя в анкете участия" });
  return p;
}
async function validItem(id: number) {
  const [entry] = await db.select().from(catalog).where(eq(catalog.id, id));
  if (!entry?.active) throw new ORPCError("BAD_REQUEST", { message: "Эта роль или реквизит больше не доступны" });
  return entry;
}

export const roster = {
  state: withVisitor.handler(async ({ context }) => {
    const [entries, people, ownProfiles, publication, total] = await Promise.all([
      db.select().from(catalog).where(eq(catalog.active,true)).orderBy(catalog.id),
      db.select({catalogId: assignments.catalogId, people:count()}).from(assignments).innerJoin(participants,eq(participants.id,assignments.participantId)).where(eq(participants.active,true)).groupBy(assignments.catalogId),
      db.select().from(participants).where(eq(participants.visitorId, context.visitorId)),
      db.select().from(publications).where(eq(publications.id,1)),
      db.select({total:count()}).from(participants).where(eq(participants.active,true)),
    ]);
    const p = ownProfiles[0]?.active ? ownProfiles[0] : null;
    const claims = p ? await db.select().from(assignments).where(eq(assignments.participantId,p.id)) : [];
    return { entries, people, profile:p ? {name:p.name,startedOn:p.startedOn,badgeTitle:p.badgeTitle,joke:p.joke} : null, claims:claims.map(c=>({catalogId:c.catalogId,approved:c.approved})), total:total[0].total, published:publication[0] ? { at:publication[0].publishedAt, rows:JSON.parse(publication[0].rows) as PublicResponsibility[] } : null };
  }),
  saveProfile: withVisitor.input(profile).handler(async ({context,input}) => {
    const [existing] = await db.select().from(participants).where(eq(participants.visitorId,context.visitorId));
    if (existing) {
      if (!existing.active) throw new ORPCError("FORBIDDEN", {message:"Анкета находится в архиве. Обратитесь к организатору."});
      await db.update(participants).set(input).where(eq(participants.id,existing.id));
    } else await db.insert(participants).values({...input,id:crypto.randomUUID(),visitorId:context.visitorId,createdAt:Date.now()}).onConflictDoUpdate({target:participants.visitorId,set:input});
    return {saved:true};
  }),
  claim: withVisitor.input(z.object({catalogId:z.number().int().positive(),selected:z.boolean()})).handler(async ({context,input}) => {
    const p = await own(context.visitorId);
    await validItem(input.catalogId);
    if (input.selected) await db.insert(assignments).values({participantId:p.id,catalogId:input.catalogId,approved:false,createdAt:Date.now()}).onConflictDoNothing();
    else await db.delete(assignments).where(and(eq(assignments.participantId,p.id),eq(assignments.catalogId,input.catalogId)));
    return {saved:true};
  }),
};

export const rosterAdmin = {
  list: adminOnly.handler(async () => {
    const [profiles,entries,claims,pub] = await Promise.all([
      db.select().from(participants).orderBy(participants.createdAt), db.select().from(catalog).orderBy(catalog.id), db.select().from(assignments), db.select().from(publications).where(eq(publications.id,1)),
    ]);
    // No browser identifiers or secrets in the organizer UI.
    return {profiles:profiles.map(({visitorId:_visitorId,...p})=>p),entries,claims,publishedAt:pub[0]?.publishedAt ?? null};
  }),
  savePerson: adminOnly.input(profile.extend({id:z.string().uuid().optional(),active:z.boolean()})).handler(async ({input}) => {
    const {id,...values}=input;
    if(id) {
      const rows=await db.update(participants).set(values).where(eq(participants.id,id)).returning({id:participants.id});
      if(!rows.length) throw new ORPCError("NOT_FOUND");
    } else await db.insert(participants).values({...values,id:crypto.randomUUID(),createdAt:Date.now()});
    return {saved:true};
  }),
  saveItem: adminOnly.input(item).handler(async ({input}) => {
    const {id,...values}=input;
    if(id) {
      const rows=await db.update(catalog).set(values).where(eq(catalog.id,id)).returning({id:catalog.id});
      if(!rows.length) throw new ORPCError("NOT_FOUND");
    } else await db.insert(catalog).values(values);
    return {saved:true};
  }),
  assign: adminOnly.input(z.object({participantId:z.string().uuid(),catalogId:z.number().int().positive(),selected:z.boolean(),approved:z.boolean()})).handler(async ({input}) => {
    const [p]=await db.select().from(participants).where(eq(participants.id,input.participantId));
    if(!p?.active) throw new ORPCError("NOT_FOUND",{message:"Участник в архиве или не найден"});
    await validItem(input.catalogId);
    if(input.selected) await db.insert(assignments).values({participantId:input.participantId,catalogId:input.catalogId,approved:input.approved,createdAt:Date.now()}).onConflictDoUpdate({target:[assignments.participantId,assignments.catalogId],set:{approved:input.approved}});
    else await db.delete(assignments).where(and(eq(assignments.participantId,input.participantId),eq(assignments.catalogId,input.catalogId)));
    return {saved:true};
  }),
  publish: adminOnly.input(z.object({visible:z.boolean()})).handler(async ({input}) => {
    if(!input.visible) {await db.delete(publications).where(eq(publications.id,1)); return {saved:true};}
    const rows=await db.select({kind:catalog.kind,title:catalog.title,name:participants.name,catalogId:catalog.id}).from(assignments).innerJoin(catalog,eq(catalog.id,assignments.catalogId)).innerJoin(participants,eq(participants.id,assignments.participantId)).where(and(eq(assignments.approved,true),eq(catalog.active,true),eq(participants.active,true))).orderBy(catalog.id);
    const grouped = new Map<number,PublicResponsibility>();
    for(const r of rows) {const e=grouped.get(r.catalogId) ?? {kind:r.kind,title:r.title,names:[]}; e.names.push(r.name);grouped.set(r.catalogId,e);}
    const values={id:1,rows:JSON.stringify([...grouped.values()]),publishedAt:Date.now()};
    await db.insert(publications).values(values).onConflictDoUpdate({target:publications.id,set:values});
    return {saved:true};
  }),
};