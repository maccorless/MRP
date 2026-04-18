import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

export default function NocHelpLoading() {
  return (
    <PageSkeleton titleWidth="w-40" maxWidth="max-w-5xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
      </div>
    </PageSkeleton>
  );
}
