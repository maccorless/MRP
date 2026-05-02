import { requireNocSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { submitDirectEntryApplication } from "./actions";
import DirectEntryForm from "./DirectEntryForm";

export default async function DirectEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await requireNocSession();
  const lang = await getAdminLang();
  const s = t(lang);
  const { error } = await searchParams;

  const ERROR_MSG: Record<string, string> = {
    missing_fields: s.error.invalid_input,
    no_category:    s.error.invalid_input,
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{s.direct.title} — {session.nocCode}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{s.direct.description}</p>
      </div>

      {/* NOC E guidance */}
      <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <p className="font-semibold mb-1">{s.direct.noc_e_tip_title}</p>
        <p>{s.direct.noc_e_tip_body}</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {ERROR_MSG[error] ?? s.error.generic}
        </div>
      )}

      <DirectEntryForm
        action={submitDirectEntryApplication}
        nocCode={session.nocCode}
        strings={{
          org_section:           s.form.org_section,
          contact_section:       s.form.contact_section,
          secondary_section:     s.form.secondary_section,
          accreditation_section: s.form.accreditation_section,
          notes_section:         s.form.notes_section,
          org_name:              s.form.org_name,
          type:                  s.form.type,
          country:               s.form.country,
          website:               s.form.website,
          email_field:           s.form.email_field,
          full_name:             s.form.full_name,
          first_name:            s.form.first_name,
          last_name:             s.form.last_name,
          title_position:        s.form.title_position,
          phone:                 s.form.phone,
          cell_mobile:           s.form.cell_mobile,
          add_secondary:         s.form.add_secondary,
          remove_secondary:      s.form.remove_secondary,
          submit_accept:         s.form.submit_accept,
          notes_optional:        s.form.notes_optional,
          notes_placeholder:     s.form.notes_placeholder,
          select_prompt:         s.form.select_prompt,
          select_sport:          s.form.select_sport,
          sport_field:           s.form.sport_field,
          access_label:          s.form.access_label,
          cat_e_sub:             s.form.cat_e_sub,
          cat_es_sub:            s.form.cat_es_sub,
          cat_ep_sub:            s.form.cat_ep_sub,
          cat_eps_sub:           s.form.cat_eps_sub,
          cat_et_sub:            s.form.cat_et_sub,
          cat_ec_sub:            s.form.cat_ec_sub,
          cat_e_access:          s.form.cat_e_access,
          cat_es_access:         s.form.cat_es_access,
          cat_ep_access:         s.form.cat_ep_access,
          cat_eps_access:        s.form.cat_eps_access,
          cat_et_access:         s.form.cat_et_access,
          cat_ec_access:         s.form.cat_ec_access,
          slots_placeholder:     s.form.slots_placeholder,
          accred_instructions:   s.form.accred_instructions,
          noc_e_footer:          s.form.noc_e_footer,
          submit_footnote:       s.form.submit_footnote,
        }}
      />
    </div>
  );
}
