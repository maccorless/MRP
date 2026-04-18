import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function IocOrgsLoading() {
  return (
    <PageSkeleton titleWidth="w-40" maxWidth="max-w-6xl">
      <TableSkeleton
        columns={["w-48 flex-1", "w-16", "w-16", "w-16", "w-20"]}
        rows={8}
      />
    </PageSkeleton>
  );
}
