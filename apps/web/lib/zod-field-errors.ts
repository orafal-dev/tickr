import type { z } from "zod";

/**
 * Maps Zod `flatten().fieldErrors` into Base UI `Form` `errors` prop shape.
 */
export const fieldErrorsFromZodError = (error: z.ZodError): Record<string, string> => {
  const flat = error.flatten().fieldErrors;
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (!Array.isArray(messages)) {
      continue;
    }
    const first = messages[0];
    if (first) {
      out[key] = first;
    }
  }
  return out;
};
