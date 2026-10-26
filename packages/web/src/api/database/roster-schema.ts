import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const participants = sqliteTable("roster_participants", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id").unique(),
  name: text("name").notNull(),
  startedOn: text("started_on").notNull().default(""),
  badgeTitle: text("badge_title").notNull().default("смотрящий"),
  joke: text("joke").notNull().default("Выгорание — не приговор"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});
export const catalog = sqliteTable("roster_catalog", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});
export const assignments = sqliteTable("roster_assignments", {
  participantId: text("participant_id").notNull().references(() => participants.id),
  catalogId: integer("catalog_id").notNull().references(() => catalog.id),
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
}, (t) => [primaryKey({ columns: [t.participantId, t.catalogId] })]);
export const publications = sqliteTable("roster_publications", {
  id: integer("id").primaryKey(),
  rows: text("rows").notNull(),
  publishedAt: integer("published_at").notNull(),
});