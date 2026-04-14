import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/apply" className="text-sm text-[#0057A8] hover:underline">
          ← Back to application
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">How the EoI Process Works</h1>
      <p className="text-gray-500 mb-8">
        A quick guide for media organisations applying for LA 2028 Olympic Games press accreditation.
      </p>

      {/* Steps */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">The four steps</h2>
        <ol className="space-y-5">
          {[
            {
              n: "1",
              title: "Request a magic link",
              body: "Enter your email address on the application page. We'll send you a secure, one-time link. No password needed.",
            },
            {
              n: "2",
              title: "Fill in the form",
              body: "The form takes about 10 minutes. Your progress is saved automatically, so you can close the tab and return later using the same link.",
            },
            {
              n: "3",
              title: "Your NOC reviews your application",
              body: "The National Olympic Committee (NOC) for your country reviews all applications from their territory. They may accept your organisation as a candidate for accreditation, return it for corrections, or reject it. Being accepted at this stage means you're in the running — it does not yet mean you have been allocated accreditation slots.",
            },
            {
              n: "4",
              title: "Press by Number (PbN)",
              body: "For accepted candidates, the NOC then enters the Press by Number phase — they allocate specific accreditation slots across categories (E, EP, ET, etc.) from their IOC-assigned quota. Quotas are limited, so not every accepted candidate will receive slots. The IOC reviews all NOC allocations before final confirmation.",
            },
          ].map(({ n, title, body }) => (
            <li key={n} className="flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0057A8] text-white text-sm font-bold flex items-center justify-center">
                {n}
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-0.5">{title}</div>
                <p className="text-sm text-gray-600">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Accreditation categories</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-medium text-gray-500 pb-2 pr-6">Code</th>
                <th className="text-left font-medium text-gray-500 pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { code: "E",   desc: "Written press / journalist (general)" },
                { code: "Es",  desc: "Written press / journalist (sport-specific)" },
                { code: "EP",  desc: "Photographer (general)" },
                { code: "EPs", desc: "Photographer (sport-specific)" },
                { code: "ET",  desc: "Technical staff (broadcast & print production)" },
                { code: "EC",  desc: "Editorial support staff" },
              ].map(({ code, desc }) => (
                <tr key={code}>
                  <td className="py-2 pr-6 font-mono font-semibold text-gray-900">{code}</td>
                  <td className="py-2 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          You may apply for more than one category. Your NOC may adjust your category selection during review.
        </p>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Frequently asked questions</h2>
        <dl className="space-y-5">
          {[
            {
              q: "I don't know which category to apply for.",
              a: "Apply for the category that best matches your role. If you work across multiple roles (e.g. journalist and photographer), you can apply for both. Your NOC may adjust your selection.",
            },
            {
              q: "What is my NOC?",
              a: "Your National Olympic Committee (NOC) is the body that represents your country in the Olympic movement. There are 206 NOCs worldwide. On the form, enter your country and we'll suggest your NOC automatically.",
            },
            {
              q: "Can I apply for more than one category?",
              a: "Yes. Select all categories that apply to your work.",
            },
            {
              q: "Can I save my form and come back later?",
              a: "Yes. Your progress is saved automatically in your browser. Use the same magic link to return and continue. The link is valid for 24 hours — request a new one if it expires.",
            },
            {
              q: "What happens if my NOC returns my application?",
              a: "You'll receive a notification with the NOC's comments. Use your magic link to open the form again, make the requested corrections, and resubmit. It will go back to your NOC for review.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <dt className="font-medium text-gray-900 mb-1">{q}</dt>
              <dd className="text-sm text-gray-600">{a}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="text-center">
        <Link
          href="/apply"
          className="inline-block px-6 py-3 bg-[#0057A8] text-white text-sm font-semibold rounded-md hover:bg-blue-800 transition-colors"
        >
          Ready to apply →
        </Link>
      </div>
    </div>
  );
}
