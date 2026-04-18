import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function IocLoading() {
  return (
    <PageSkeleton titleWidth="w-44" maxWidth="max-w-6xl">
      <div className="grid grid-cols-5 gap-3 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4 h-20" />
        ))}
      </div>
      <TableSkeleton
        columns={["w-12", "w-12", "w-12", "w-12", "w-12", "w-12", "w-12"]}
        rows={8}
      />
    </PageSkeleton>
  );
}
