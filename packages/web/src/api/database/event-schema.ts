import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
export const visitors = sqliteTable("event_visitors", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at").notNull(),
});
export const visits = sqliteTable(
  "event_visits",
  {
    id: text("id").primaryKey(),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    createdAt: integer("created_at").notNull(),
    source: text("source").notNull(),
    campaign: text("campaign").notNull(),
    medium: text("medium").notNull(),
    device: text("device").notNull(),
    browser: text("browser").notNull(),
    activeSeconds: integer("active_seconds").notNull().default(0),
  },
  (table) => [index("visits_date_idx").on(table.createdAt)],
);
export const events = sqliteTable(
  "event_actions",
  {
    id: text("id").primaryKey(),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    visitId: text("visit_id")
      .notNull()
      .references(() => visits.id),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("actions_date_idx").on(table.createdAt)],
);
export const votes = sqliteTable("event_votes", {
  visitorId: text("visitor_id")
    .primaryKey()
    .references(() => visitors.id),
  createdAt: integer("created_at").notNull(),
});
export const roleClaims = sqliteTable(
  "event_roles",
  {
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    role: text("role").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.visitorId, table.role] })],
);
export const supplyClaims = sqliteTable(
  "event_supplies",
  {
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    item: integer("item").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.visitorId, table.item] })],
);
export const comments = sqliteTable(
  "event_comments",
  {
    id: text("id").primaryKey(),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitors.id),
    text: text("text").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("comments_date_idx").on(table.createdAt)],
);
