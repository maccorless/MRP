/**
 * French translations for the public /apply form.
 * Must cover every key defined in en.ts.
 */
import type { TranslationKey } from "./en";

export const fr: Record<TranslationKey, string> = {
  // ─── Layout ────────────────────────────────────────────────────────────────
  "layout.header.title": "Portail d'accréditation presse",
  "layout.header.subtitle": "Jeux olympiques LA 2028",
  "layout.header.checkStatus": "Vérifier le statut →",
  "layout.footer": "© 2028 Comité International Olympique · Accréditation média",

  // ─── Language toggle ────────────────────────────────────────────────────────
  "lang.en": "EN",
  "lang.fr": "FR",

  // ─── Apply landing page ─────────────────────────────────────────────────────
  "apply.title": "Demander une accréditation média",
  "apply.subtitle":
    "Saisissez votre e-mail professionnel pour commencer. Nous vous enverrons un code d'accès pour vérifier votre identité.",
  "apply.email.label": "Adresse e-mail professionnelle",
  "apply.email.placeholder": "vous@votre-media.com",
  "apply.email.help":
    "Utilisez le domaine e-mail de votre organisation — c'est ainsi que nous identifions votre média.",
  "apply.submit": "Envoyer le code d'accès →",
  "apply.alreadyHaveRef":
    "Vous avez déjà un numéro de référence ? Contactez directement votre CNO.",

  // Apply error messages
  "apply.error.invalid_email": "Veuillez saisir une adresse e-mail valide.",
  "apply.error.invalid_token":
    "Votre code d'accès a expiré ou a déjà été utilisé. Veuillez en demander un nouveau.",
  "apply.error.invalid_country":
    "Veuillez sélectionner un pays valide dans la liste (code ISO à 2 lettres).",
  "apply.error.invalid_noc":
    "Veuillez sélectionner un code CNO valide dans la liste (code olympique à 3 lettres).",
  "apply.error.window_closed":
    "La fenêtre de dépôt des EdI de votre CNO est actuellement fermée. Veuillez contacter directement votre CNO.",
  "apply.error.rate_limited":
    "Trop de tentatives. Veuillez patienter avant de réessayer.",
  "apply.error.application_limit":
    "Vous avez atteint le maximum de 10 demandes pour cette adresse e-mail. Contactez votre CNO pour obtenir de l'aide.",

  // ─── Verify page ────────────────────────────────────────────────────────────
  "verify.title": "Votre code d'accès",
  "verify.subtitle":
    "Utilisez ce code pour accéder à votre demande. Gardez cette page ouverte — vous en aurez besoin.",
  "verify.accessCodeFor": "Code d'accès pour",
  "verify.validity": "Valable 24 heures · Usage unique",
  "verify.continue": "Continuer vers la demande →",
  "verify.prototypeNote":
    "Prototype : en production, ce code est envoyé par e-mail. Ne fermez pas cet onglet avant de soumettre votre demande.",

  // ─── Form page (server wrapper) ─────────────────────────────────────────────
  "form.title.new": "Accréditation média LA 2028",
  "form.title.resubmit": "Resoumettre la demande",
  "form.title.edit": "Modifier la demande",
  "form.howDoesThisWork": "Comment ça marche ?",
  "form.subtitle.new":
    "Expression d'intérêt pour l'accréditation presse et photo aux Jeux olympiques et paralympiques de Los Angeles 2028. Votre demande sera examinée par votre Comité National Olympique (CNO) avant d'être transmise au CIO.",
  "form.subtitle.resubmit":
    "Examinez les commentaires ci-dessous, corrigez les sections concernées et resoumettez.",
  "form.subtitle.edit":
    "Votre demande est toujours en attente d'examen. Vous pouvez la mettre à jour ci-dessous et enregistrer vos modifications.",

  // Resubmission / pending-edit banners
  "form.returnedBanner.heading": "Renvoyée — corrections requises",
  "form.returnedBanner.reference": "Référence :",
  "form.pendingBanner.heading": "Demande en attente d'examen",
  "form.pendingBanner.body":
    "Votre demande n'a pas encore été examinée par votre CNO. Vous pouvez mettre à jour les informations ci-dessous. Une fois que votre CNO aura commencé son examen, vous ne pourrez plus effectuer de modifications.",
  "form.pendingBanner.reference": "Référence :",

  // Form notes (bullets)
  "form.note.onePerOrg":
    "Une seule demande par organisation sera acceptée.",
  "form.note.authorised":
    "Les demandes doivent être soumises par un représentant autorisé (rédacteur sportif, rédacteur en chef ou équivalent).",
  "form.note.required":
    "Les champs marqués d'un * sont obligatoires. Tous les autres sont facultatifs mais renforcent votre dossier.",

  // ─── EoiFormTabs ────────────────────────────────────────────────────────────
  // Tab labels
  "tabs.organisation": "Organisation",
  "tabs.contacts": "Contacts",
  "tabs.accreditation": "Accréditation",
  "tabs.publication": "Publication",
  "tabs.history": "Historique",

  // Tab status labels (sr-only)
  "tabs.status.empty": "Non commencé",
  "tabs.status.complete": "Champs obligatoires complétés",
  "tabs.status.full": "Entièrement complété",

  // Collapsible intro
  "form.intro.summary": "Comment ça marche ?",
  "form.intro.heading": "Il s'agit d'une Expression d'intérêt (EdI)",
  "form.intro.heading.suffix":
    ", et non d'une décision finale d'accréditation. Soumettre une demande ne garantit pas l'obtention d'une accréditation presse pour LA 2028.",
  "form.intro.bullet1":
    "Votre Comité National Olympique (CNO) examine l'éligibilité de votre organisation et l'accepte comme candidate, la renvoie pour corrections ou la refuse.",
  "form.intro.bullet2":
    "Être accepté comme candidat ne garantit pas l'accréditation. Les attributions de créneaux sont décidées lors de la phase Presse par Nombre (PbN), dans le cadre du quota attribué par le CIO à votre CNO. Certains candidats retenus peuvent finalement ne recevoir aucun créneau.",
  "form.intro.bullet3":
    "Les décisions finales d'accréditation sont prises par le CIO et communiquées via votre CNO.",
  "form.intro.bullet4":
    "Vous serez notifié par e-mail à chaque étape du processus.",

  // NOC window closed
  "form.nocWindowClosed.heading": "Fenêtre d'EdI fermée",
  "form.nocWindowClosed.body":
    "Ce CNO a fermé sa fenêtre d'Expression d'intérêt. Les nouvelles demandes ne sont pas acceptées pour le moment. Veuillez contacter directement votre CNO pour plus d'informations.",

  // Navigation buttons
  "form.nav.back": "← Retour",
  "form.nav.continue": "Continuer →",
  "form.nav.submit": "Soumettre la demande",
  "form.nav.resubmit": "Resoumettre la demande",
  "form.nav.saveChanges": "Enregistrer les modifications",

  // Auto-save note
  "form.autoSave":
    "Votre progression est enregistrée automatiquement. En soumettant, vous confirmez l'exactitude de ces informations.",

  // Validation modal
  "form.validationModal.title": "Champs obligatoires manquants",
  "form.validationModal.subtitle":
    "Veuillez compléter les éléments suivants avant de soumettre :",
  "form.validationModal.goToError": "Aller au premier champ manquant",

  // Confirm modal
  "form.confirmModal.title.submit": "Confirmer la soumission",
  "form.confirmModal.title.resubmit": "Confirmer la resoumission",
  "form.confirmModal.title.edit": "Confirmer les modifications",
  "form.confirmModal.desc.submit":
    "Votre demande sera transmise à votre CNO pour examen. Vous ne pourrez pas la modifier tant que votre CNO ne vous l'aura pas renvoyée.",
  "form.confirmModal.desc.resubmit":
    "Votre demande corrigée sera renvoyée à votre CNO pour examen.",
  "form.confirmModal.desc.edit":
    "Vos modifications seront enregistrées. Votre demande restera en attente d'examen par votre CNO.",
  "form.confirmModal.summary.organisation": "Organisation",
  "form.confirmModal.summary.categories": "Catégories",
  "form.confirmModal.summary.contact": "Contact",
  "form.confirmModal.nudge.heading":
    "Certaines sections facultatives sont incomplètes.",
  "form.confirmModal.nudge.body":
    "Votre demande est prête à être soumise — toutes les informations obligatoires sont complètes. Pour maximiser vos chances d'approbation, nous vous recommandons d'inclure des informations complémentaires telles que l'historique de publication et des exemples de couverture. Les CNO accordent davantage d'attention aux dossiers complets.",
  "form.confirmModal.goBack": "Retour",
  "form.confirmModal.addEdit": "Compléter / modifier ma demande",
  "form.confirmModal.confirmSubmit": "Confirmer et soumettre",
  "form.confirmModal.confirmResubmit": "Confirmer la resoumission",
  "form.confirmModal.saveChanges": "Enregistrer les modifications",
  "form.confirmModal.submitApplication": "Soumettre la demande",

  // Aria label
  "form.tablist.ariaLabel": "Sections du formulaire de demande",

  // ─── Organisation tab ────────────────────────────────────────────────────────
  "org.intro":
    "Parlez-nous de votre organisation médiatique. Votre CNO utilise ces informations pour évaluer l'éligibilité et traiter votre demande.",
  "org.readonly":
    "Les coordonnées de l'organisation ne peuvent pas être modifiées lors d'une resoumission. Si ces informations sont incorrectes, contactez directement votre CNO.",
  "org.readonly.organisation": "Organisation",
  "org.readonly.noc": "CNO",
  "org.readonly.country": "Pays",
  "org.readonly.type": "Type",

  "org.name.label": "Nom de l'organisation",
  "org.name.placeholder": "ex. Agence France-Presse",
  "org.website.label": "Site web",
  "org.website.placeholder": "https://",
  "org.type.label": "Type d'organisation",
  "org.type.placeholder": "Sélectionner un type...",
  "org.type.print": "Presse écrite / en ligne",
  "org.type.broadcast": "Audiovisuel",
  "org.type.newsAgency": "Agence de presse",
  "org.type.freelancer": "Pigiste / Indépendant",
  "org.type.enr": "Diffuseur ENR (non-droits)",
  "org.type.other": "Autre (veuillez préciser)",
  "org.type.other.label": "Veuillez préciser le type",
  "org.type.other.placeholder": "Décrivez le type de votre organisation",
  "org.enr.info":
    "À propos des diffuseurs ENR (Extended Non-Rights) : les diffuseurs ENR demandent des accréditations dans un quota séparé. Votre CNO examinera et classera votre demande. Les accréditations ENR sont attribuées par le CIO à partir d'un quota ENR dédié, distinct du quota presse standard.",

  "org.country.label": "Pays",
  "org.country.placeholder": "FR — France",
  "org.country.help": "Saisissez un code ou un nom de pays",
  "org.noc.label": "CNO responsable",
  "org.noc.placeholder": "FRA — France",
  "org.noc.autoSelected": "Sélection automatique :",
  "org.noc.autoSelectedSuffix":
    "basée sur votre pays. Modifiez si votre organisation est examinée par un CNO différent.",
  "org.noc.help":
    "Le Comité National Olympique responsable de l'examen de votre demande. Correspond généralement à votre pays — sélectionnez votre pays ci-dessus pour le remplir automatiquement.",

  "org.address.heading": "Adresse postale",
  "org.address.optional": "(facultatif)",
  "org.address.street.placeholder": "Adresse",
  "org.address.suite.placeholder": "Bureau, étage, bâtiment (facultatif)",
  "org.address.city.placeholder": "Ville",
  "org.address.state.placeholder": "Région / Province",
  "org.address.postal.placeholder": "Code postal",

  "org.accessibility.legend":
    "Des membres de votre équipe auront-ils besoin d'un accès en fauteuil roulant ?",
  "org.accessibility.yes": "Oui",
  "org.accessibility.no": "Non",
  "org.accessibility.help":
    "Des dispositions d'accessibilité dans les salles seront prises si nécessaire.",

  "org.pressCard.legend": "Carte de presse",
  "org.pressCard.question": "Êtes-vous titulaire d'une carte de presse ?",
  "org.pressCard.yes": "Oui",
  "org.pressCard.no": "Non",
  "org.pressCard.issuer.label": "Organisation émettrice",
  "org.pressCard.issuer.placeholder": "ex. Fédération Nationale de la Presse",

  // ─── Contacts tab ────────────────────────────────────────────────────────────
  "contacts.intro":
    "Le contact principal recevra toute la correspondance relative à cette demande, y compris les mises à jour de statut et les éventuelles demandes de corrections.",
  "contacts.primary.heading": "Contact principal",
  "contacts.firstName.label": "Prénom",
  "contacts.firstName.placeholder": "Prénom",
  "contacts.lastName.label": "Nom de famille",
  "contacts.lastName.placeholder": "Nom",
  "contacts.title.label": "Poste / Titre",
  "contacts.title.placeholder": "ex. Rédacteur sportif, Chef de bureau",
  "contacts.email.label": "Adresse e-mail",
  "contacts.email.help":
    "Vérifiée via votre lien d'accès. Ne peut pas être modifiée.",
  "contacts.phone.label": "Téléphone bureau",
  "contacts.phone.placeholder": "+33 1 23 45 67 89",
  "contacts.cell.label": "Téléphone portable",
  "contacts.cell.placeholder": "+33 6 12 34 56 78",
  "contacts.orgEmail.label": "Adresse e-mail de l'organisation",
  "contacts.orgEmail.placeholder": "ex. presse@votre-org.com",
  "contacts.orgEmail.optional": "(facultatif)",

  "contacts.addSecondary": "+ Ajouter rédacteur en chef / directeur médias",
  "contacts.secondary.heading": "Rédacteur en chef / Directeur de l'organisation médias",
  "contacts.secondary.remove": "Supprimer",
  "contacts.secondary.help":
    "Le rédacteur en chef ou directeur médias qui supervise l'équipe accréditée au sein de votre organisation.",
  "contacts.secondary.firstName.label": "Prénom",
  "contacts.secondary.lastName.label": "Nom de famille",
  "contacts.secondary.title.label": "Poste / Titre",
  "contacts.secondary.email.label": "Adresse e-mail",
  "contacts.secondary.phone.label": "Téléphone bureau",
  "contacts.secondary.cell.label": "Téléphone portable",

  // ─── Accreditation tab ───────────────────────────────────────────────────────
  "accred.intro":
    "Sélectionnez toutes les catégories d'accréditation requises par votre équipe. Vous pouvez en sélectionner plusieurs. Votre CNO dispose d'un quota limité par catégorie attribué par le CIO — les quantités que vous demandez ici aident votre CNO à planifier les attributions entre toutes les organisations candidates.",
  "accred.categories.legend": "Catégories d'accréditation",
  "accred.categories.help":
    "Sélectionnez toutes celles qui s'appliquent à votre organisation.",
  "accred.category.required": "(obligatoire)",
  "accred.quantity.label":
    "Combien d'accréditations {cat} demandez-vous ?",
  "accred.quantity.placeholder": "ex. 3",
  "accred.quantity.maxEnr": "Maximum 3 pour les organisations ENR",
  "accred.quantity.max100": "Maximum 100 accréditations par catégorie",
  "accred.categoryError":
    "Veuillez sélectionner au moins une catégorie d'accréditation.",
  "accred.tooltip.ariaLabel": "Plus d'informations",

  "accred.sportPicker.label": "Quel sport olympique ?",
  "accred.sportPicker.required": "(obligatoire pour Es / EPs)",
  "accred.sportPicker.help":
    "Obligatoire pour Es / EPs — les deux catégories couvrent le même sport.",
  "accred.sportPicker.placeholder": "Sélectionner un sport…",

  "accred.nocE.heading": "NOC E (Attaché de presse)",
  "accred.nocE.body":
    " les accréditations ne sont pas disponibles via ce formulaire. Elles sont nominées directement par votre Comité National Olympique et ne sont pas décomptées du quota E standard. Contactez votre CNO si cela concerne votre équipe.",

  "accred.about.label":
    "Brève description de vos projets de couverture pour Los Angeles 2028",
  "accred.about.placeholder":
    "Décrivez la ligne éditoriale de votre organisation, les événements et sports que vous prévoyez de couvrir, la taille de votre équipe sur place et tout besoin spécifique d'accès aux salles.",
  "accred.about.help":
    "Soyez précis. Votre CNO utilise cette description pour évaluer et prioriser votre demande. Incluez des détails sur votre audience et la façon dont vous prévoyez de couvrir LA 2028.",

  "accred.enrType.label": "Type de programmation",
  "accred.enrType.placeholder":
    "ex. journal télévisé, émission sportive, couverture sportive régionale",
  "accred.enrType.help":
    "Obligatoire pour les demandes ENR (diffuseurs non-droits).",

  // ─── Publication tab ─────────────────────────────────────────────────────────
  "pub.intro":
    "Aidez-nous à comprendre la portée et la production de votre publication. Ces informations soutiennent l'évaluation de votre CNO et aident le CIO à comprendre le paysage médiatique des Jeux.",
  "pub.types.label": "Type de publication",
  "pub.types.selectAll": "(sélectionnez toutes celles qui s'appliquent)",
  "pub.types.other.placeholder": "Veuillez préciser...",
  "pub.types.App": "Application",
  "pub.types.Editorial Website / Blog": "Site éditorial / Blog",
  "pub.types.Email Newsletter": "Newsletter e-mail",
  "pub.types.Magazine / Newspaper": "Magazine / Journal",
  "pub.types.Official NGB Publication": "Publication officielle de fédération",
  "pub.types.Photo Journal / Online Gallery": "Photo-journal / Galerie en ligne",
  "pub.types.Podcast": "Podcast",
  "pub.types.Print Newsletter": "Newsletter papier",
  "pub.types.Social Media": "Réseaux sociaux",
  "pub.types.Television / Broadcast": "Télévision / Diffusion",
  "pub.types.Online Video / Streaming": "Vidéo en ligne / Streaming",
  "pub.types.Freelancer with confirmed assignment":
    "Pigiste avec commande confirmée",
  "pub.types.Other": "Autre",

  "pub.circulation.label": "Tirage / visiteurs uniques par mois",
  "pub.circulation.placeholder": "ex. 500 000 visiteurs mensuels",
  "pub.circulation.help":
    "Tirage papier ou visiteurs uniques du site web",
  "pub.onlineVisitors.label": "Visiteurs uniques en ligne par mois",
  "pub.onlineVisitors.optional": "(facultatif)",
  "pub.onlineVisitors.placeholder": "ex. 500 000",
  "pub.geo.label": "Couverture géographique de la publication",
  "pub.geo.optional": "(facultatif)",
  "pub.geo.placeholder": "Sélectionner…",
  "pub.geo.international": "Internationale",
  "pub.geo.national": "Nationale",
  "pub.geo.local": "Locale / Régionale",
  "pub.frequency.label": "Fréquence de publication",
  "pub.frequency.placeholder": "ex. Quotidien, Hebdomadaire, Mensuel",
  "pub.social.label": "Comptes de réseaux sociaux",
  "pub.social.optional": "(facultatif)",
  "pub.social.placeholder":
    "ex. @nom_org sur X/Twitter, Instagram : @nom_org",
  "pub.sports.label": "Quels sports prévoyez-vous de couvrir à LA 2028 ?",
  "pub.sports.placeholder":
    "ex. Athlétisme, Natation, Gymnastique, Basketball",

  // ─── History tab ─────────────────────────────────────────────────────────────
  "history.intro":
    "L'historique d'accréditation préalable permet d'établir les antécédents de votre organisation dans la couverture de grands événements sportifs internationaux. Si c'est votre première demande, c'est tout à fait normal — parlez-nous simplement de votre expérience en matière de couverture sportive.",
  "history.olympic.legend":
    "Votre organisation a-t-elle obtenu une accréditation olympique par le passé ?",
  "history.olympic.yes": "Oui",
  "history.olympic.no": "Non",
  "history.olympic.years.label": "Pour quelles éditions ?",
  "history.olympic.summer": "Jeux d'été :",
  "history.olympic.winter": "Jeux d'hiver :",
  "history.olympic.coverage.label": "Exemples de couverture des Jeux précédents",
  "history.olympic.coverage.placeholder":
    "Incluez des liens vers des articles publiés, des galeries photos ou des émissions des Jeux olympiques précédents",
  "history.olympic.coverage.help":
    "Les liens vers des travaux publiés sont vivement encouragés",
  "history.paralympic.legend":
    "Votre organisation a-t-elle obtenu une accréditation paralympique par le passé ?",
  "history.paralympic.yes": "Oui",
  "history.paralympic.no": "Non",
  "history.noPrior.label":
    "Quels événements sportifs votre organisation couvre-t-elle régulièrement ?",
  "history.noPrior.placeholder":
    "Décrivez les événements sportifs, ligues ou compétitions que votre organisation couvre. Incluez tous grands événements internationaux.",
  "history.additional.label": "Informations complémentaires",
  "history.additional.placeholder":
    "Utilisez ce champ pour toute information complémentaire demandée par votre CNO, ou tout autre élément que vous souhaitez nous communiquer.",
  "history.additional.help":
    "Utilisez ce champ pour toute information complémentaire demandée par votre CNO, ou tout autre élément que vous souhaitez nous communiquer.",

  // ─── Status check page ───────────────────────────────────────────────────────
  "status.title": "Vérifier le statut de la demande",
  "status.subtitle":
    "Saisissez l'adresse e-mail utilisée lors de votre demande pour consulter son statut.",
  "status.email.label": "Adresse e-mail utilisée lors de la demande",
  "status.submit": "Voir mon statut",
  "status.tokenNote":
    "Le lien de statut est valable 90 jours. Vous pouvez en demander un nouveau à tout moment.",
  "status.error.invalid_email": "Veuillez saisir une adresse e-mail valide.",

  // ─── Status view page ────────────────────────────────────────────────────────
  "statusView.title": "Statut de la demande",
  "statusView.loggedInAs": "Connecté en tant que",
  "statusView.noApps.heading": "Aucune demande trouvée",
  "statusView.noApps.body": "Nous n'avons pas trouvé de demande pour",
  "statusView.noApps.tryAgain":
    "Si vous avez postulé avec une adresse différente, réessayez. Sinon, contactez directement votre CNO.",
  "statusView.noApps.tryAgainLink": "réessayer",

  "statusView.status.pending": "Demande en cours d'examen",
  "statusView.status.resubmitted": "Demande en cours d'examen",
  "statusView.status.approved": "Retenu comme candidat",
  "statusView.status.returned": "Renvoyée pour corrections",
  "statusView.status.rejected": "Refusée",

  "statusView.desc.pending":
    "Votre demande a été reçue et est en cours d'examen.",
  "statusView.desc.resubmitted": "Votre demande corrigée est en cours d'examen.",
  "statusView.desc.approved":
    "Votre CNO a retenu votre demande comme candidat à l'accréditation presse. L'attribution des créneaux d'accréditation a lieu lors de la phase suivante (Presse par Nombre) et n'est pas garantie — certains candidats retenus peuvent finalement ne recevoir aucun créneau. Vous serez notifié une fois l'attribution finalisée par le CNO.",
  "statusView.desc.returned":
    "Votre CNO a demandé des corrections. Veuillez relire la note ci-dessous et resoumettre.",
  "statusView.desc.rejected": "Votre demande n'a pas été acceptée.",

  "statusView.nocNote.heading": "Note du CNO :",
  "statusView.allocationInProgress.heading": "Attribution de créneaux en cours",
  "statusView.allocationInProgress.body":
    "Vos numéros d'accréditation sont en cours de finalisation. Vous serez contacté une fois l'attribution des créneaux confirmée.",
  "statusView.allocatedSlots.heading": "Créneaux attribués",
  "statusView.editApplication": "Modifier la demande",
  "statusView.correctResubmit": "Corriger et resoumettre",
  "statusView.viewSubmitted": "Voir la demande soumise",

  // Status view sections
  "statusView.section.organisation": "Organisation",
  "statusView.section.primaryContact": "Contact principal",
  "statusView.section.secondaryContact": "Contact secondaire",
  "statusView.section.accreditation": "Accréditation",
  "statusView.section.publication": "Publication",
  "statusView.section.history": "Historique",
  "statusView.row.name": "Nom",
  "statusView.row.type": "Type",
  "statusView.row.country": "Pays",
  "statusView.row.noc": "CNO",
  "statusView.row.website": "Site web",
  "statusView.row.address": "Adresse",
  "statusView.row.title": "Titre",
  "statusView.row.email": "E-mail",
  "statusView.row.phone": "Téléphone",
  "statusView.row.mobile": "Mobile",
  "statusView.row.categories": "Catégories",
  "statusView.row.about": "À propos",
  "statusView.row.types": "Types",
  "statusView.row.circulation": "Tirage",
  "statusView.row.frequency": "Fréquence",
  "statusView.row.sportsCovered": "Sports couverts",
  "statusView.row.priorOlympic": "Olympique antérieur",
  "statusView.row.olympicYears": "Éditions olympiques",
  "statusView.row.priorParalympic": "Paralympique antérieur",
  "statusView.row.paralympicYears": "Éditions paralympiques",
  "statusView.row.pastCoverage": "Couverture passée",
  "statusView.row.comments": "Commentaires",
  "statusView.row.yes": "Oui",
  "statusView.row.no": "Non",
  "statusView.row.requested": "demandé(es)",
  "statusView.footer":
    "Des questions sur votre demande ? Contactez directement votre CNO.",

  // ─── Submitted page ──────────────────────────────────────────────────────────
  "submitted.title.new": "Demande soumise",
  "submitted.title.resubmit": "Demande resoumise",
  "submitted.subtitle.new":
    "Votre demande a été reçue et est en attente d'examen par votre CNO.",
  "submitted.subtitle.resubmit":
    "Vos corrections ont été reçues. Votre CNO examinera la demande mise à jour.",
  "submitted.refLabel": "Numéro de référence",
  "submitted.refHelp": "Conservez ce numéro pour vos dossiers.",
  "submitted.nextSteps": "Prochaines étapes",
  "submitted.step1": "Votre CNO examine la demande",
  "submitted.step2": "Vous serez contacté si des corrections sont nécessaires",
  "submitted.step3": "Les demandes approuvées sont transmises au CIO",
  "submitted.viewStatus": "Voir le statut de la demande →",
  "submitted.emailPreviewLabel": "Aperçu de la notification e-mail",
  "submitted.emailPreviewNote":
    "Note : L'intégration e-mail n'est pas encore active. Vous trouverez ci-dessous un aperçu de l'e-mail de confirmation que les candidats recevront une fois celle-ci activée.",
  "submitted.email.from": "De :",
  "submitted.email.to": "À :",
  "submitted.email.subject": "Objet :",
  "submitted.email.subjectValue":
    "Demande reçue – Accréditation presse Jeux olympiques LA 2028",
  "submitted.email.dear": "Cher(e)",
  "submitted.email.body1":
    "Merci d'avoir soumis votre Expression d'intérêt (EdI) pour l'accréditation presse aux",
  "submitted.email.gamesBold": "Jeux olympiques et paralympiques LA 2028",
  "submitted.email.body2":
    "Nous avons bien reçu votre demande et elle est maintenant en cours d'examen par votre Comité National Olympique (CNO). Vous serez notifié à chaque étape du processus.",
  "submitted.email.refNumber": "Numéro de référence",
  "submitted.email.organisation": "Organisation",
  "submitted.email.categoriesRequested": "Catégories demandées",
  "submitted.email.nextSteps": "Prochaines étapes :",
  "submitted.email.step1":
    "Votre CNO examinera votre demande au regard des critères d'éligibilité.",
  "submitted.email.step2":
    "Vous serez notifié si des corrections sont nécessaires.",
  "submitted.email.step3":
    "Si retenu comme candidat, les attributions de créneaux sont confirmées lors de la phase Presse par Nombre.",
  "submitted.email.contact":
    "Pour toute question relative à votre demande, contactez directement votre CNO. Vous pouvez vérifier votre statut à tout moment sur",
  "submitted.email.statusUrl": "prp.la28.org/apply/statut",
  "submitted.email.regards": "Cordialement,",
  "submitted.email.team": "L'équipe d'inscription presse LA 2028",

  // ─── How It Works page ───────────────────────────────────────────────────────
  "hiw.backLink": "← Retour à la demande",
  "hiw.title": "Comment fonctionne le processus d'EdI",
  "hiw.subtitle":
    "Guide rapide pour les organisations médiatiques déposant une demande d'accréditation presse pour les Jeux olympiques LA 2028.",
  "hiw.steps.heading": "Les quatre étapes",
  "hiw.step1.title": "Demander un lien magique",
  "hiw.step1.body":
    "Saisissez votre adresse e-mail sur la page de demande. Nous vous enverrons un lien sécurisé à usage unique. Aucun mot de passe n'est nécessaire.",
  "hiw.step2.title": "Remplir le formulaire",
  "hiw.step2.body":
    "Le formulaire prend environ 10 minutes. Votre progression est enregistrée automatiquement, vous pouvez donc fermer l'onglet et revenir plus tard en utilisant le même lien.",
  "hiw.step3.title": "Votre CNO examine votre demande",
  "hiw.step3.body":
    "Le Comité National Olympique (CNO) de votre pays examine toutes les demandes de son territoire. Il peut accepter votre organisation comme candidate à l'accréditation, la renvoyer pour corrections ou la refuser. Être retenu à ce stade signifie que vous êtes en lice — cela ne signifie pas encore que des créneaux d'accréditation vous ont été attribués.",
  "hiw.step4.title": "Presse par Nombre (PbN)",
  "hiw.step4.body":
    "Pour les candidats retenus, le CNO entre ensuite dans la phase Presse par Nombre — il attribue des créneaux d'accréditation spécifiques par catégorie (E, EP, ET, etc.) à partir de son quota attribué par le CIO. Les quotas étant limités, tous les candidats retenus ne recevront pas forcément des créneaux. Le CIO passe en revue toutes les attributions des CNO avant la confirmation finale.",
  "hiw.categories.heading": "Catégories d'accréditation",
  "hiw.categories.col.code": "Code",
  "hiw.categories.col.description": "Description",
  "hiw.categories.E": "Presse écrite / journaliste (général)",
  "hiw.categories.Es": "Presse écrite / journaliste (sport spécifique)",
  "hiw.categories.EP": "Photographe (général)",
  "hiw.categories.EPs": "Photographe (sport spécifique)",
  "hiw.categories.ET": "Personnel technique (production audiovisuelle et presse)",
  "hiw.categories.EC": "Personnel de soutien éditorial",
  "hiw.categories.note":
    "Vous pouvez postuler pour plusieurs catégories. Votre CNO peut ajuster votre sélection lors de l'examen.",
  "hiw.faq.heading": "Questions fréquentes",
  "hiw.faq.q1": "Je ne sais pas quelle catégorie choisir.",
  "hiw.faq.a1":
    "Postulez pour la catégorie qui correspond le mieux à votre rôle. Si vous exercez plusieurs rôles (ex. journaliste et photographe), vous pouvez postuler pour les deux. Votre CNO peut ajuster votre sélection.",
  "hiw.faq.q2": "Qu'est-ce que mon CNO ?",
  "hiw.faq.a2":
    "Votre Comité National Olympique (CNO) est l'organisme qui représente votre pays dans le mouvement olympique. Il existe 206 CNO dans le monde. Sur le formulaire, saisissez votre pays et nous vous suggérerons votre CNO automatiquement.",
  "hiw.faq.q3": "Puis-je postuler pour plusieurs catégories ?",
  "hiw.faq.a3": "Oui. Sélectionnez toutes les catégories correspondant à votre travail.",
  "hiw.faq.q4": "Puis-je enregistrer le formulaire et y revenir plus tard ?",
  "hiw.faq.a4":
    "Oui. Votre progression est enregistrée automatiquement dans votre navigateur. Utilisez le même lien magique pour revenir et continuer. Le lien est valable 24 heures — demandez-en un nouveau s'il a expiré.",
  "hiw.faq.q5":
    "Que se passe-t-il si mon CNO renvoie ma demande ?",
  "hiw.faq.a5":
    "Vous recevrez une notification avec les commentaires du CNO. Utilisez votre lien magique pour rouvrir le formulaire, apporter les corrections demandées et resoumettre. Il sera renvoyé à votre CNO pour examen.",
  "hiw.readyToApply": "Prêt à postuler →",

  // ─── Validation errors ───────────────────────────────────────────────────────
  "validation.required": "Ce champ est obligatoire.",
  "validation.selectOption": "Veuillez sélectionner une option.",
  "validation.url":
    "Veuillez saisir une URL valide (ex. https://www.exemple.com)",
  "validation.tabIncomplete": "Onglet non encore complété",
  "validation.tabsIncomplete.one": "1 onglet est incomplet.",
  "validation.tabsIncomplete.many": "{n} onglets sont incomplets.",
  "validation.fieldsIncomplete.one": "1 champ obligatoire est manquant.",
  "validation.fieldsIncomplete.many": "{n} champs obligatoires sont manquants.",
};
