import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function OcogWindowsLoading() {
  return (
    <PageSkeleton titleWidth="w-44" maxWidth="max-w-5xl">
      <TableSkeleton
        columns={["w-16", "w-24", "w-24", "w-20"]}
        rows={8}
      />
    </PageSkeleton>
  );
}
