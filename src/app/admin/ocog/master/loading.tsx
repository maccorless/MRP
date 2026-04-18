import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function OcogMasterLoading() {
  return (
    <PageSkeleton titleWidth="w-56" maxWidth="max-w-6xl">
      <TableSkeleton
        columns={["w-16", "w-12", "w-12", "w-12", "w-12", "w-12", "w-16"]}
        rows={10}
      />
    </PageSkeleton>
  );
}
