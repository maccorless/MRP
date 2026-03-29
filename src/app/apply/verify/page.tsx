import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) redirect("/apply");

  const chars = token.split("");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Your Access Code
      </h1>
      <p className="text-gray-500 mb-8">
        Use this code to access your application. Keep this page open — you
        will need it.
      </p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500 mb-5">
          Access code for{" "}
          <span className="font-medium text-gray-900">{email}</span>
        </p>

        <div className="flex justify-center gap-3 mb-5">
          {chars.map((char, i) => (
            <div
              key={i}
              className="w-14 h-16 border-2 border-[#0057A8] rounded-lg flex items-center justify-center text-3xl font-bold text-[#0057A8] bg-blue-50 select-all"
            >
              {char}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-6">
          Valid for 24 hours · Single use
        </p>

        <Link
          href={`/apply/form?token=${token}&email=${encodeURIComponent(email)}`}
          className="inline-block bg-[#0057A8] text-white rounded-md px-8 py-2.5 text-sm font-semibold hover:bg-blue-800 transition-colors"
        >
          Continue to Application →
        </Link>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
        <span className="font-semibold">Prototype:</span> In production this
        code is sent by email. Do not close this tab before submitting your
        application.
      </div>
    </div>
  );
}
