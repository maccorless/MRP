import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function OcogPbnLoading() {
  return (
    <PageSkeleton titleWidth="w-48" maxWidth="max-w-5xl">
      <TableSkeleton
        columns={["w-20", "w-48 flex-1", "w-20", "w-20", "w-24"]}
        rows={8}
      />
    </PageSkeleton>
  );
}
