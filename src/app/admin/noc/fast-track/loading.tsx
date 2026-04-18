import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

export default function NocFastTrackLoading() {
  return (
    <PageSkeleton titleWidth="w-40" maxWidth="max-w-5xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="h-10 bg-gray-200 rounded w-2/3" />
      </div>
    </PageSkeleton>
  );
}
