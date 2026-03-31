/**
 * Accreditation category model — E-category press accreditations.
 * Used across EoI form, NOC review, PbN allocation, and ACR export.
 */

export type AccredCategory = "E" | "Es" | "EP" | "EPs" | "ET" | "EC";

export const ACCRED_CATEGORIES: {
  value: AccredCategory;
  label: string;
  shortLabel: string;
  description: string;
  helpText: string;
  isPhoto: boolean;
}[] = [
  {
    value: "E",
    label: "E — Journalist",
    shortLabel: "E",
    description: "Journalist or editor",
    helpText:
      "Journalist, editor, or photo editor employed or contracted by a news agency, newspaper, sports daily, magazine, internet site, social media platform, or as an independent/freelance journalist. Covers all sport venues and the Main Press Centre (MPC).",
    isPhoto: false,
  },
  {
    value: "Es",
    label: "Es — Sport-Specific Journalist",
    shortLabel: "Es",
    description: "Journalist specialising in a single sport",
    helpText:
      "Journalist who specialises in covering one particular sport on the Olympic Games programme. Es accreditation covers all disciplines of that sport. Only applies to sports on the LA28 programme. Access limited to relevant sport venues and MPC.",
    isPhoto: false,
  },
  {
    value: "EP",
    label: "EP — Photographer",
    shortLabel: "EP",
    description: "Still photographer",
    helpText:
      "Still photographer meeting the same eligibility criteria as the E (Journalist) category. Accredited for photo positions at all sport venues and the MPC. A special vest/bib/armband is issued at Games time for photo position access.",
    isPhoto: true,
  },
  {
    value: "EPs",
    label: "EPs — Sport-Specific Photographer",
    shortLabel: "EPs",
    description: "Photographer specialising in a single sport",
    helpText:
      "Photographer who specialises in a particular sport on the Olympic Games programme. EPs accreditation covers all disciplines of that sport. Access limited to relevant sport venues and MPC photo positions.",
    isPhoto: true,
  },
  {
    value: "ET",
    label: "ET — Technician",
    shortLabel: "ET",
    description: "Technical support staff",
    helpText:
      "Technical support personnel of major news agencies or photo agencies. ET accreditations are limited to organisations that rent Rate Card and telecommunications equipment at the MPC and competition venues. Not available to general media organisations.",
    isPhoto: false,
  },
  {
    value: "EC",
    label: "EC — Support Staff",
    shortLabel: "EC",
    description: "Office/support staff — MPC access only",
    helpText:
      "Support staff of an accredited press organisation (office assistant, secretary, interpreter, driver, etc.). EC accreditation provides MPC access only — no competition venue access. Requires the organisation to hold a reserved private office at the MPC.",
    isPhoto: false,
  },
];

/** All press (written/text) categories */
export const PRESS_CATEGORIES: AccredCategory[] = ["E", "Es", "ET", "EC"];

/** All photo categories */
export const PHOTO_CATEGORIES: AccredCategory[] = ["EP", "EPs"];

/** Parse categories from EoI form submission (checkboxes, one per category). */
export function parseCategorySelections(formData: FormData): Record<AccredCategory, boolean> {
  return {
    E:   formData.get("category_E") === "on",
    Es:  formData.get("category_Es") === "on",
    EP:  formData.get("category_EP") === "on",
    EPs: formData.get("category_EPs") === "on",
    ET:  formData.get("category_ET") === "on",
    EC:  formData.get("category_EC") === "on",
  };
}

/** Parse requested quantities for each selected category from form data. */
export function parseRequestedQuantities(
  formData: FormData,
  selected: Record<AccredCategory, boolean>
): Partial<Record<AccredCategory, number>> {
  const out: Partial<Record<AccredCategory, number>> = {};
  for (const cat of ACCRED_CATEGORIES) {
    if (selected[cat.value]) {
      const raw = formData.get(`requested_${cat.value}`) as string | null;
      const n = raw ? parseInt(raw, 10) : null;
      if (n && n > 0) out[cat.value] = n;
    }
  }
  return out;
}

/** True if any press category is selected. */
export function hasPressCats(selected: Record<AccredCategory, boolean>): boolean {
  return PRESS_CATEGORIES.some((c) => selected[c]);
}

/** True if any photo category is selected. */
export function hasPhotoCats(selected: Record<AccredCategory, boolean>): boolean {
  return PHOTO_CATEGORIES.some((c) => selected[c]);
}

/** Human-readable label from per-category booleans (for admin tables). */
export function categoryDisplayLabel(
  categoryE: boolean,
  categoryEs: boolean,
  categoryEp: boolean,
  categoryEps: boolean,
  categoryEt: boolean,
  categoryEc: boolean,
): string {
  const cats: string[] = [];
  if (categoryE) cats.push("E");
  if (categoryEs) cats.push("Es");
  if (categoryEp) cats.push("EP");
  if (categoryEps) cats.push("EPs");
  if (categoryEt) cats.push("ET");
  if (categoryEc) cats.push("EC");
  return cats.length > 0 ? cats.join(", ") : "—";
}

/** Derive legacy press/photo booleans from new per-category flags. */
export function deriveLegacyFlags(cats: Record<AccredCategory, boolean>): {
  categoryPress: boolean;
  categoryPhoto: boolean;
} {
  return {
    categoryPress: PRESS_CATEGORIES.some((c) => cats[c]),
    categoryPhoto: PHOTO_CATEGORIES.some((c) => cats[c]),
  };
}

/** Legacy compat: parse old "press" | "photo" | "both" chip value. */
export function parseCategoryFlags(category: string | null): {
  categoryPress: boolean;
  categoryPhoto: boolean;
} {
  if (category === "press") return { categoryPress: true, categoryPhoto: false };
  if (category === "photo") return { categoryPress: false, categoryPhoto: true };
  if (category === "both") return { categoryPress: true, categoryPhoto: true };
  return { categoryPress: false, categoryPhoto: false };
}
