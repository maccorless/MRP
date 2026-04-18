import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function OcogEoiDetailLoading() {
  return (
    <PageSkeleton titleWidth="w-56" maxWidth="max-w-5xl">
      <TableSkeleton
        columns={["w-32", "w-48 flex-1", "w-20", "w-16", "w-20"]}
        rows={8}
      />
    </PageSkeleton>
  );
}
