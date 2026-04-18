import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function OcogPbnDetailLoading() {
  return (
    <PageSkeleton titleWidth="w-56" maxWidth="max-w-5xl">
      <TableSkeleton
        columns={["w-48 flex-1", "w-12", "w-12", "w-12", "w-12", "w-12", "w-16"]}
        rows={8}
      />
    </PageSkeleton>
  );
}
