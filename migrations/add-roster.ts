// Additive migration: never alters or deletes legacy tables.
import { createClient } from "@libsql/client";
import { roles, supplies } from "../packages/web/src/web/pages/content";
const client=createClient({url:process.env.DATABASE_URL!,authToken:process.env.DATABASE_AUTH_TOKEN});
const before: Record<string,number>={};
for(const table of ["event_votes","event_roles","event_supplies","event_comments"]){const r=await client.execute(`select count(*) as n from ${table}`);before[table]=Number(r.rows[0].n);}
await client.batch([
  `CREATE TABLE IF NOT EXISTS roster_participants (id text PRIMARY KEY NOT NULL, visitor_id text UNIQUE, name text NOT NULL, started_on text NOT NULL DEFAULT '', badge_title text NOT NULL DEFAULT 'смотрящий', joke text NOT NULL DEFAULT 'Выгорание — не приговор', active integer NOT NULL DEFAULT 1, created_at integer NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS roster_catalog (id integer PRIMARY KEY AUTOINCREMENT, kind text NOT NULL, title text NOT NULL, subtitle text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', active integer NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS roster_assignments (participant_id text NOT NULL REFERENCES roster_participants(id), catalog_id integer NOT NULL REFERENCES roster_catalog(id), approved integer NOT NULL DEFAULT 0, created_at integer NOT NULL, PRIMARY KEY(participant_id,catalog_id))`,
  `CREATE TABLE IF NOT EXISTS roster_publications (id integer PRIMARY KEY NOT NULL, rows text NOT NULL, published_at integer NOT NULL)`,
  ...roles.map(([title,subtitle,description],i)=>({sql:`INSERT OR IGNORE INTO roster_catalog (id,kind,title,subtitle,description) VALUES (?,'role',?,?,?)`,args:[i+1,title,subtitle,description]})),
  ...supplies.map((title,i)=>({sql:`INSERT OR IGNORE INTO roster_catalog (id,kind,title) VALUES (?,'supply',?)`,args:[101+i,title]})),
],"write");
for(const [table,n] of Object.entries(before)){const r=await client.execute(`select count(*) as n from ${table}`);if(Number(r.rows[0].n)!==n)throw new Error(`Concurrent writes or unexpected change in ${table}; inspect before claiming unchanged`);}
console.log('Additive migration complete; legacy counts unchanged',before);
client.close();