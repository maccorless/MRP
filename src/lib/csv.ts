/** Escape a value for CSV — wraps in quotes, doubles internal quotes. */
export function csvEscape(val: string | number | null | undefined): string {
  return `"${String(val ?? "").replace(/"/g, '""')}"`;
}

/** Build a full CSV string from a header array and row arrays. */
export function buildCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = header.map(csvEscape).join(",");
  const dataLines = rows.map((row) => row.map(csvEscape).join(","));
  return [headerLine, ...dataLines].join("\n");
}
