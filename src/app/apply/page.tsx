import { requestToken } from "./actions";

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Apply for Media Accreditation
      </h1>
      <p className="text-gray-500 mb-8">
        Enter your work email to get started. We&apos;ll issue an access code
        to verify your identity.
      </p>

      {error === "invalid_email" && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Please enter a valid email address.
        </div>
      )}
      {error === "invalid_token" && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Your access code has expired or has already been used. Please request
          a new one.
        </div>
      )}
      {error === "invalid_country" && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Please select a valid country from the list (2-letter ISO code).
        </div>
      )}
      {error === "invalid_noc" && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Please select a valid NOC code from the list (3-letter Olympic code).
        </div>
      )}
      {error === "window_closed" && (
        <div role="alert" className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md text-orange-700 text-sm">
          The EoI window for your NOC is currently closed. Please contact your NOC directly.
        </div>
      )}
      {error === "rate_limited" && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Too many requests. Please wait before trying again.
        </div>
      )}
      {error === "application_limit" && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          You have reached the maximum of 10 applications for this email address. Contact your NOC for assistance.
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form action={requestToken}>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Work email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@newsorg.com"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Use your organization&apos;s email domain — this is how we identify
            your media outlet.
          </p>

          <button
            type="submit"
            className="mt-4 w-full bg-[#0057A8] text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
          >
            Send Access Code →
          </button>
        </form>
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Already have a reference number? Contact your NOC directly.
      </p>
    </div>
  );
}
