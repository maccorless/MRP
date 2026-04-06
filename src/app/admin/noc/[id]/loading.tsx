export default function ApplicationDetailLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      </div>
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
