import { dash, sentinel } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { Pool } from "pg";
import { z } from "zod";

import { sendOrganizationInvitationMail } from "@/lib/organization-invitation-mail";

const isNextProductionBuild =
  process.env["NEXT_PHASE"] === "phase-production-build";

const authSecretSchema = z.string().min(32);

const resolveAuthSecret = (): string => {
  const parsed = authSecretSchema.safeParse(process.env.BETTER_AUTH_SECRET);
  if (parsed.success) {
    return parsed.data;
  }
  if (process.env.NODE_ENV === "production" && !isNextProductionBuild) {
    throw new Error(
      "BETTER_AUTH_SECRET must be set to a random string of at least 32 characters in production.",
    );
  }
  if (process.env.NODE_ENV === "production" && isNextProductionBuild) {
    return "next-build-placeholder-secret-32chars!!";
  }
  return "local-development-secret-min-32-characters!";
};

const databaseUrlSchema = z.string().min(1);

const resolveDatabaseUrl = (): string => {
  const parsed = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
  if (parsed.success) {
    return parsed.data;
  }
  if (process.env.NODE_ENV === "production" && !isNextProductionBuild) {
    throw new Error("DATABASE_URL is required in production.");
  }
  if (process.env.NODE_ENV === "production" && isNextProductionBuild) {
    return "postgresql://127.0.0.1:5432/__next_build_placeholder__";
  }
  return "postgresql://postgres:postgres@127.0.0.1:5432/tickr";
};

const pool = new Pool({
  connectionString: resolveDatabaseUrl(),
});

const absoluteUrlSchema = z.string().url();

const resolveAuthBaseURL = (): string => {
  for (const candidate of [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    const parsed = absoluteUrlSchema.safeParse(candidate);
    if (parsed.success) {
      return parsed.data;
    }
  }
  return "http://localhost:3000";
};

const baseURL = resolveAuthBaseURL();

const betterAuthInfraApiKeySchema = z.string().min(1);

const resolveBetterAuthInfraApiKey = (): string => {
  const parsed = betterAuthInfraApiKeySchema.safeParse(
    process.env.BETTER_AUTH_API_KEY,
  );
  if (parsed.success) {
    return parsed.data;
  }
  if (process.env.NODE_ENV === "production" && !isNextProductionBuild) {
    throw new Error(
      "BETTER_AUTH_API_KEY is required in production when Better Auth Infrastructure plugins are enabled. Set it from the Better Auth Infrastructure dashboard.",
    );
  }
  if (process.env.NODE_ENV === "production" && isNextProductionBuild) {
    return "next-build-placeholder-infra-api-key-min-1-char!";
  }
  return "";
};

const betterAuthInfraApiKey = resolveBetterAuthInfraApiKey();

export const auth = betterAuth({
  baseURL,
  secret: resolveAuthSecret(),
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies(),
    dash({
      apiKey: betterAuthInfraApiKey,
    }),
    sentinel({
      apiKey: betterAuthInfraApiKey,
    }),
    organization({
      async sendInvitationEmail(data) {
        const inviteUrl = `${baseURL}/accept-invitation?invitationId=${encodeURIComponent(data.id)}`;
        const inviterLabel =
          data.inviter.user.name?.trim() ||
          data.inviter.user.email ||
          "Someone";
        const subject = `Invitation to join ${data.organization.name}`;
        await sendOrganizationInvitationMail({
          to: data.email,
          subject,
          inviterLabel,
          organizationName: data.organization.name,
          inviteUrl,
        });
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
