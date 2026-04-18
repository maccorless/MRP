type Props = {
  columns?: string[];
  rows?: number;
};

export function TableSkeleton({
  columns = ["w-32", "w-48 flex-1", "w-20", "w-16"],
  rows = 6,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {columns.map((w, j) => (
              <div key={j} className={`h-4 bg-gray-200 rounded ${w}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
