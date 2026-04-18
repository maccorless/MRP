import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function NocEnrLoading() {
  return (
    <PageSkeleton titleWidth="w-56" maxWidth="max-w-4xl">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 h-20" />
        ))}
      </div>
      <TableSkeleton
        columns={["w-10", "w-48 flex-1", "w-20", "w-24"]}
        rows={5}
      />
    </PageSkeleton>
  );
}
