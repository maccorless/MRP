/**
 * Reusable pagination controls — Previous / Page X of Y / Next.
 * Renders nothing when totalPages <= 1.
 */
type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** Build the href for a given page number */
  pageHref: (p: number) => string;
};

export function Paginator({ page, totalPages, total, pageSize, pageHref }: Props) {
  if (totalPages <= 1) return null;

  const rowStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rowEnd = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm mt-4">
      <span className="text-gray-600 text-xs">
        Showing {rowStart.toLocaleString()}–{rowEnd.toLocaleString()} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-3">
        {page > 1 ? (
          <a href={pageHref(page - 1)} className="text-[#0057A8] hover:underline text-xs">
            ← Previous
          </a>
        ) : (
          <span className="text-gray-300 text-xs">← Previous</span>
        )}
        <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
        {page < totalPages ? (
          <a href={pageHref(page + 1)} className="text-[#0057A8] hover:underline text-xs">
            Next →
          </a>
        ) : (
          <span className="text-gray-300 text-xs">Next →</span>
        )}
      </div>
    </div>
  );
}
