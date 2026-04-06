/**
 * Current event identifier. Used across schema defaults, queries, and reference numbers.
 * When MRP is reused for a future event, change this value and run migrations.
 */
export const CURRENT_EVENT_ID = "LA28";

/** Year portion for reference numbers (derived from event, e.g. LA28 → 2028). */
export const CURRENT_EVENT_YEAR = "2028";
