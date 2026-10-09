/** Constantes éditeur, routes SEO et crédit sites livrés (hors sitereadyshd.fr). */
export const SITE_URL = "https://sitereadyshd.fr";

/** Bandeau « version provisoire » sur les CGV — passer à false après relecture juridique. */
export const CGV_PROVISIONAL_BANNER = true;

export const PUBLISHER = {
  brand: "SiteReady",
  legalForm: "Micro-entrepreneur",
  siret: "999954902",
  locality: "Satillieu",
  postalCode: "07290",
  email: "contact@sitereadyshd.fr",
  tvaNotice: "TVA non applicable, art. 293 B du CGI",
};

export const HOST = {
  name: "OVH SAS",
  street: "2 rue Kellermann",
  city: "59100 Roubaix",
  country: "France",
};

/** Crédit discret pour les sites livrés aux clients — ne pas activer sur ce site. */
export const DELIVERABLE_SITE_CREDIT = {
  enabled: false,
  label: "Site réalisé par SiteReady",
  href: SITE_URL,
};

export const DESIGN_PATHS = ["/", "/elegant/", "/minimal/", "/anime/"];

export const LEGAL_HTML_PAGES = [
  "/mentions-legales.html",
  "/politique-confidentialite.html",
  "/conditions-de-vente.html",
];

export const LOCAL_CITY_SLUGS = [
  "site-internet-aubenas",
  "site-internet-annonay",
  "site-internet-privas",
  "site-internet-ruoms",
  "site-internet-vals-les-bains",
  "site-internet-tournon-sur-rhone",
  "site-internet-le-teil",
  "site-internet-largentiere",
];

export const LOCAL_TRADE_SLUGS = [
  "site-internet-plombier-ardeche",
  "site-internet-electricien-ardeche",
  "site-internet-boulanger-ardeche",
  "site-internet-coiffeur-ardeche",
  "site-internet-restaurant-ardeche",
  "site-internet-artisan-ardeche",
  "site-internet-gite-ardeche",
];

export function allSitemapPaths() {
  return [
    ...DESIGN_PATHS,
    ...LEGAL_HTML_PAGES,
    ...LOCAL_CITY_SLUGS.map((s) => `/${s}`),
    ...LOCAL_TRADE_SLUGS.map((s) => `/${s}`),
  ];
}
