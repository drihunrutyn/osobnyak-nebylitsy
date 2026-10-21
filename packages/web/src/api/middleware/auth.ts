import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { auth, ADMIN_ID } from "../auth";
export const adminOnly = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session)
    throw new ORPCError("UNAUTHORIZED", { message: "Войдите в кабинет администратора" });
  if (session.user.id !== ADMIN_ID) throw new ORPCError("FORBIDDEN");
  return next({ context: { user: session.user } });
});
