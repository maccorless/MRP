/**
 * Spanish strings for the public /apply form.
 * Generated from en.ts — proof-checking by a native speaker is required before activation.
 */
export const es = {
  // ─── Layout ────────────────────────────────────────────────────────────────
  "layout.header.title": "Portal de Registro de Prensa",
  "layout.header.subtitle": "Juegos Olímpicos LA 2028",
  "layout.header.checkStatus": "Ver estado →",
  "layout.footer": "© 2028 Comité Olímpico Internacional · Acreditación de Prensa",

  // ─── Language toggle ────────────────────────────────────────────────────────
  "lang.en": "EN",
  "lang.fr": "FR",

  // ─── Apply landing page ─────────────────────────────────────────────────────
  "apply.title": "Solicitar Acreditación de Prensa",
  "apply.subtitle":
    "Introduzca su correo electrónico de trabajo para comenzar. Le enviaremos un código de acceso para verificar su identidad.",
  "apply.email.label": "Correo electrónico de trabajo",
  "apply.email.placeholder": "usted@mediosdecomunicacion.com",
  "apply.email.help":
    "Utilice el dominio de correo electrónico de su organización — así identificamos su medio de comunicación.",
  "apply.submit": "Enviar Código de Acceso →",
  "apply.alreadyHaveRef": "¿Ya ha enviado su solicitud?",
  "apply.checkStatusLink": "Consultar el estado de su solicitud",

  // Apply error messages
  "apply.error.invalid_email": "Por favor, introduzca una dirección de correo electrónico válida.",
  "apply.error.invalid_token":
    "Su código de acceso ha caducado o ya ha sido utilizado. Por favor, solicite uno nuevo.",
  "apply.error.invalid_country":
    "Por favor, seleccione un país válido de la lista (código ISO de 2 letras).",
  "apply.error.invalid_noc":
    "Por favor, seleccione un código de CON válido de la lista (código olímpico de 3 letras).",
  "apply.error.window_closed":
    "La ventana de Expresión de Interés para su territorio está actualmente cerrada por el comité organizador de los Juegos Olímpicos. Por favor, vuelva a intentarlo más tarde o póngase en contacto con el comité organizador para más información.",
  "apply.error.rate_limited":
    "Demasiadas solicitudes. Por favor, espere antes de volver a intentarlo.",
  "apply.error.application_limit":
    "Ha alcanzado el máximo de 10 solicitudes para esta dirección de correo electrónico. Póngase en contacto con su CON para obtener asistencia.",
  "apply.error.enr_non_mrh_only":
    "La acreditación ENR solo puede ser solicitada por organizaciones No-MRH. Cambie el tipo de organización o establezca la solicitud de ENR en 0.",

  // ─── Verify page ────────────────────────────────────────────────────────────
  "verify.title": "Su Código de Acceso",
  "verify.subtitle":
    "Utilice este código para acceder a su solicitud. Mantenga esta página abierta — lo necesitará.",
  "verify.accessCodeFor": "Código de acceso para",
  "verify.validity": "Válido durante 24 horas · De un solo uso",
  "verify.continue": "Continuar con la Solicitud →",
  "verify.prototypeNote":
    "Prototipo: En producción este código se envía por correo electrónico. No cierre esta pestaña antes de enviar su solicitud.",

  // ─── Form page (server wrapper) ─────────────────────────────────────────────
  "form.title.new": "Acreditación de Prensa LA 2028",
  "form.title.resubmit": "Volver a Enviar Solicitud",
  "form.title.edit": "Editar Solicitud",
  "form.howDoesThisWork": "¿Cómo funciona?",
  "form.subtitle.new":
    "Expresión de Interés para acreditación de prensa y fotografía en los Juegos Olímpicos y Paralímpicos Los Ángeles 2028. Su solicitud será revisada por su Comité Olímpico Nacional (CON) antes de ser enviada al COI.",
  "form.subtitle.resubmit":
    "Revise los comentarios a continuación, corrija las secciones correspondientes y vuelva a enviar.",
  "form.subtitle.edit":
    "Su solicitud está pendiente de revisión. Puede actualizarla a continuación y guardar los cambios.",

  // Resubmission / pending-edit banners
  "form.returnedBanner.heading": "Devuelta — se requieren correcciones",
  "form.returnedBanner.reference": "Referencia:",
  "form.pendingBanner.heading": "Solicitud pendiente de revisión",
  "form.pendingBanner.body":
    "Su solicitud aún no ha sido revisada por su CON. Puede actualizar los datos a continuación. Una vez que su CON comience su revisión, ya no podrá realizar cambios.",
  "form.pendingBanner.reference": "Referencia:",

  // Form notes (bullets)
  "form.note.onePerOrg": "Solo se aceptará una solicitud por organización.",
  "form.note.authorised":
    "Las solicitudes deben ser enviadas por un representante autorizado (editor de deportes, editor jefe o equivalente).",
  "form.note.required":
    "Los campos marcados con * son obligatorios. El resto son opcionales pero ayudan a reforzar su solicitud.",

  // ─── EoiFormTabs ────────────────────────────────────────────────────────────
  // Tab labels
  "tabs.organisation": "Organización",
  "tabs.contacts": "Contactos",
  "tabs.accreditation": "Acreditación",
  "tabs.publication": "Publicación",
  "tabs.history": "Historial",

  // Tab status labels (sr-only)
  "tabs.status.empty": "No iniciado",
  "tabs.status.complete": "Campos obligatorios completos",
  "tabs.status.full": "Totalmente completo",

  // Collapsible intro
  "form.intro.summary": "¿Cómo funciona?",
  "form.intro.heading": "Esta es una Expresión de Interés (EoI)",
  "form.intro.heading.suffix": ", no una decisión final de acreditación. El envío no garantiza credenciales de prensa para LA 2028.",
  "form.intro.bullet1":
    "Su Comité Olímpico Nacional (CON) revisa la elegibilidad de su organización y la acepta como candidata, la devuelve para correcciones o la rechaza.",
  "form.intro.bullet2":
    "Ser aceptado como candidato no garantiza la acreditación. La asignación de plazas se decide en la fase de Prensa por Número (PbN), dentro de la cuota asignada por el COI a su CON. Algunos candidatos pueden no recibir ninguna plaza.",
  "form.intro.bullet3":
    "Las decisiones finales de acreditación son tomadas por el COI y comunicadas a través de su CON.",
  "form.intro.bullet4": "Será notificado por correo electrónico en cada etapa del proceso.",

  // Window closed (authority: OCOG, not the NOC)
  "form.nocWindowClosed.heading": "Ventana de Expresión de Interés cerrada",
  "form.nocWindowClosed.body":
    "El comité organizador de los Juegos Olímpicos ha cerrado la ventana de Expresión de Interés para este territorio. Actualmente no se están aceptando nuevas solicitudes.",

  // Navigation buttons
  "form.nav.back": "← Atrás",
  "form.nav.continue": "Continuar →",
  "form.nav.submit": "Enviar Solicitud",
  "form.nav.resubmit": "Volver a Enviar Solicitud",
  "form.nav.saveChanges": "Guardar Cambios",

  // Auto-save note
  "form.autoSave":
    "Su progreso se guarda automáticamente. Al enviar confirma que esta información es correcta.",

  // Validation modal
  "form.validationModal.title": "Faltan campos obligatorios",
  "form.validationModal.subtitle": "Por favor, complete lo siguiente antes de enviar:",
  "form.validationModal.goToError": "Ir al primer campo faltante",

  // Confirm modal
  "form.confirmModal.title.submit": "Confirmar envío",
  "form.confirmModal.title.resubmit": "Confirmar reenvío",
  "form.confirmModal.title.edit": "Confirmar cambios",
  "form.confirmModal.desc.submit":
    "Su solicitud será enviada a su CON para revisión. No podrá editarla hasta que su CON la devuelva.",
  "form.confirmModal.desc.resubmit":
    "Su solicitud corregida será enviada de nuevo a su CON para revisión.",
  "form.confirmModal.desc.edit":
    "Sus cambios serán guardados. Su solicitud permanecerá pendiente de revisión por su CON.",
  "form.confirmModal.summary.organisation": "Organización",
  "form.confirmModal.summary.categories": "Categorías de Acreditación de Prensa",
  "form.confirmModal.summary.contact": "Contacto",
  "form.confirmModal.nudge.heading": "Algunas secciones opcionales están incompletas.",
  "form.confirmModal.nudge.body":
    "Su solicitud está lista para enviar — toda la información obligatoria está completa. Para dar a su organización las mejores posibilidades de aprobación, le recomendamos incluir detalles adicionales como historial de publicaciones y ejemplos de cobertura. Los CON dan mayor consideración a las solicitudes con información completa.",
  "form.confirmModal.goBack": "Volver",
  "form.confirmModal.addEdit": "Añadir/Editar mi solicitud",
  "form.confirmModal.confirmSubmit": "Confirmar y enviar",
  "form.confirmModal.confirmResubmit": "Confirmar reenvío",
  "form.confirmModal.saveChanges": "Guardar cambios",
  "form.confirmModal.submitApplication": "Enviar solicitud",

  // Aria label
  "form.tablist.ariaLabel": "Secciones del formulario de solicitud",

  // ─── Organisation tab ────────────────────────────────────────────────────────
  "org.intro":
    "Cuéntenos sobre su organización de medios. Su CON utiliza esta información para evaluar la elegibilidad y gestionar su solicitud.",
  "org.readonly":
    "Los datos de la organización no se pueden modificar al volver a enviar. Si esta información es incorrecta, contacte directamente con su CON.",
  "org.readonly.organisation": "Organización",
  "org.readonly.noc": "CON",
  "org.readonly.country": "País",
  "org.readonly.type": "Tipo",

  "org.name.label": "Nombre de la organización",
  "org.name.placeholder": "p. ej. Agencia EFE",
  "org.website.label": "Sitio web",
  "org.website.placeholder": "https://",
  "org.type.label": "Tipo de organización",
  "org.type.placeholder": "Seleccionar tipo...",
  "org.type.print": "Medios impresos / En línea",
  "org.type.broadcast": "Radiodifusión",
  "org.type.newsAgency": "Agencia de noticias",
  "org.type.freelancer": "Freelance / Independiente",
  "org.type.enr": "Radiodifusor ENR (Sin derechos)",
  "org.type.other": "Otro (especificar)",
  "org.type.other.label": "Especifique el tipo",
  "org.type.other.placeholder": "Describa el tipo de su organización",
  "org.enr.info":
    "Sobre los titulares ENR (Non-Media Rights-Holders): los titulaires ENR solicitan acreditaciones de un cupo separado. Su CON revisará y clasificará su solicitud. Las acreditaciones ENR son asignadas por el COI a partir de un cupo ENR dedicado, separado del cupo de prensa estándar.",

  "org.country.label": "País",
  "org.country.placeholder": "ES — España",
  "org.country.help": "Escriba un código o nombre de país",
  "org.noc.label": "CON responsable",
  "org.noc.placeholder": "ESP — España",
  "org.noc.autoSelected": "Seleccionado automáticamente:",
  "org.noc.autoSelectedSuffix": "según su país. Cámbielo si su organización es revisada por un CON diferente.",
  "org.noc.help":
    "El Comité Olímpico Nacional responsable de revisar su solicitud. Normalmente coincide con su país — seleccione su país arriba para autocompletar.",

  "org.address.heading": "Dirección postal",
  "org.address.optional": "(opcional)",
  "org.address.street.placeholder": "Dirección",
  "org.address.suite.placeholder": "Suite, piso, edificio (opcional)",
  "org.address.city.placeholder": "Ciudad",
  "org.address.state.placeholder": "Estado / Provincia",
  "org.address.postal.placeholder": "Código postal",

  "org.accessibility.legend":
    "¿Algún miembro del equipo de medios requerirá accesibilidad para silla de ruedas?",
  "org.accessibility.yes": "Sí",
  "org.accessibility.no": "No",
  "org.accessibility.help":
    "Se coordinarán los arreglos de accesibilidad en los recintos si es necesario.",

  "org.pressCard.legend": "Tarjeta de Prensa",
  "org.pressCard.question": "¿Dispone de Tarjeta de Prensa?",
  "org.pressCard.yes": "Sí",
  "org.pressCard.no": "No",
  "org.pressCard.issuer.label": "Organización emisora",
  "org.pressCard.issuer.placeholder": "p. ej. Asociación Nacional de Prensa",

  // ─── Contacts tab ────────────────────────────────────────────────────────────
  "contacts.intro":
    "El contacto principal recibirá toda la correspondencia sobre esta solicitud, incluidas las actualizaciones de estado y cualquier solicitud de correcciones.",
  "contacts.primary.heading": "Contacto Principal",
  "contacts.firstName.label": "Nombre",
  "contacts.firstName.placeholder": "Nombre",
  "contacts.lastName.label": "Apellidos",
  "contacts.lastName.placeholder": "Apellidos",
  "contacts.title.label": "Cargo / Título",
  "contacts.title.placeholder": "p. ej. Editor de Deportes, Jefe de Oficina",
  "contacts.email.label": "Correo electrónico",
  "contacts.email.help": "Verificado mediante su enlace de acceso. No se puede cambiar.",
  "contacts.phone.label": "Teléfono de oficina",
  "contacts.phone.placeholder": "+34 91 555 0100",
  "contacts.cell.label": "Teléfono móvil",
  "contacts.cell.placeholder": "+34 600 555 0101",
  "contacts.orgEmail.label": "Correo electrónico de la organización",
  "contacts.orgEmail.placeholder": "p. ej. prensa@suorganizacion.com",
  "contacts.orgEmail.optional": "(opcional)",

  "contacts.addSecondary": "+ Añadir Director/a / Responsable de Medios",
  "contacts.secondary.heading": "Director/a / Responsable de la Organización de Medios",
  "contacts.secondary.remove": "Eliminar",
  "contacts.secondary.help":
    "El Director o Responsable de Medios que supervisa el equipo acreditado en su organización.",
  "contacts.secondary.firstName.label": "Nombre",
  "contacts.secondary.lastName.label": "Apellidos",
  "contacts.secondary.title.label": "Cargo / Título",
  "contacts.secondary.email.label": "Correo electrónico",
  "contacts.secondary.phone.label": "Teléfono de oficina",
  "contacts.secondary.cell.label": "Teléfono móvil",

  // ─── Accreditation tab ───────────────────────────────────────────────────────
  "accred.intro":
    "Seleccione todas las categorías de acreditación que necesita su equipo. Puede seleccionar más de una. Su CON tiene un cupo limitado por categoría asignado por el COI — las cantidades que solicita aquí ayudan a su CON a planificar las asignaciones entre todas las organizaciones solicitantes.",
  "accred.categories.legend": "Categorías de acreditación",
  "accred.categories.help": "Seleccione todas las que correspondan a su organización.",
  "accred.category.required": "(obligatorio)",
  "accred.quantity.label": "¿Cuántas acreditaciones {cat} solicita?",
  "accred.quantity.placeholder": "p. ej. 3",
  "accred.quantity.maxEnr": "Máximo 3 para organizaciones ENR",
  "accred.quantity.max100": "Máximo 100 acreditaciones por categoría",
  "accred.categoryError": "Por favor, seleccione al menos una categoría de acreditación.",
  "accred.tooltip.ariaLabel": "Más información",

  "accred.sportPicker.label": "¿Qué deporte olímpico?",
  "accred.sportPicker.required": "(obligatorio para Es / EPs)",
  "accred.sportPicker.help": "Obligatorio para Es / EPs — ambas categorías cubren el mismo deporte.",
  "accred.sportPicker.placeholder": "Seleccionar un deporte…",

  "accred.nocE.heading": "CON E (Attaché de Prensa)",
  "accred.nocE.body":
    " las acreditaciones no están disponibles a través de este formulario. Son nominadas directamente por su Comité Olímpico Nacional y no cuentan para el cupo estándar E. Contacte con su CON si esto aplica a su equipo.",

  "accred.about.label":
    "Breve descripción de sus planes de cobertura para Los Ángeles 2028",
  "accred.about.placeholder":
    "Describa el enfoque editorial de su organización, los eventos y deportes que planea cubrir, el tamaño de su equipo in situ y cualquier requisito específico de acceso a recintos.",
  "accred.about.help":
    "Sea específico. Su CON utiliza esto para evaluar y priorizar su solicitud. Incluya detalles sobre su alcance de audiencia y cómo planea cubrir LA 2028.",

  "accred.enrType.label": "Tipo de programación",
  "accred.enrType.placeholder":
    "p. ej. programa de noticias, programa deportivo, cobertura deportiva regional",
  "accred.enrType.help":
    "Obligatorio para solicitudes ENR (titulares sin derechos de medios).",

  // ─── Publication tab ─────────────────────────────────────────────────────────
  "pub.intro":
    "Ayúdenos a comprender el alcance y la producción de su publicación. Esta información respalda la evaluación de su CON y ayuda al COI a conocer el panorama mediático de los Juegos.",
  "pub.types.label": "Tipo de publicación",
  "pub.types.selectAll": "(seleccione todas las que correspondan)",
  "pub.types.other.placeholder": "Por favor, especifique...",
  "pub.types.App": "Aplicación",
  "pub.types.Editorial Website / Blog": "Sitio web editorial / Blog",
  "pub.types.Email Newsletter": "Boletín por correo electrónico",
  "pub.types.Magazine / Newspaper": "Revista / Periódico",
  "pub.types.Official NGB Publication": "Publicación oficial de federación nacional",
  "pub.types.Photo Journal / Online Gallery": "Revista fotográfica / Galería en línea",
  "pub.types.Podcast": "Podcast",
  "pub.types.Print Newsletter": "Boletín impreso",
  "pub.types.Social Media": "Redes sociales",
  "pub.types.Television / Broadcast": "Televisión / Radiodifusión",
  "pub.types.Online Video / Streaming": "Vídeo en línea / Streaming",
  "pub.types.Freelancer with confirmed assignment":
    "Freelance con encargo confirmado",
  "pub.types.Other": "Otro",
  "pub.types.required": "Por favor, seleccione al menos un tipo de publicación.",

  "pub.circulation.label": "Tirada / visitantes únicos al mes",
  "pub.circulation.placeholder": "p. ej. 500.000 visitantes mensuales",
  "pub.circulation.help": "Tirada impresa o visitantes únicos del sitio web",
  "pub.onlineVisitors.label": "Visitantes únicos en línea al mes",
  "pub.onlineVisitors.optional": "(opcional)",
  "pub.onlineVisitors.placeholder": "p. ej. 500.000",
  "pub.geo.label": "Cobertura geográfica de la publicación",
  "pub.geo.optional": "(opcional)",
  "pub.geo.placeholder": "Seleccionar…",
  "pub.geo.international": "Internacional",
  "pub.geo.national": "Nacional",
  "pub.geo.local": "Local / Regional",
  "pub.frequency.label": "Frecuencia de publicación",
  "pub.frequency.placeholder": "p. ej. Diaria, Semanal, Mensual",
  "pub.social.label": "Cuentas en redes sociales",
  "pub.social.optional": "(opcional)",
  "pub.social.placeholder": "p. ej. @nombre_org en X/Twitter, Instagram: @nombre_org",
  "pub.sports.label": "¿Qué deportes planea cubrir en LA 2028?",
  "pub.sports.placeholder": "p. ej. Atletismo, Natación, Gimnasia, Baloncesto",

  // ─── History tab ─────────────────────────────────────────────────────────────
  "history.intro":
    "El historial de acreditaciones previas ayuda a establecer el historial de su organización en la cobertura de grandes eventos deportivos internacionales. Si es su primera solicitud, no hay ningún problema — simplemente cuéntenos sobre su experiencia en cobertura deportiva.",
  "history.olympic.legend":
    "¿Ha recibido su organización acreditación olímpica en el pasado?",
  "history.olympic.yes": "Sí",
  "history.olympic.no": "No",
  "history.olympic.years.label": "¿En qué años?",
  "history.olympic.summer": "Juegos de Verano:",
  "history.olympic.winter": "Juegos de Invierno:",
  "history.olympic.coverage.label": "Ejemplos de cobertura de Juegos anteriores",
  "history.olympic.coverage.placeholder":
    "Incluya enlaces a artículos publicados, galerías fotográficas o transmisiones de Juegos Olímpicos anteriores",
  "history.olympic.coverage.help": "Se recomiendan encarecidamente los enlaces a trabajos publicados",
  "history.paralympic.legend":
    "¿Ha recibido su organización acreditación paralímpica en el pasado?",
  "history.paralympic.yes": "Sí",
  "history.paralympic.no": "No",
  "history.noPrior.label":
    "¿Qué eventos deportivos cubre regularmente su organización?",
  "history.noPrior.placeholder":
    "Describa los eventos deportivos, ligas o competiciones que cubre su organización. Incluya cualquier evento internacional importante.",
  "history.additional.label": "Información adicional",
  "history.additional.placeholder":
    "Utilice este campo para cualquier información adicional solicitada por su CON, o cualquier otra cosa que desee comunicarnos.",
  "history.additional.help":
    "Utilice este campo para cualquier información adicional solicitada por su CON, o cualquier otra cosa que desee comunicarnos.",

  // ─── Status check page ───────────────────────────────────────────────────────
  "status.title": "Consultar Estado de la Solicitud",
  "status.subtitle":
    "Introduzca la dirección de correo electrónico que utilizó al solicitar para ver el estado de su solicitud.",
  "status.email.label": "Correo electrónico utilizado al solicitar",
  "status.submit": "Ver Mi Estado",
  "status.tokenNote":
    "El enlace de estado es válido durante 90 días. Puede solicitar uno nuevo en cualquier momento.",
  "status.error.invalid_email": "Por favor, introduzca una dirección de correo electrónico válida.",

  // ─── Status view page ────────────────────────────────────────────────────────
  "statusView.title": "Estado de la Solicitud",
  "statusView.loggedInAs": "Conectado como",
  "statusView.noApps.heading": "No se encontraron solicitudes",
  "statusView.noApps.body": "No hemos podido encontrar una solicitud para",
  "statusView.noApps.tryAgain":
    "Si solicitó con una dirección diferente, inténtelo de nuevo. De lo contrario, contacte directamente con su CON.",
  "statusView.noApps.tryAgainLink": "intentarlo de nuevo",

  "statusView.status.pending": "Solicitud En Revisión",
  "statusView.status.resubmitted": "Solicitud En Revisión",
  "statusView.status.approved": "Aceptada como Candidata",
  "statusView.status.returned": "Devuelta para Correcciones",
  "statusView.status.rejected": "Rechazada",

  "statusView.desc.pending": "Su solicitud ha sido recibida y está siendo revisada.",
  "statusView.desc.resubmitted": "Su solicitud corregida está siendo revisada.",
  "statusView.desc.approved":
    "Su CON ha aceptado su solicitud como candidata para acreditación de prensa. La asignación de plazas se produce en la siguiente fase (Prensa por Número) y no está garantizada — algunos candidatos aceptados pueden no recibir finalmente ninguna plaza. Se le notificará una vez que se finalice la asignación del CON.",
  "statusView.desc.returned":
    "Su CON ha solicitado correcciones. Por favor, revise la nota a continuación y vuelva a enviar.",
  "statusView.desc.rejected": "Su solicitud no ha sido aceptada.",

  "statusView.nocNote.heading": "Nota del CON:",
  "statusView.allocationInProgress.heading": "Asignación de plazas en curso",
  "statusView.allocationInProgress.body":
    "Sus números de acreditación están siendo finalizados. Se le contactará una vez que se confirme la asignación de plazas.",
  "statusView.allocatedSlots.heading": "Plazas asignadas",
  "statusView.editApplication": "Editar solicitud",
  "statusView.correctResubmit": "Corregir y Volver a Enviar",
  "statusView.viewSubmitted": "Ver solicitud enviada",

  // Status view sections
  "statusView.section.organisation": "Organización",
  "statusView.section.primaryContact": "Contacto Principal",
  "statusView.section.secondaryContact": "Contacto Secundario",
  "statusView.section.accreditation": "Acreditación",
  "statusView.section.publication": "Publicación",
  "statusView.section.history": "Historial",
  "statusView.row.name": "Nombre",
  "statusView.row.type": "Tipo",
  "statusView.row.country": "País",
  "statusView.row.noc": "CON",
  "statusView.row.website": "Sitio web",
  "statusView.row.address": "Dirección",
  "statusView.row.title": "Cargo",
  "statusView.row.email": "Correo electrónico",
  "statusView.row.phone": "Teléfono",
  "statusView.row.mobile": "Móvil",
  "statusView.row.categories": "Categorías",
  "statusView.row.about": "Descripción",
  "statusView.row.types": "Tipos",
  "statusView.row.circulation": "Tirada",
  "statusView.row.frequency": "Frecuencia",
  "statusView.row.sportsCovered": "Deportes cubiertos",
  "statusView.row.priorOlympic": "Olímpico previo",
  "statusView.row.olympicYears": "Años olímpicos",
  "statusView.row.priorParalympic": "Paralímpico previo",
  "statusView.row.paralympicYears": "Años paralímpicos",
  "statusView.row.pastCoverage": "Cobertura anterior",
  "statusView.row.comments": "Comentarios",
  "statusView.row.yes": "Sí",
  "statusView.row.no": "No",
  "statusView.row.requested": "solicitadas",
  "statusView.footer": "¿Preguntas sobre su solicitud? Contacte directamente con su CON.",

  // ─── Submitted page ──────────────────────────────────────────────────────────
  "submitted.title.new": "Solicitud Enviada",
  "submitted.title.resubmit": "Solicitud Reenviada",
  "submitted.subtitle.new":
    "Su solicitud ha sido recibida y está pendiente de revisión por su CON.",
  "submitted.subtitle.resubmit":
    "Sus correcciones han sido recibidas. Su CON revisará la solicitud actualizada.",
  "submitted.refLabel": "Número de referencia",
  "submitted.refHelp": "Guárdelo para sus registros.",
  "submitted.nextSteps": "¿Qué ocurre a continuación?",
  "submitted.step1": "Su CON revisa la solicitud",
  "submitted.step2": "Se le contactará si se necesitan correcciones",
  "submitted.step3": "Las solicitudes aprobadas se envían al COI",
  "submitted.viewStatus": "Ver estado de la solicitud →",
  "submitted.emailPreviewLabel": "Vista previa de notificación por correo electrónico",
  "submitted.emailPreviewNote":
    "Nota: La integración de correo electrónico no está actualmente activa. A continuación se muestra una vista previa del correo de confirmación que recibirán los solicitantes una vez habilitado.",
  "submitted.email.from": "De:",
  "submitted.email.to": "Para:",
  "submitted.email.subject": "Asunto:",
  "submitted.email.subjectValue":
    "Expresión de Interés recibida – Acreditación de Prensa LA 2028",
  "submitted.email.dear": "Estimado/a",
  "submitted.email.body1":
    "Gracias por completar su expresión de interés para la acreditación de prensa para cubrir los",
  "submitted.email.gamesBold": "Juegos Olímpicos LA28",
  "submitted.email.body2":
    "Tenga en cuenta que todas las comunicaciones posteriores serán de su CON seleccionado en el formulario y no del COI ni del Comité Organizador de los Juegos Olímpicos LA28.",
  "submitted.email.refNumber": "Número de referencia",
  "submitted.email.organisation": "Organización",
  "submitted.email.categoriesRequested": "Categorías solicitadas",
  "submitted.email.nextSteps": "¿Qué ocurre a continuación?",
  "submitted.email.step1": "Su CON revisará su solicitud para comprobar la elegibilidad.",
  "submitted.email.step2": "Se le notificará si se necesitan correcciones.",
  "submitted.email.step3":
    "Si es aceptado como candidato, las asignaciones de plazas se confirman en la fase de Prensa por Número.",
  "submitted.email.contact":
    "Si tiene preguntas sobre su solicitud, por favor contacte directamente con su CON. Puede consultar su estado en cualquier momento en",
  "submitted.email.statusUrl": "prp.la28.org/apply/status",
  "submitted.email.regards": "Atentamente,",
  "submitted.email.team": "Equipo de Registro de Prensa LA 2028",

  // ─── How It Works page ───────────────────────────────────────────────────────
  "hiw.backLink": "← Volver a la solicitud",
  "hiw.title": "Cómo Funciona el Proceso EoI",
  "hiw.subtitle":
    "Una guía rápida para organizaciones de prensa que solicitan acreditación de prensa para los Juegos Olímpicos LA 2028.",
  "hiw.reviewBanner.label": "Borrador:",
  "hiw.reviewBanner.body":
    "Esta página está sujeta a revisión del COI. Redacción final pendiente.",
  "hiw.steps.heading": "Los cuatro pasos",
  "hiw.step1.title": "Solicitar un enlace mágico",
  "hiw.step1.body":
    "Introduzca su dirección de correo electrónico en la página de solicitud. Le enviaremos un enlace seguro de un solo uso. No se necesita contraseña.",
  "hiw.step2.title": "Completar el formulario",
  "hiw.step2.body":
    "El formulario tarda unos 10 minutos. Su progreso se guarda automáticamente, por lo que puede cerrar la pestaña y volver más tarde utilizando el mismo enlace.",
  "hiw.step3.title": "Su CON revisa su solicitud",
  "hiw.step3.body":
    "El Comité Olímpico Nacional (CON) de su país revisa todas las solicitudes de su territorio. Pueden aceptar su organización como candidata para la acreditación, devolverla para correcciones o rechazarla. Ser aceptado en esta etapa significa que está en la lista — aún no significa que le hayan asignado plazas de acreditación.",
  "hiw.step4.title": "Prensa por Número (PbN)",
  "hiw.step4.body":
    "Para los candidatos aceptados, el CON entra en la fase de Prensa por Número — asignan plazas específicas de acreditación por categorías (E, EP, ET, etc.) de su cupo asignado por el COI. Los cupos son limitados, por lo que no todos los candidatos aceptados recibirán plazas. El COI revisa todas las asignaciones de los CON antes de la confirmación final.",
  "hiw.categories.heading": "Categorías de acreditación",
  "hiw.categories.col.code": "Código",
  "hiw.categories.col.description": "Descripción",
  "hiw.categories.E": "Prensa escrita / periodista (general)",
  "hiw.categories.Es": "Prensa escrita / periodista (deporte específico)",
  "hiw.categories.EP": "Fotógrafo (general)",
  "hiw.categories.EPs": "Fotógrafo (deporte específico)",
  "hiw.categories.ET": "Personal técnico (producción de radiodifusión e imprenta)",
  "hiw.categories.EC": "Personal de apoyo editorial",
  "hiw.categories.note":
    "Puede solicitar más de una categoría. Su CON puede ajustar su selección de categorías durante la revisión.",
  "hiw.faq.heading": "Preguntas frecuentes",
  "hiw.faq.q1": "No sé qué categoría solicitar.",
  "hiw.faq.a1":
    "Solicite la categoría que mejor corresponda a su función. Si trabaja en múltiples funciones (p. ej. periodista y fotógrafo), puede solicitar ambas. Su CON puede ajustar su selección.",
  "hiw.faq.q2": "¿Qué es mi CON?",
  "hiw.faq.a2":
    "Su Comité Olímpico Nacional (CON) es el organismo que representa a su país en el movimiento olímpico. Hay 206 CON en todo el mundo. En el formulario, introduzca su país y sugeriremos su CON automáticamente.",
  "hiw.faq.q3": "¿Puedo solicitar más de una categoría?",
  "hiw.faq.a3": "Sí. Seleccione todas las categorías que correspondan a su trabajo.",
  "hiw.faq.q4": "¿Puedo guardar mi formulario y volver más tarde?",
  "hiw.faq.a4":
    "Sí. Su progreso se guarda automáticamente en su navegador. Utilice el mismo enlace mágico para volver y continuar. El enlace es válido durante 24 horas — solicite uno nuevo si caduca.",
  "hiw.faq.q5": "¿Qué ocurre si mi CON devuelve mi solicitud?",
  "hiw.faq.a5":
    "Recibirá una notificación con los comentarios del CON. Utilice su enlace mágico para abrir el formulario de nuevo, realice las correcciones solicitadas y vuelva a enviar. Volverá a su CON para revisión.",
  "hiw.readyToApply": "Listo para solicitar →",

  // ─── Validation errors ───────────────────────────────────────────────────────
  "validation.required": "Este campo es obligatorio.",
  "validation.selectOption": "Por favor, seleccione una opción.",
  "validation.url": "Por favor, introduzca una URL válida (p. ej. https://www.ejemplo.com)",
  "validation.tabIncomplete": "Pestaña aún no completada",
  "validation.tabsIncomplete.one": "1 pestaña está incompleta.",
  "validation.tabsIncomplete.many": "{n} pestañas están incompletas.",
  "validation.fieldsIncomplete.one": "Falta 1 campo obligatorio.",
  "validation.fieldsIncomplete.many": "Faltan {n} campos obligatorios.",
} as const;
