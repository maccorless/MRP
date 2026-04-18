import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

export default function IocExportLoading() {
  return (
    <PageSkeleton titleWidth="w-32" maxWidth="max-w-6xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </PageSkeleton>
  );
}
