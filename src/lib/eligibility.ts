// Eligibility heuristics for ineligible-entity detection at NOC review time.
//
// Plan §1.3 lists categories that do not qualify for press accreditation:
// publishers, marketing personnel, athlete-management companies, individuals
// representing athletes, advertising / PR / promotion agencies, commercial
// partners associated with NOCs, government ministries or organisations.
//
// Most of these categories are not reliably inferable from EoI form fields.
// The one we *can* detect cheaply is government addresses via .gov / .gov.*
// email domains. For everything else we rely on NOC reviewer judgment guided
// by the help-page copy.

const GOV_DOMAIN_PATTERN = /\.gov(\.[a-z]{2,})?$/i;

/**
 * Return true if the email's domain matches a government TLD pattern.
 * Examples that match: foo@example.gov, foo@example.gov.uk, foo@dept.gov.au.
 * Examples that do not match: foo@gov-example.com, foo@government.com.
 */
export function isGovernmentEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain) return false;
  return GOV_DOMAIN_PATTERN.test(domain);
}

/**
 * Aggregate ineligibility flags for an application. Returns the list of
 * concerns that should be surfaced to the NOC reviewer, each as a short
 * machine-readable code + human-readable label.
 */
export type IneligibilityFlag = {
  code: "gov_domain";
  label: string;
};

export function ineligibilityFlags(input: {
  contactEmail?: string | null;
  orgEmail?: string | null;
  secondaryContactEmail?: string | null;
}): IneligibilityFlag[] {
  const flags: IneligibilityFlag[] = [];
  const emails = [input.contactEmail, input.orgEmail, input.secondaryContactEmail].filter(
    (e): e is string => typeof e === "string" && e.length > 0,
  );
  if (emails.some(isGovernmentEmail)) {
    flags.push({
      code: "gov_domain",
      label:
        "One or more email addresses on this application are on a government (.gov) domain. Government ministries and officials are not eligible for press accreditation per IOC Strategic Plan §1.3.",
    });
  }
  return flags;
}
