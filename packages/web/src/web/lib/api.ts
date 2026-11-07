import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouterClient } from "../../api";
import { adminToken, visitorToken } from "./identity";
import { apiOrigin, isPublicPages } from "./site";

const link = new RPCLink({
  url: `${apiOrigin}/api/rpc`,
  headers: () => {
    const token = isPublicPages ? "" : adminToken();
    return {
      "x-visitor-token": visitorToken(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },
});

/** Direct typed client: await client.ping() */
export const client: AppRouterClient = createORPCClient(link);

/** TanStack Query helpers: useQuery(orpc.ping.queryOptions()) */
export const orpc = createTanstackQueryUtils(client);
