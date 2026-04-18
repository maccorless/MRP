import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function OcogAuditLoading() {
  return (
    <PageSkeleton titleWidth="w-40" maxWidth="max-w-5xl">
      <TableSkeleton
        columns={["w-32", "w-24", "w-48 flex-1", "w-20"]}
        rows={10}
      />
    </PageSkeleton>
  );
}
