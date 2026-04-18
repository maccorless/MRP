type Props = {
  count?: number;
};

export function CardGridSkeleton({ count = 3 }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border-2 border-gray-200 p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                <div className="h-4 bg-gray-200 rounded w-48" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-64 ml-10" />
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-24" />
          </div>
          <div className="mt-4 ml-10 flex gap-6">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
