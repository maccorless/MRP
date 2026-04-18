import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function OcogDuplicatesLoading() {
  return (
    <PageSkeleton titleWidth="w-44" maxWidth="max-w-5xl">
      <TableSkeleton
        columns={["w-48 flex-1", "w-16", "w-16", "w-24"]}
        rows={6}
      />
    </PageSkeleton>
  );
}
