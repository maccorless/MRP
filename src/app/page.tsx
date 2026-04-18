import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 bg-brand-blue rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-xl font-bold">P</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Press Registration Portal
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          LA 2028 Olympic Games
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/apply"
            className="text-brand-blue hover:underline text-base font-medium"
          >
            Apply as a media member
          </Link>
          <Link
            href="/admin/login"
            className="text-brand-blue hover:underline text-base font-medium"
          >
            Login as an administrator
          </Link>
        </div>
      </div>
    </main>
  );
}
