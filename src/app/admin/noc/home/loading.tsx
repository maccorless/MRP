import { CardGridSkeleton } from "@/components/skeletons/CardGridSkeleton";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

export default function NocHomeLoading() {
  return (
    <PageSkeleton titleWidth="w-64" maxWidth="max-w-4xl">
      <CardGridSkeleton count={3} />
    </PageSkeleton>
  );
}
