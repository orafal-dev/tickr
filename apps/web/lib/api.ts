import "server-only";

import { z } from "zod";

import { getSession } from "@/lib/auth";

const apiUrlSchema = z
  .string()
  .min(1, "API_URL is not configured.")
  .transform((url) => url.replace(/\/$/, ""));

const resolveApiUrl = (): string => apiUrlSchema.parse(process.env.API_URL);

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
