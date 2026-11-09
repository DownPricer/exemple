/**
 * Valeurs éditables pour la page /vtc. Laissez une chaîne vide ou null pour masquer
 * l’élément concerné en production (avertissement console en build hors NODE_ENV=production).
 */

/** @typedef {string | null | undefined} TbcString */

export const LANDING_CONFIG = {
  demoUrl: "https://vtc.sitereadyshd.fr",

  seo: {
    title: "SiteReady SHD",
    description:
      "Un site de réservation pour chauffeurs VTC : prix instantané, planning, notifications sur téléphone. Sur votre nom, avec vos tarifs.",
    canonicalPath: "/vtc/",
    ogImage: "https://sitereadyshd.fr/assets/img/og-image.png",
    ogLocale: "fr_FR",
  },

  /** Abonnement mensuel (€). Utilisé pour l’affichage tarif et le calcul de rentabilité. */
  subscriptionPriceEur: 200,

  /** true = afficher le paiement Stripe comme actif (tarifs + encart fonctionnalité). */
  stripePaymentActive: false,

  /** Mise en route (ex. « incluse », « 490 € »). Vide = ligne masquée. */
  setup: "",

  /** Engagement (ex. « sans engagement », « 12 mois »). Vide = partie masquée. */
  commitment: "",

  /** Réponse FAQ engagement. Vide = question masquée. */
  commitmentFaq: "",

  /** Libellé prix refonte (ex. « sur devis »). Vide = bloc prix masqué. */
  refactorPriceLabel: "",

  /** @type {TbcString} */
  email: "",

  publisher: {
    /** @type {TbcString} */
    name: "",
    /** @type {TbcString} */
    legalStatus: "",
    /** @type {TbcString} */
    siret: "",
  },

  legal: {
    /** Texte d’hébergeur (pages légales VTC). Compléter si différent du site principal. */
    hostName: "OVH SAS",
    hostStreet: "2 rue Kellermann",
    hostCity: "59100 Roubaix",
    hostCountry: "France",
  },
};
