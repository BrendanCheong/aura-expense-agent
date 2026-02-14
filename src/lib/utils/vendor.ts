/**
 * Vendor name normalization utilities.
 *
 * Will be expanded during FEAT-006 (Vendor Cache).
 */

/**
 * Normalize a vendor name for consistent cache matching.
 * Uppercases, trims, and collapses whitespace. Does NOT strip
 * corporate suffixes — transaction alert vendor names (e.g.,
 * "GRAB *GRABFOOD", "SP GROUP") don't use them.
 */
export function normalizeVendorName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}
