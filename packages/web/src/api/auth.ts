import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, username } from "better-auth/plugins";
import { db } from "./database";

export const ADMIN_ID = "nebylitsy-organizer";
export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.WEBSITE_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, disableSignUp: true },
  session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 60 },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 20,
    customRules: {
      "/sign-in/username": { window: 300, max: 5 },
      "/sign-in/email": { window: 300, max: 5 },
    },
  },
  trustedOrigins: (request) => {
    const own = process.env.WEBSITE_URL;
    const requestOrigin = request ? new URL(request.url).origin : null;
    return [own, requestOrigin].filter((value): value is string => Boolean(value));
  },
  plugins: [bearer(), username({ usernameValidator: (value) => /^[\p{L}\p{N}_-]+$/u.test(value) })],
});
