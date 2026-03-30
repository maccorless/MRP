import { login } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  noc_admin:  "NOC Admin",
  ocog_admin: "OCOG Admin",
  if_admin:   "IF Admin",
  ioc_admin:  "IOC Admin",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>;
}) {
  const { error, role } = await searchParams;
  const roleLabel = role && ROLE_LABELS[role] ? ROLE_LABELS[role] : null;

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#0057A8] rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" aria-hidden="true">
              <circle cx="8" cy="12" r="5" stroke="white" strokeWidth="1.75"/>
              <circle cx="16" cy="12" r="5" stroke="white" strokeWidth="1.75"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Media Registration Portal
          </h1>
          {roleLabel ? (
            <p className="text-sm text-gray-500 mt-1">
              Signing in as <span className="font-semibold text-gray-700">{roleLabel}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Administrator Sign In</p>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error === "invalid_credentials" && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              Invalid email or password.
            </div>
          )}
          {error === "missing_fields" && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              Please enter your email and password.
            </div>
          )}

          <form action={login} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@noc.org"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0057A8] text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>

        <div className="mt-4 text-center space-y-1">
          <p className="text-xs text-gray-400">LA 2028 · IOC Media Registration Portal</p>
          {roleLabel && (
            <a href="/admin" className="text-xs text-gray-400 hover:text-gray-600 underline">
              ← Choose a different role
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
