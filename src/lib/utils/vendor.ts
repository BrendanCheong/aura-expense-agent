/**
 * Vendor name normalization utilities.
 *
 * Used by FEAT-006 (Vendor Cache) for consistent cache matching.
 */

/**
 * Normalize a vendor name for consistent cache matching.
 * Uppercases, trims, collapses whitespace, and removes trailing
 * punctuation (dots). Does NOT strip corporate suffixes —
 * transaction alert vendor names (e.g., "GRAB *GRABFOOD",
 * "SP GROUP") don't use them.
 */
export function normalizeVendorName(name: string): string {
  return name.trim().toUpperCase().replace(/\s+/g, ' ').replace(/[.]+$/, '');
}

/**
 * Extract a rough vendor name from bank email text.
 * Looks for patterns like "at VENDOR_NAME" commonly used in
 * Singapore bank transaction alerts (UOB, DBS, OCBC).
 *
 * Returns null if no vendor pattern is found (non-transaction emails).
 */
export function extractRoughVendor(text: string): string | null {
  if (!text) {return null;}

  // Pattern: "at VENDOR_NAME" followed by sentence-ending punctuation, "for", "on", "If", or end of string
  // Vendor names can contain uppercase letters, digits, spaces, dots, asterisks, hyphens
  // We use a greedy match for the vendor name, then trim trailing dots/periods
  const match = text.match(
    /\bat\s+([A-Z][A-Z0-9 .*\-]+?)(?:(?:\.\s)|(?:,\s)|\s+(?:for|on|If)\b|$)/i
  );
  if (match) {
    return match[1].trim().toUpperCase().replace(/[.]+$/, '');
  }

  return null;
}
