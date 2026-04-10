import { requestStatusToken } from "./actions";

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const { error, email } = await searchParams;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Check Application Status</h1>
      <p className="text-gray-500 mb-8">
        Enter the email address you used to apply to view your application status.
      </p>

      {error === "invalid_email" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Please enter a valid email address.
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form action={requestStatusToken}>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address used when applying
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email ?? ""}
            placeholder="you@newsorg.com"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
          />
          <button
            type="submit"
            className="mt-4 w-full bg-[#0057A8] text-white rounded px-4 py-2.5 text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
          >
            View My Status
          </button>
          <p className="mt-2 text-xs text-gray-400 text-center">
            The status link is valid for 1 hour. You can request a new one at any time.
          </p>
        </form>
      </div>
    </div>
  );
}
