import Link from "next/link";
import { Suspense } from "react";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#0057A8] text-white px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center shrink-0">
              <span className="font-bold text-sm">P</span>
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">
                Press Registration Portal
              </div>
              <div className="text-xs text-blue-200 leading-tight">
                LA 2028 Olympic Games
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Suspense>
              <LanguageToggle />
            </Suspense>
            <Link href="/apply/status" className="text-xs text-blue-200 hover:text-white transition-colors">
              Check status →
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">{children}</div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-gray-600 border-t border-gray-200">
        © 2028 International Olympic Committee · Media Accreditation
      </footer>
    </div>
  );
}
