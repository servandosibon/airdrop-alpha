/** "Ethereum L2" -> "ethereum-l2". Used only for readable, shareable URLs. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/** Finds which option (if any) slugifies to `slug`. Returns undefined if no match or slug is null. */
export function matchSlug(options: string[], slug: string | null): string | undefined {
  if (!slug) return undefined;
  return options.find((option) => slugify(option) === slug);
}
