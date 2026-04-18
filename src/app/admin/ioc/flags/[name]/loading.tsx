import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function IocFlagDetailLoading() {
  return (
    <PageSkeleton titleWidth="w-56" maxWidth="max-w-6xl">
      <TableSkeleton
        columns={["w-48 flex-1", "w-24", "w-20"]}
        rows={6}
      />
    </PageSkeleton>
  );
}
