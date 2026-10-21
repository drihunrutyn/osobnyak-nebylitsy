import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { adminToken } from "./identity";
export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/api/auth",
  plugins: [usernameClient()],
  fetchOptions: { auth: { type: "Bearer", token: adminToken } },
});
