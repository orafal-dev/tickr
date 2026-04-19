/** URL-safe organization slug from a display name. */
export const slugifyOrganizationSlug = (value: string): string => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return slug.length > 0 ? slug : "workspace"
}
