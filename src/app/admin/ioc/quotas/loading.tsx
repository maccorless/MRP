import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function QuotasLoading() {
  return (
    <PageSkeleton titleWidth="w-40" maxWidth="max-w-6xl">
      <TableSkeleton
        columns={["w-16", "w-20", "w-20", "w-20", "w-20", "w-20 flex-1"]}
        rows={8}
      />
    </PageSkeleton>
  );
}
