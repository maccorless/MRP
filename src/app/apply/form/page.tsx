import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { magicLinkTokens, applications, organizations } from "@/db/schema";
import { hashToken } from "@/lib/tokens";
import { submitApplication } from "../actions";
import { COUNTRY_CODES, NOC_CODES } from "@/lib/codes";

export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) redirect("/apply");

  const tokenHash = hashToken(token);
  const [tokenRecord] = await db
    .select()
    .from(magicLinkTokens)
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        eq(magicLinkTokens.email, email)
      )
    );

  if (
    !tokenRecord ||
    tokenRecord.usedAt !== null ||
    tokenRecord.expiresAt < new Date()
  ) {
    redirect("/apply?error=invalid_token");
  }

  // Check for a returned application to resubmit
  const [returnedRow] = await db
    .select({ app: applications, org: organizations })
    .from(applications)
    .innerJoin(organizations, eq(applications.organizationId, organizations.id))
    .where(
      and(
        eq(applications.contactEmail, email),
        eq(applications.status, "returned")
      )
    );

  const isResubmission = !!returnedRow;
  const prefill = returnedRow ? { app: returnedRow.app, org: returnedRow.org } : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isResubmission ? "Resubmit Application" : "Media Accreditation Application"}
      </h1>
      <p className="text-gray-500 mb-8">
        {isResubmission
          ? "Review the feedback below, make your corrections, and resubmit."
          : "Complete all sections. Your application will be reviewed by your NOC before going to the IOC."}
      </p>

      {/* Return note banner */}
      {isResubmission && prefill && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm font-semibold text-orange-800 mb-1">
            Returned — corrections required
          </div>
          <p className="text-sm text-orange-700">{prefill.app.reviewNote}</p>
          <div className="mt-2 text-xs text-orange-600">
            Reference: <span className="font-mono">{prefill.app.referenceNumber}</span>
          </div>
        </div>
      )}

      <form action={submitApplication} className="space-y-6">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        {isResubmission && prefill && (
          <input type="hidden" name="resubmit_id" value={prefill.app.id} />
        )}

        {/* Contact */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Contact Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500">
                {email}
              </div>
            </div>
            <div>
              <label
                htmlFor="contact_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your full name <span className="text-red-500">*</span>
              </label>
              <input
                id="contact_name"
                name="contact_name"
                type="text"
                required
                autoComplete="name"
                defaultValue={prefill?.app.contactName ?? ""}
                placeholder="First Last"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Organization — read-only on resubmission, editable on new */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Organization
          </h2>

          {isResubmission && prefill ? (
            // Read-only org on resubmission — org record already exists
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500 text-xs">Organization</dt>
                <dd className="font-medium text-gray-900">{prefill.org.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">NOC</dt>
                <dd className="text-gray-900">{prefill.org.nocCode}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Country</dt>
                <dd className="text-gray-900">{prefill.org.country}</dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs">Type</dt>
                <dd className="text-gray-900">{prefill.org.orgType}</dd>
              </div>
            </dl>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="org_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Organization name <span className="text-red-500">*</span>
                </label>
                <input
                  id="org_name"
                  name="org_name"
                  type="text"
                  required
                  placeholder="e.g. The Associated Press"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    required
                    list="country-codes"
                    placeholder="US — United States"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
                  />
                  <datalist id="country-codes">
                    {COUNTRY_CODES.map(({ code, name }) => (
                      <option key={code} value={`${code} — ${name}`} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-400 mt-1">Type a code or country name</p>
                </div>
                <div>
                  <label
                    htmlFor="noc_code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    NOC code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="noc_code"
                    name="noc_code"
                    type="text"
                    required
                    list="noc-codes"
                    placeholder="USA — United States of America"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
                  />
                  <datalist id="noc-codes">
                    {NOC_CODES.map(({ code, name }) => (
                      <option key={code} value={`${code} — ${name}`} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-400 mt-1">Type a code or country name</p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="org_type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Organization type <span className="text-red-500">*</span>
                </label>
                <select
                  id="org_type"
                  name="org_type"
                  required
                  defaultValue=""
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
                >
                  <option value="" disabled>Select type…</option>
                  <option value="media_print_online">Print / Online Media</option>
                  <option value="media_broadcast">Broadcast</option>
                  <option value="news_agency">News Agency</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Website{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent"
                />
              </div>
            </div>
          )}
        </section>

        {/* Accreditation */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Accreditation Request
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select all that apply. Press = journalists, writers, reporters. Photo = still photographers.
              </p>
              <div className="space-y-2">
                {(
                  [
                    { value: "press", label: "Press", desc: "Journalists, writers, reporters" },
                    { value: "photo", label: "Photo", desc: "Still photographers" },
                    { value: "both", label: "Both — Press &amp; Photo", desc: "Organisation covers both press and photography" },
                  ] as const
                ).map(({ value, label, desc }) => {
                  const prefillValue = prefill?.app
                    ? prefill.app.categoryPress && prefill.app.categoryPhoto
                      ? "both"
                      : prefill.app.categoryPress
                      ? "press"
                      : "photo"
                    : undefined;
                  return (
                    <label
                      key={value}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:border-[#0057A8] has-[:checked]:bg-blue-50"
                    >
                      <input
                        type="radio"
                        name="category"
                        value={value}
                        required
                        defaultChecked={prefillValue === value}
                        className="mt-0.5 accent-[#0057A8]"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: label }} />
                        <div className="text-xs text-gray-500">{desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="about"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                About your coverage <span className="text-red-500">*</span>
              </label>
              <textarea
                id="about"
                name="about"
                required
                rows={5}
                defaultValue={prefill?.app.about ?? ""}
                placeholder="Describe your organization's editorial focus, the events you plan to cover, the number of journalists or photographers in your team, and any specific venue access requirements."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Be specific — this is what your NOC uses to evaluate your request.
              </p>
            </div>
          </div>
        </section>

        <button
          type="submit"
          className="w-full bg-[#0057A8] text-white rounded-md px-4 py-3 text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
        >
          {isResubmission ? "Resubmit Application" : "Submit Application"}
        </button>
        <p className="text-xs text-gray-400 text-center pb-4">
          By submitting you confirm this information is accurate.
        </p>
      </form>
    </div>
  );
}
