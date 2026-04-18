import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function QueueLoading() {
  return (
    <PageSkeleton titleWidth="w-48" maxWidth="max-w-5xl">
      <TableSkeleton
        columns={["w-32", "w-48 flex-1", "w-20", "w-16"]}
        rows={6}
      />
    </PageSkeleton>
  );
}
