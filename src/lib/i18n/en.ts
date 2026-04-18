/**
 * English strings for the public /apply form.
 * This is the canonical source — all keys must be defined here.
 */
export const en = {
  // ─── Layout ────────────────────────────────────────────────────────────────
  "layout.header.title": "Press Registration Portal",
  "layout.header.subtitle": "LA 2028 Olympic Games",
  "layout.header.checkStatus": "Check status →",
  "layout.footer": "© 2028 International Olympic Committee · Media Accreditation",

  // ─── Language toggle ────────────────────────────────────────────────────────
  "lang.en": "EN",
  "lang.fr": "FR",

  // ─── Apply landing page ─────────────────────────────────────────────────────
  "apply.title": "Apply for Media Accreditation",
  "apply.subtitle":
    "Enter your work email to get started. We'll issue an access code to verify your identity.",
  "apply.email.label": "Work email address",
  "apply.email.placeholder": "you@newsorg.com",
  "apply.email.help":
    "Use your organization's email domain — this is how we identify your media outlet.",
  "apply.submit": "Send Access Code →",
  "apply.alreadyHaveRef":
    "Already have a reference number? Contact your NOC directly.",

  // Apply error messages
  "apply.error.invalid_email": "Please enter a valid email address.",
  "apply.error.invalid_token":
    "Your access code has expired or has already been used. Please request a new one.",
  "apply.error.invalid_country":
    "Please select a valid country from the list (2-letter ISO code).",
  "apply.error.invalid_noc":
    "Please select a valid NOC code from the list (3-letter Olympic code).",
  "apply.error.window_closed":
    "The EoI window for your NOC is currently closed. Please contact your NOC directly.",
  "apply.error.rate_limited":
    "Too many requests. Please wait before trying again.",
  "apply.error.application_limit":
    "You have reached the maximum of 10 applications for this email address. Contact your NOC for assistance.",

  // ─── Verify page ────────────────────────────────────────────────────────────
  "verify.title": "Your Access Code",
  "verify.subtitle":
    "Use this code to access your application. Keep this page open — you will need it.",
  "verify.accessCodeFor": "Access code for",
  "verify.validity": "Valid for 24 hours · Single use",
  "verify.continue": "Continue to Application →",
  "verify.prototypeNote":
    "Prototype: In production this code is sent by email. Do not close this tab before submitting your application.",

  // ─── Form page (server wrapper) ─────────────────────────────────────────────
  "form.title.new": "LA 2028 Media Accreditation",
  "form.title.resubmit": "Resubmit Application",
  "form.title.edit": "Edit Application",
  "form.howDoesThisWork": "How does this work?",
  "form.subtitle.new":
    "Expression of Interest for press and photo accreditation at the Olympic and Paralympic Games Los Angeles 2028. Your application will be reviewed by your National Olympic Committee (NOC) before being forwarded to the IOC.",
  "form.subtitle.resubmit":
    "Review the feedback below, correct the relevant sections, and resubmit.",
  "form.subtitle.edit":
    "Your application is still pending review. You can update it below and save your changes.",

  // Resubmission / pending-edit banners
  "form.returnedBanner.heading": "Returned — corrections required",
  "form.returnedBanner.reference": "Reference:",
  "form.pendingBanner.heading": "Application pending review",
  "form.pendingBanner.body":
    "Your application has not yet been reviewed by your NOC. You can update the details below. Once your NOC begins their review you will no longer be able to make changes.",
  "form.pendingBanner.reference": "Reference:",

  // Form notes (bullets)
  "form.note.onePerOrg": "Only one application per organisation will be accepted.",
  "form.note.authorised":
    "Applications should be submitted by an authorised representative (sports editor, managing editor, or equivalent).",
  "form.note.required":
    "Fields marked with * are required. All other fields are optional but help strengthen your application.",

  // ─── EoiFormTabs ────────────────────────────────────────────────────────────
  // Tab labels
  "tabs.organisation": "Organisation",
  "tabs.contacts": "Contacts",
  "tabs.accreditation": "Accreditation",
  "tabs.publication": "Publication",
  "tabs.history": "History",

  // Tab status labels (sr-only)
  "tabs.status.empty": "Not started",
  "tabs.status.complete": "Required fields complete",
  "tabs.status.full": "Fully complete",

  // Collapsible intro
  "form.intro.summary": "How does this work?",
  "form.intro.heading": "This is an Expression of Interest (EoI)",
  "form.intro.heading.suffix": ", not a final accreditation decision. Submitting does not guarantee press credentials for LA 2028.",
  "form.intro.bullet1":
    "Your National Olympic Committee (NOC) reviews your organisation's eligibility and either accepts you as a candidate, returns for corrections, or declines.",
  "form.intro.bullet2":
    "Being accepted as a candidate does not guarantee accreditation. Slot allocations are decided in the Press by Number (PbN) phase, within the IOC-assigned quota for your NOC. Some candidates may ultimately receive no slots.",
  "form.intro.bullet3":
    "Final accreditation decisions are made by the IOC and communicated via your NOC.",
  "form.intro.bullet4": "You will be notified by email at each stage of the process.",

  // NOC window closed
  "form.nocWindowClosed.heading": "EoI window closed",
  "form.nocWindowClosed.body":
    "This NOC has closed its Expression of Interest window. New applications are not currently being accepted. Please contact your NOC directly for more information.",

  // Navigation buttons
  "form.nav.back": "← Back",
  "form.nav.continue": "Continue →",
  "form.nav.submit": "Submit Application",
  "form.nav.resubmit": "Resubmit Application",
  "form.nav.saveChanges": "Save Changes",

  // Auto-save note
  "form.autoSave":
    "Your progress is saved automatically. By submitting you confirm this information is accurate.",

  // Validation modal
  "form.validationModal.title": "Missing required fields",
  "form.validationModal.subtitle": "Please complete the following before submitting:",
  "form.validationModal.goToError": "Go to first missing field",

  // Confirm modal
  "form.confirmModal.title.submit": "Confirm submission",
  "form.confirmModal.title.resubmit": "Confirm resubmission",
  "form.confirmModal.title.edit": "Confirm changes",
  "form.confirmModal.desc.submit":
    "Your application will be sent to your NOC for review. You won't be able to edit it until your NOC returns it.",
  "form.confirmModal.desc.resubmit":
    "Your corrected application will be sent back to your NOC for review.",
  "form.confirmModal.desc.edit":
    "Your changes will be saved. Your application will remain pending review by your NOC.",
  "form.confirmModal.summary.organisation": "Organisation",
  "form.confirmModal.summary.categories": "Categories",
  "form.confirmModal.summary.contact": "Contact",
  "form.confirmModal.nudge.heading": "Some optional sections are incomplete.",
  "form.confirmModal.nudge.body":
    "Your application is ready to submit — all required information is complete. To give your organisation the best chance of approval, we recommend including supporting details such as publication history and coverage examples. NOCs give the most consideration to applications with full information.",
  "form.confirmModal.goBack": "Go back",
  "form.confirmModal.addEdit": "Add/Edit my application",
  "form.confirmModal.confirmSubmit": "Confirm & submit",
  "form.confirmModal.confirmResubmit": "Confirm resubmit",
  "form.confirmModal.saveChanges": "Save changes",
  "form.confirmModal.submitApplication": "Submit application",

  // Aria label
  "form.tablist.ariaLabel": "Application form sections",

  // ─── Organisation tab ────────────────────────────────────────────────────────
  "org.intro":
    "Tell us about your media organisation. Your NOC uses this information to evaluate eligibility and route your application.",
  "org.readonly":
    "Organisation details cannot be changed on resubmission. If this information is incorrect, contact your NOC directly.",
  "org.readonly.organisation": "Organisation",
  "org.readonly.noc": "NOC",
  "org.readonly.country": "Country",
  "org.readonly.type": "Type",

  "org.name.label": "Organisation name",
  "org.name.placeholder": "e.g. The Associated Press",
  "org.website.label": "Website",
  "org.website.placeholder": "https://",
  "org.type.label": "Organisation type",
  "org.type.placeholder": "Select type...",
  "org.type.print": "Print / Online Media",
  "org.type.broadcast": "Broadcast",
  "org.type.newsAgency": "News Agency",
  "org.type.freelancer": "Freelancer / Independent",
  "org.type.enr": "ENR Broadcaster (Non-Rights)",
  "org.type.other": "Other (please specify)",
  "org.type.other.label": "Please specify type",
  "org.type.other.placeholder": "Please describe your organisation type",
  "org.enr.info":
    "About ENR (Extended Non-Rights) broadcasters: ENR broadcasters apply for credentials from a separate pool. Your NOC will review and rank your request. ENR credentials are allocated by the IOC from a dedicated ENR pool, separate from the standard press quota.",

  "org.country.label": "Country",
  "org.country.placeholder": "US — United States",
  "org.country.help": "Type a code or country name",
  "org.noc.label": "Responsible NOC",
  "org.noc.placeholder": "USA — United States of America",
  "org.noc.autoSelected": "Auto-selected:",
  "org.noc.autoSelectedSuffix": "based on your country. Change this if your organisation is reviewed by a different NOC.",
  "org.noc.help":
    "The National Olympic Committee responsible for reviewing your application. Usually matches your country — select your country above to auto-fill.",

  "org.address.heading": "Mailing Address",
  "org.address.optional": "(optional)",
  "org.address.street.placeholder": "Street address",
  "org.address.suite.placeholder": "Suite, floor, building (optional)",
  "org.address.city.placeholder": "City",
  "org.address.state.placeholder": "State / Province",
  "org.address.postal.placeholder": "Postal code",

  "org.accessibility.legend":
    "Will any attending media member require wheelchair accessibility?",
  "org.accessibility.yes": "Yes",
  "org.accessibility.no": "No",
  "org.accessibility.help":
    "Venue accessibility arrangements will be coordinated if needed.",

  "org.pressCard.legend": "Press Card",
  "org.pressCard.question": "Do you hold a Press Card?",
  "org.pressCard.yes": "Yes",
  "org.pressCard.no": "No",
  "org.pressCard.issuer.label": "Issuing organisation",
  "org.pressCard.issuer.placeholder": "e.g. National Press Association",

  // ─── Contacts tab ────────────────────────────────────────────────────────────
  "contacts.intro":
    "The primary contact will receive all correspondence about this application, including status updates and any requests for corrections.",
  "contacts.primary.heading": "Primary Contact",
  "contacts.firstName.label": "First name",
  "contacts.firstName.placeholder": "First",
  "contacts.lastName.label": "Last name",
  "contacts.lastName.placeholder": "Last",
  "contacts.title.label": "Position / Title",
  "contacts.title.placeholder": "e.g. Sports Editor, Bureau Chief",
  "contacts.email.label": "Email address",
  "contacts.email.help": "Verified via your access link. Cannot be changed.",
  "contacts.phone.label": "Office phone",
  "contacts.phone.placeholder": "+1 212-555-0100",
  "contacts.cell.label": "Cell phone",
  "contacts.cell.placeholder": "+1 212-555-0101",
  "contacts.orgEmail.label": "Organisation email address",
  "contacts.orgEmail.placeholder": "e.g. press@yourorg.com",
  "contacts.orgEmail.optional": "(optional)",

  "contacts.addSecondary": "+ Add Editor-in-Chief / Media Manager",
  "contacts.secondary.heading": "Editor-in-Chief / Media Organisation Manager",
  "contacts.secondary.remove": "Remove",
  "contacts.secondary.help":
    "The Editor-in-Chief or Media Manager who oversees the accredited team at your organisation.",
  "contacts.secondary.firstName.label": "First name",
  "contacts.secondary.lastName.label": "Last name",
  "contacts.secondary.title.label": "Position / Title",
  "contacts.secondary.email.label": "Email address",
  "contacts.secondary.phone.label": "Office phone",
  "contacts.secondary.cell.label": "Cell phone",

  // ─── Accreditation tab ───────────────────────────────────────────────────────
  "accred.intro":
    "Select every accreditation category your team requires. You may select more than one. Your NOC has a limited quota per category assigned by the IOC — the quantities you request here help your NOC plan allocations across all applicant organisations.",
  "accred.categories.legend": "Accreditation categories",
  "accred.categories.help": "Select all that apply to your organisation.",
  "accred.category.required": "(required)",
  "accred.quantity.label": "How many {cat} accreditations are you requesting?",
  "accred.quantity.placeholder": "e.g. 3",
  "accred.quantity.maxEnr": "Maximum 3 for ENR organisations",
  "accred.quantity.max100": "Maximum 100 accreditations per category",
  "accred.categoryError": "Please select at least one accreditation category.",
  "accred.tooltip.ariaLabel": "More information",

  "accred.sportPicker.label": "Which Olympic sport?",
  "accred.sportPicker.required": "(required for Es / EPs)",
  "accred.sportPicker.help": "Required for Es / EPs — both categories cover the same sport.",
  "accred.sportPicker.placeholder": "Select a sport…",

  "accred.nocE.heading": "NOC E (Press Attaché)",
  "accred.nocE.body":
    " accreditations are not available through this form. They are nominated directly by your National Olympic Committee and do not count against the standard E quota. Contact your NOC if this applies to your team.",

  "accred.about.label":
    "Brief description of your coverage plans for Los Angeles 2028",
  "accred.about.placeholder":
    "Describe your organisation's editorial focus, the events and sports you plan to cover, the size of your on-site team, and any specific venue access requirements.",
  "accred.about.help":
    "Be specific. Your NOC uses this to evaluate and prioritise your request. Include details about your audience reach and how you plan to cover LA 2028.",

  "accred.enrType.label": "Type of programming",
  "accred.enrType.placeholder":
    "e.g. news programme, sports programme, regional sports coverage",
  "accred.enrType.help":
    "Required for ENR (Non-Media Rights Holder) applications.",

  // ─── Publication tab ─────────────────────────────────────────────────────────
  "pub.intro":
    "Help us understand your publication's reach and output. This information supports your NOC's evaluation and helps the IOC understand the media landscape for the Games.",
  "pub.types.label": "Publication type",
  "pub.types.selectAll": "(select all that apply)",
  "pub.types.other.placeholder": "Please specify...",
  "pub.types.App": "App",
  "pub.types.Editorial Website / Blog": "Editorial Website / Blog",
  "pub.types.Email Newsletter": "Email Newsletter",
  "pub.types.Magazine / Newspaper": "Magazine / Newspaper",
  "pub.types.Official NGB Publication": "Official NGB Publication",
  "pub.types.Photo Journal / Online Gallery": "Photo Journal / Online Gallery",
  "pub.types.Podcast": "Podcast",
  "pub.types.Print Newsletter": "Print Newsletter",
  "pub.types.Social Media": "Social Media",
  "pub.types.Television / Broadcast": "Television / Broadcast",
  "pub.types.Online Video / Streaming": "Online Video / Streaming",
  "pub.types.Freelancer with confirmed assignment":
    "Freelancer with confirmed assignment",
  "pub.types.Other": "Other",

  "pub.circulation.label": "Circulation / unique visitors per month",
  "pub.circulation.placeholder": "e.g. 500,000 monthly visitors",
  "pub.circulation.help": "Print circulation or website unique visitors",
  "pub.onlineVisitors.label": "Online unique visitors per month",
  "pub.onlineVisitors.optional": "(optional)",
  "pub.onlineVisitors.placeholder": "e.g. 500,000",
  "pub.geo.label": "Geographical coverage of publication",
  "pub.geo.optional": "(optional)",
  "pub.geo.placeholder": "Select…",
  "pub.geo.international": "International",
  "pub.geo.national": "National",
  "pub.geo.local": "Local / Regional",
  "pub.frequency.label": "Frequency of publication",
  "pub.frequency.placeholder": "e.g. Daily, Weekly, Monthly",
  "pub.social.label": "Social media accounts",
  "pub.social.optional": "(optional)",
  "pub.social.placeholder": "e.g. @org_name on X/Twitter, Instagram: @org_name",
  "pub.sports.label": "Which sports do you plan to cover at LA 2028?",
  "pub.sports.placeholder": "e.g. Athletics, Swimming, Gymnastics, Basketball",

  // ─── History tab ─────────────────────────────────────────────────────────────
  "history.intro":
    "Prior accreditation history helps establish your organisation's track record covering major international sporting events. If this is your first application, that's completely fine — just tell us about your sports coverage experience.",
  "history.olympic.legend":
    "Has your organisation received Olympic accreditation in the past?",
  "history.olympic.yes": "Yes",
  "history.olympic.no": "No",
  "history.olympic.years.label": "Which years?",
  "history.olympic.summer": "Summer Games:",
  "history.olympic.winter": "Winter Games:",
  "history.olympic.coverage.label": "Examples of past Games coverage",
  "history.olympic.coverage.placeholder":
    "Include links to published articles, photo galleries, or broadcasts from previous Olympic Games",
  "history.olympic.coverage.help": "Links to published work are strongly encouraged",
  "history.paralympic.legend":
    "Has your organisation received Paralympic accreditation in the past?",
  "history.paralympic.yes": "Yes",
  "history.paralympic.no": "No",
  "history.noPrior.label":
    "What sporting events does your organisation regularly cover?",
  "history.noPrior.placeholder":
    "Describe the sporting events, leagues, or competitions your organisation covers. Include any major international events.",
  "history.additional.label": "Additional information",
  "history.additional.placeholder":
    "Use this field for any additional information requested by your NOC, or anything else you'd like to tell us.",
  "history.additional.help":
    "Use this field for any additional information requested by your NOC, or anything else you'd like to tell us.",

  // ─── Status check page ───────────────────────────────────────────────────────
  "status.title": "Check Application Status",
  "status.subtitle":
    "Enter the email address you used to apply to view your application status.",
  "status.email.label": "Email address used when applying",
  "status.submit": "View My Status",
  "status.tokenNote":
    "The status link is valid for 90 days. You can request a new one at any time.",
  "status.error.invalid_email": "Please enter a valid email address.",

  // ─── Status view page ────────────────────────────────────────────────────────
  "statusView.title": "Application Status",
  "statusView.loggedInAs": "Logged in as",
  "statusView.noApps.heading": "No applications found",
  "statusView.noApps.body": "We couldn't find an application for",
  "statusView.noApps.tryAgain":
    "If you applied with a different address, try again. Otherwise contact your NOC directly.",
  "statusView.noApps.tryAgainLink": "try again",

  "statusView.status.pending": "Application Under Review",
  "statusView.status.resubmitted": "Application Under Review",
  "statusView.status.approved": "Accepted as Candidate",
  "statusView.status.returned": "Returned for Corrections",
  "statusView.status.rejected": "Rejected",

  "statusView.desc.pending": "Your application has been received and is under review.",
  "statusView.desc.resubmitted": "Your corrected application is under review.",
  "statusView.desc.approved":
    "Your NOC has accepted your application as a candidate for press accreditation. Accreditation slot allocation happens in the next phase (Press by Number) and is not guaranteed — some accepted candidates may ultimately receive no slots. You will be notified once the NOC's allocation is finalised.",
  "statusView.desc.returned":
    "Your NOC has requested corrections. Please review the note below and resubmit.",
  "statusView.desc.rejected": "Your application has not been accepted.",

  "statusView.nocNote.heading": "NOC note:",
  "statusView.allocationInProgress.heading": "Slot allocation in progress",
  "statusView.allocationInProgress.body":
    "Your accreditation numbers are being finalised. You will be contacted once slot allocation is confirmed.",
  "statusView.allocatedSlots.heading": "Allocated slots",
  "statusView.editApplication": "Edit application",
  "statusView.correctResubmit": "Correct & Resubmit",
  "statusView.viewSubmitted": "View submitted application",

  // Status view sections
  "statusView.section.organisation": "Organisation",
  "statusView.section.primaryContact": "Primary Contact",
  "statusView.section.secondaryContact": "Secondary Contact",
  "statusView.section.accreditation": "Accreditation",
  "statusView.section.publication": "Publication",
  "statusView.section.history": "History",
  "statusView.row.name": "Name",
  "statusView.row.type": "Type",
  "statusView.row.country": "Country",
  "statusView.row.noc": "NOC",
  "statusView.row.website": "Website",
  "statusView.row.address": "Address",
  "statusView.row.title": "Title",
  "statusView.row.email": "Email",
  "statusView.row.phone": "Phone",
  "statusView.row.mobile": "Mobile",
  "statusView.row.categories": "Categories",
  "statusView.row.about": "About",
  "statusView.row.types": "Types",
  "statusView.row.circulation": "Circulation",
  "statusView.row.frequency": "Frequency",
  "statusView.row.sportsCovered": "Sports covered",
  "statusView.row.priorOlympic": "Prior Olympic",
  "statusView.row.olympicYears": "Olympic years",
  "statusView.row.priorParalympic": "Prior Paralympic",
  "statusView.row.paralympicYears": "Paralympic years",
  "statusView.row.pastCoverage": "Past coverage",
  "statusView.row.comments": "Comments",
  "statusView.row.yes": "Yes",
  "statusView.row.no": "No",
  "statusView.row.requested": "requested",
  "statusView.footer": "Questions about your application? Contact your NOC directly.",

  // ─── Submitted page ──────────────────────────────────────────────────────────
  "submitted.title.new": "Application Submitted",
  "submitted.title.resubmit": "Application Resubmitted",
  "submitted.subtitle.new":
    "Your application has been received and is pending review by your NOC.",
  "submitted.subtitle.resubmit":
    "Your corrections have been received. Your NOC will review the updated application.",
  "submitted.refLabel": "Reference number",
  "submitted.refHelp": "Keep this for your records.",
  "submitted.nextSteps": "What happens next",
  "submitted.step1": "Your NOC reviews the application",
  "submitted.step2": "You'll be contacted if corrections are needed",
  "submitted.step3": "Approved applications are forwarded to the IOC",
  "submitted.viewStatus": "View application status →",
  "submitted.emailPreviewLabel": "Email notification preview",
  "submitted.emailPreviewNote":
    "Note: Email integration is not currently active. Below is a preview of the confirmation email that applicants will receive once it is enabled.",
  "submitted.email.from": "From:",
  "submitted.email.to": "To:",
  "submitted.email.subject": "Subject:",
  "submitted.email.subjectValue":
    "Application received – LA 2028 Olympic Games Press Accreditation",
  "submitted.email.dear": "Dear",
  "submitted.email.body1":
    "Thank you for submitting your Expression of Interest (EoI) for press accreditation at the",
  "submitted.email.gamesBold": "LA 2028 Olympic and Paralympic Games",
  "submitted.email.body2":
    "We have received your application and it is now under review by your National Olympic Committee (NOC). You will be notified at each stage of the process.",
  "submitted.email.refNumber": "Reference number",
  "submitted.email.organisation": "Organisation",
  "submitted.email.categoriesRequested": "Categories requested",
  "submitted.email.nextSteps": "What happens next:",
  "submitted.email.step1": "Your NOC will review your application for eligibility.",
  "submitted.email.step2": "You will be notified if corrections are needed.",
  "submitted.email.step3":
    "If accepted as a candidate, slot allocations are confirmed in the Press by Number phase.",
  "submitted.email.contact":
    "If you have questions about your application, please contact your NOC directly. You can check your status at any time at",
  "submitted.email.statusUrl": "prp.la28.org/apply/status",
  "submitted.email.regards": "Kind regards,",
  "submitted.email.team": "LA 2028 Press Registration Team",

  // ─── How It Works page ───────────────────────────────────────────────────────
  "hiw.backLink": "← Back to application",
  "hiw.title": "How the EoI Process Works",
  "hiw.subtitle":
    "A quick guide for media organisations applying for LA 2028 Olympic Games press accreditation.",
  "hiw.steps.heading": "The four steps",
  "hiw.step1.title": "Request a magic link",
  "hiw.step1.body":
    "Enter your email address on the application page. We'll send you a secure, one-time link. No password needed.",
  "hiw.step2.title": "Fill in the form",
  "hiw.step2.body":
    "The form takes about 10 minutes. Your progress is saved automatically, so you can close the tab and return later using the same link.",
  "hiw.step3.title": "Your NOC reviews your application",
  "hiw.step3.body":
    "The National Olympic Committee (NOC) for your country reviews all applications from their territory. They may accept your organisation as a candidate for accreditation, return it for corrections, or reject it. Being accepted at this stage means you're in the running — it does not yet mean you have been allocated accreditation slots.",
  "hiw.step4.title": "Press by Number (PbN)",
  "hiw.step4.body":
    "For accepted candidates, the NOC then enters the Press by Number phase — they allocate specific accreditation slots across categories (E, EP, ET, etc.) from their IOC-assigned quota. Quotas are limited, so not every accepted candidate will receive slots. The IOC reviews all NOC allocations before final confirmation.",
  "hiw.categories.heading": "Accreditation categories",
  "hiw.categories.col.code": "Code",
  "hiw.categories.col.description": "Description",
  "hiw.categories.E": "Written press / journalist (general)",
  "hiw.categories.Es": "Written press / journalist (sport-specific)",
  "hiw.categories.EP": "Photographer (general)",
  "hiw.categories.EPs": "Photographer (sport-specific)",
  "hiw.categories.ET": "Technical staff (broadcast & print production)",
  "hiw.categories.EC": "Editorial support staff",
  "hiw.categories.note":
    "You may apply for more than one category. Your NOC may adjust your category selection during review.",
  "hiw.faq.heading": "Frequently asked questions",
  "hiw.faq.q1": "I don't know which category to apply for.",
  "hiw.faq.a1":
    "Apply for the category that best matches your role. If you work across multiple roles (e.g. journalist and photographer), you can apply for both. Your NOC may adjust your selection.",
  "hiw.faq.q2": "What is my NOC?",
  "hiw.faq.a2":
    "Your National Olympic Committee (NOC) is the body that represents your country in the Olympic movement. There are 206 NOCs worldwide. On the form, enter your country and we'll suggest your NOC automatically.",
  "hiw.faq.q3": "Can I apply for more than one category?",
  "hiw.faq.a3": "Yes. Select all categories that apply to your work.",
  "hiw.faq.q4": "Can I save my form and come back later?",
  "hiw.faq.a4":
    "Yes. Your progress is saved automatically in your browser. Use the same magic link to return and continue. The link is valid for 24 hours — request a new one if it expires.",
  "hiw.faq.q5": "What happens if my NOC returns my application?",
  "hiw.faq.a5":
    "You'll receive a notification with the NOC's comments. Use your magic link to open the form again, make the requested corrections, and resubmit. It will go back to your NOC for review.",
  "hiw.readyToApply": "Ready to apply →",

  // ─── Validation errors ───────────────────────────────────────────────────────
  "validation.required": "This field is required.",
  "validation.selectOption": "Please select an option.",
  "validation.url": "Please enter a valid URL (e.g. https://www.example.com)",
  "validation.tabIncomplete": "Tab not yet completed",
  "validation.tabsIncomplete.one": "1 tab is incomplete.",
  "validation.tabsIncomplete.many": "{n} tabs are incomplete.",
  "validation.fieldsIncomplete.one": "1 required field is missing.",
  "validation.fieldsIncomplete.many": "{n} required fields are missing.",
} as const;

export type TranslationKey = keyof typeof en;
