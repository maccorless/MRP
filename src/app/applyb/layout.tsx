import { Suspense } from "react";
import { ApplyHeader, ApplyFooter } from "@/components/ApplyBranding";

export default function ApplyBLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Suspense>
        <ApplyHeader basePath="/applyb" />
      </Suspense>

      <main id="main-content" className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>

      <Suspense>
        <ApplyFooter />
      </Suspense>
    </div>
  );
}
