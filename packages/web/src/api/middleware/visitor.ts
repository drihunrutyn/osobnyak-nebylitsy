import { createHash } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { db } from "../database";
import { visitors } from "../database/schema";
// Браузер хранит случайный секрет. В БД только SHA-256: идентификатор не даёт доступа к чужим данным.
export const withVisitor = base.use(async ({ context, next }) => {
  const token = context.headers.get("x-visitor-token");
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new ORPCError("UNAUTHORIZED");
  const visitorId = createHash("sha256").update(token).digest("hex");
  await db.insert(visitors).values({ id: visitorId, createdAt: Date.now() }).onConflictDoNothing();
  return next({ context: { visitorId } });
});
