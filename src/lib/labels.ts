export const ORG_TYPE_LABEL: Record<string, string> = {
  // Legacy values — for historical rows; not shown in /applyb dropdown
  media_print_online: "Print / Online Media",
  media_broadcast:    "Broadcast",
  news_agency:        "News Agency",
  freelancer:         "Freelancer / Independent",
  enr:                "ENR (Non-Rights Broadcaster)",
  ino:                "INO (Intl Non-Gov Organisation)",
  if_staff:           "IF Staff",

  // Excel-aligned values (LA28 Apr 2026 spec)
  print_media:                    "Print (Newspaper/Magazine)",
  press_agency:                   "Press Agency",
  photo_agency:                   "Photo Agency",
  editorial_website:              "Editorial Website",
  sport_specialist_website:       "Sport Specialist Website",
  photographer:                   "Photographer",
  freelance_journalist:           "Freelance Journalist",
  freelance_photographer:         "Freelance Photographer",
  sport_specialist_print:         "Sport Specialist Print",
  sport_specialist_photographer:  "Sport Specialist Photographer",
  non_mrh:                        "Non-Media Rights-Holding Radio/TV (Non-MRH)",

  other: "Other",
};

// Org types shown in the /applyb dropdown (in Excel order).
// Legacy values are excluded but still accepted for historical rows.
export const APPLYB_ORG_TYPES: { value: string; label: string }[] = [
  { value: "print_media",                    label: "Print (Newspaper/Magazine)" },
  { value: "press_agency",                   label: "Press Agency" },
  { value: "photo_agency",                   label: "Photo Agency" },
  { value: "editorial_website",              label: "Editorial Website" },
  { value: "sport_specialist_website",       label: "Sport Specialist Website" },
  { value: "photographer",                   label: "Photographer" },
  { value: "freelance_journalist",           label: "Freelance Journalist" },
  { value: "freelance_photographer",         label: "Freelance Photographer" },
  { value: "sport_specialist_print",         label: "Sport Specialist Print" },
  { value: "sport_specialist_photographer",  label: "Sport Specialist Photographer" },
  { value: "non_mrh",                        label: "Non-Media Rights-Holding Radio/TV (Non-MRH)" },
  { value: "other",                          label: "Other" },
];

export const FREELANCE_ORG_TYPES = new Set([
  "freelance_journalist",
  "freelance_photographer",
  // legacy
  "freelancer",
]);

export const GEO_COVERAGE_LABEL: Record<string, string> = {
  international: "International",
  national: "National",
  local: "Local / Regional",
};

export const PUB_TYPE_LABEL: Record<string, string> = {
  app: "App",
  editorial_website___blog: "Website / Blog",
  email_newsletter: "Email Newsletter",
  magazine___newspaper: "Magazine / Newspaper",
  official_ngb_publication: "NGB Publication",
  photo_journal___online_gallery: "Photo Gallery",
  podcast: "Podcast",
  print_newsletter: "Print Newsletter",
  social_media: "Social Media",
  freelancer_with_confirmed_assignment: "Freelancer",
  other: "Other",
};
