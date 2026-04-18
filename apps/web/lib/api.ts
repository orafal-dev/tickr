import "server-only";

import { z } from "zod";

import { getSession } from "@/lib/auth";

const apiUrlSchema = z
  .string()
  .min(1, "API_URL is not configured.")
  .transform((url) => url.replace(/\/$/, ""));

const resolveApiUrl = (): string => apiUrlSchema.parse(process.env.API_URL);

const internalApiKeySchema = z.string().min(1);

const isNextProductionBuild =
  process.env["NEXT_PHASE"] === "phase-production-build";

const resolveInternalApiKey = (): string => {
  const parsed = internalApiKeySchema.safeParse(process.env.API_INTERNAL_KEY);
  if (parsed.success) {
    return parsed.data;
  }
  if (process.env.NODE_ENV === "production" && !isNextProductionBuild) {
    throw new Error(
      "API_INTERNAL_KEY must be set in production so the web app can call the Nest API securely.",
    );
  }
  if (process.env.NODE_ENV === "production" && isNextProductionBuild) {
    return "next-build-placeholder-internal-key-min-32chars!!";
  }
  return "local-development-api-internal-key";
};

const mergeHeaders = (
  base: Record<string, string>,
  initHeaders?: HeadersInit,
): Headers => {
  const merged = new Headers(base);
  if (!initHeaders) {
    return merged;
  }
  const extra = new Headers(initHeaders);
  extra.forEach((value, key) => {
    merged.set(key, value);
  });
  return merged;
};

export const apiFetch = async (
  path: string,
  init: RequestInit = {},
): Promise<Response> => {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const url = `${resolveApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const sessionModel = session.session as
    | { activeOrganizationId?: string | null }
    | undefined;
  const organizationId = sessionModel?.activeOrganizationId;

  const headers = mergeHeaders(
    {
      "Content-Type": "application/json",
      "x-api-internal-key": resolveInternalApiKey(),
      "x-user-id": session.user.id,
      ...(organizationId
        ? { "x-organization-id": organizationId }
        : {}),
    },
    init.headers,
  );

  return fetch(url, {
    ...init,
    headers,
  });
};
