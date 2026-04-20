export default function ApplyFormLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>

      <div className="bg-white border border-gray-200 rounded-t-lg">
        <div className="flex gap-4 px-5 py-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-24" />
          ))}
        </div>
      </div>

      <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-4 sm:p-8 space-y-5">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}
