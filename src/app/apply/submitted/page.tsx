import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; resubmit?: string }>;
}) {
  const { ref, resubmit } = await searchParams;

  if (!ref) redirect("/apply");

  const isResubmission = resubmit === "1";

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {isResubmission ? "Application Resubmitted" : "Application Submitted"}
      </h1>
      <p className="text-gray-500 mb-8">
        {isResubmission
          ? "Your corrections have been received. Your NOC will review the updated application."
          : "Your application has been received and is pending review by your NOC."}
      </p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 inline-block text-left min-w-64">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Reference number
        </div>
        <div className="text-xl font-mono font-bold text-[#0057A8]">{ref}</div>
        <p className="text-xs text-gray-400 mt-2">
          Keep this for your records.
        </p>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p className="font-medium mb-2">What happens next</p>
        <ol className="text-sm text-gray-600 text-left max-w-xs mx-auto space-y-1 list-decimal list-inside">
          <li>Your NOC reviews the application</li>
          <li>You&apos;ll be contacted if corrections are needed</li>
          <li>Approved applications are forwarded to the IOC</li>
        </ol>
      </div>

      <div className="mt-6">
        <Link
          href="/apply/status"
          className="text-sm text-[#0057A8] hover:underline"
        >
          Check your application status →
        </Link>
      </div>
    </div>
  );
}
