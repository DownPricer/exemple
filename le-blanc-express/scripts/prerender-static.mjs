import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./load-content.mjs";
import { loadOffers } from "./load-offers.mjs";
import { injectSeoHead } from "./seo-head.mjs";
import { injectFaviconHead } from "./favicon-head.mjs";
import { injectCloudflareAnalytics } from "./cloudflare-analytics.mjs";
import { replaceInnerById } from "./replace-inner.mjs";
import { LEGAL_PAGES } from "./legal-static.mjs";
import { wrapStaticPage } from "./build-page-shell.mjs";
import { LOCAL_PAGES } from "./local-pages-data.mjs";
import { LOCAL_CITY_SLUGS, LOCAL_TRADE_SLUGS, SITE_URL } from "./site-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cardHostingLine(card, O) {
  if (card.hostingLine) return card.hostingLine;
  if (card.id === "once") return O.onceHostingAddon || "";
  if (card.id === "monthly") return O.monthlyHostingIncluded || "";
  return "";
}

function buildFaqItems(C, O) {
  const items = [...C.faq.items];
  if (O.faqHosting?.q) items.splice(3, 0, O.faqHosting);
  if (O.faqDomain?.q) items.push(O.faqDomain);
  return items;
}

function buildPricingHtml(C, O) {
  return C.pricing.cards
    .map((card) => {
      const bullets = [...(card.bullets || [])];
      if (
        (card.id === "once" || card.id === "monthly") &&
        O.customDomainPricingBullet &&
        !bullets.includes(O.customDomainPricingBullet)
      ) {
        bullets.push(O.customDomainPricingBullet);
      }
      if (card.id === "once" && O.onceHostingBullet && !bullets.includes(O.onceHostingBullet)) {
        bullets.push(O.onceHostingBullet);
      }
      const hosting = cardHostingLine(card, O);
      return `
        <article class="price-card reveal${card.id === "monthly" ? " price-card--highlight" : ""}">
          <h3>${escapeHtml(card.name)}</h3>
          ${card.priceNote ? `<p class="price-card__note">${escapeHtml(card.priceNote)}</p>` : ""}
          <p class="price-card__price">${escapeHtml(card.price)}</p>
          ${hosting ? `<p class="price-card__hosting">${escapeHtml(hosting)}</p>` : ""}
          <ul class="price-card__bullets">
            ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>
          ${card.legal ? `<p class="price-card__legal">${escapeHtml(card.legal)}</p>` : ""}
          <button type="button" class="btn btn--pill btn--night price-card__cta" data-plan="${escapeHtml(card.id)}">Commencer →</button>
        </article>`;
    })
    .join("");
}

function buildSchema(C, O) {
  const { seo, site, faq } = C;
  const cities = seo.schemaCities || [];
  const areaServed = [
    { "@type": "AdministrativeArea", name: seo.areaServed },
    ...cities.map((name) => ({ "@type": "City", name })),
  ];
  const service = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: seo.serviceName,
    description: seo.serviceDescription,
    url: site.url,
    email: seo.email,
    areaServed,
    priceRange: seo.priceRange || "€€",
  };
  const faqItems = buildFaqItems(C, O);
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return JSON.stringify([service, faqPage]);
}

function replaceEmptyDataEl(html, attr, inner) {
  const re = new RegExp(`(<[^>]+${attr}[^>]*>)\\s*(</[^>]+>)`, "i");
  return html.replace(re, `$1${inner}$2`);
}

function replaceDataText(html, attr, inner) {
  const re = new RegExp(`(<[^>]+${attr}[^>]*>)([^<]*)(</)`, "i");
  return html.replace(re, `$1${inner}$3`);
}

function rebuildFaqSection(html, C, O) {
  const faqHtml = buildFaqItems(C, O)
    .map(
      (item, i) => `
      <div class="faq-item reveal">
        <h3>
          <button type="button" class="faq-item__trigger" aria-expanded="false" aria-controls="faq-panel-${i}" id="faq-trigger-${i}">
            <span class="faq-item__label">${escapeHtml(item.q)}</span>
            <span class="faq-item__icon" aria-hidden="true"></span>
          </button>
        </h3>
        <div id="faq-panel-${i}" class="faq-item__panel" role="region" aria-labelledby="faq-trigger-${i}" hidden>
          <p>${escapeHtml(item.a)}</p>
        </div>
      </div>`
    )
    .join("");

  const section = `<section id="faq" class="section section--cream section--watermark">
      <div class="container container--narrow">
        <h2 class="section-title reveal" data-faq-title>${escapeHtml(C.faq.title)}</h2>
        <div id="faq-list" class="faq">${faqHtml}
        </div>
      </div>
    </section>`;

  return html.replace(/<section id="faq"[\s\S]*?<\/section>\s*(?=<section id="contact")/i, `${section}\n\n    `);
}

function injectNoScriptFallback(html) {
  const block =
    '<noscript><style>.faq-item__panel[hidden]{display:block!important;margin-top:.75rem}.reveal{opacity:1!important;transform:none!important}</style></noscript>';
  if (html.includes("<noscript><style>.faq-item__panel")) return html;
  return html.replace("</head>", `${block}\n</head>`);
}

function injectContactFormCopy(html, C, O) {
  const f = C.contact.form;
  let out = html;
  out = replaceDataText(out, "data-label-has-website", escapeHtml(f.hasWebsite));
  out = replaceDataText(out, "data-has-website-no", escapeHtml(f.hasWebsiteNo));
  out = replaceDataText(out, "data-has-website-yes", escapeHtml(f.hasWebsiteYes));
  out = replaceDataText(out, "data-label-plan", escapeHtml(f.plan));
  out = replaceDataText(out, "data-submit-label", escapeHtml(f.submit));
  out = replaceDataText(out, "data-nav-cta", escapeHtml(C.nav.cta));
  out = replaceDataText(out, "data-hero-badge", escapeHtml(C.hero.badge));

  for (const opt of f.planOptions) {
    const label =
      opt.value === "once" && O.planOnceFormLabel ? O.planOnceFormLabel : opt.label;
    out = out.replace(
      new RegExp(
        `(<button type="button" class="pill-choice[^"]*" data-pill-group="plan" data-value="${opt.value}"[^>]*>)\\s*(</button>)`,
        "i"
      ),
      `$1${escapeHtml(label)}$2`
    );
  }
  return out;
}

function injectHeroFallback(html, C) {
  const m = C.hero.phoneMock;
  const inner = `
        <div class="hero__static-mock" aria-hidden="true">
          <p class="hero__static-mock-brand">${escapeHtml(m.brand)}</p>
          <p class="hero__static-mock-city">${escapeHtml(m.city)}</p>
          <p class="hero__static-mock-cta">${escapeHtml(m.cta)}</p>
        </div>`;
  return replaceInnerById(html, "hero-phone", inner);
}

function ensureOffersScript(html) {
  if (html.includes("offers-shared.js")) return html;
  return html.replace(
    '<script src="/assets/js/content.js"></script>',
    '<script src="/assets/js/offers-shared.js"></script>\n  <script src="/assets/js/content.js"></script>'
  );
}

function prerenderDynamiqueIndex(C, O) {
  const indexPath = path.join(publicDir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  html = injectFaviconHead(html);
  html = injectSeoHead(html, C.seo, C.site, `${C.site.url}/`);
  html = injectNoScriptFallback(html);

  html = replaceEmptyDataEl(html, "data-hero-title", escapeHtml(C.hero.title));
  html = replaceEmptyDataEl(html, "data-hero-subtitle", escapeHtml(C.hero.subtitle));
  html = replaceEmptyDataEl(html, "data-hero-cta", escapeHtml(C.hero.cta));
  html = replaceEmptyDataEl(html, "data-problem-title", escapeHtml(C.problem.title));
  html = replaceEmptyDataEl(html, "data-problem-missing", escapeHtml(C.problem.missing));
  html = replaceEmptyDataEl(html, "data-steps-title", escapeHtml(C.steps.title));
  html = replaceEmptyDataEl(html, "data-steps-intro", escapeHtml(C.steps.intro));
  html = replaceEmptyDataEl(html, "data-pricing-title", escapeHtml(C.pricing.title));
  html = replaceEmptyDataEl(html, "data-pricing-subtitle", escapeHtml(C.pricing.subtitle));
  html = replaceEmptyDataEl(html, "data-included-title", escapeHtml(C.included.title));
  html = replaceEmptyDataEl(html, "data-examples-title", escapeHtml(C.examples.title));
  html = replaceEmptyDataEl(html, "data-examples-subtitle", escapeHtml(C.examples.subtitle));
  html = replaceEmptyDataEl(html, "data-faq-title", escapeHtml(C.faq.title));
  html = replaceEmptyDataEl(html, "data-contact-title", escapeHtml(C.contact.title));
  html = replaceEmptyDataEl(html, "data-contact-intro", escapeHtml(C.contact.intro));
  html = replaceEmptyDataEl(html, "data-contact-email-link", escapeHtml(C.contact.email));
  html = replaceEmptyDataEl(html, "data-footer-tagline", escapeHtml(C.site.taglineFooter));
  html = replaceEmptyDataEl(html, "data-theme-switch-title", escapeHtml(C.themeSwitch.title));
  html = replaceEmptyDataEl(html, "data-theme-switch-subtitle", escapeHtml(C.themeSwitch.subtitle));

  html = html.replace(
    /(<button[^>]*data-theme-switch-dynamique[^>]*>)\s*(<\/button>)/i,
    `$1${escapeHtml(C.themeSwitch.dynamique)}$2`
  );
  html = html.replace(
    /(<a[^>]*data-theme-switch-elegant[^>]*>)\s*(<\/a>)/i,
    `$1${escapeHtml(C.themeSwitch.elegant)}$2`
  );
  html = html.replace(
    /(<a[^>]*data-theme-switch-minimal[^>]*>)\s*(<\/a>)/i,
    `$1${escapeHtml(C.themeSwitch.minimal)}$2`
  );
  html = html.replace(
    /(<a[^>]*data-theme-switch-anime[^>]*>)\s*(<\/a>)/i,
    `$1${escapeHtml(C.themeSwitch.anime)}$2`
  );

  const navHtml = C.nav.links
    .map((link) => `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`)
    .join("");
  html = replaceInnerById(html, "nav-links", navHtml);

  const stepsHtml = C.steps.items
    .map(
      (step, index) => `
        <li class="step-card reveal">
          <span class="step-card__num">${index + 1}</span>
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.text)}</p>
        </li>`
    )
    .join("");
  html = replaceInnerById(html, "steps-list", stepsHtml);
  html = replaceInnerById(html, "pricing-grid", buildPricingHtml(C, O));

  const includedItems = C.included.items.map((text) =>
    O.customDomainIncluded && text.includes("Nom de domaine") ? O.customDomainIncluded : text
  );
  const includedHtml = includedItems
    .map(
      (item) => `
        <li class="included-item reveal">
          <span class="included-item__check" aria-hidden="true"></span>
          <span>${escapeHtml(item)}</span>
        </li>`
    )
    .join("");
  html = replaceInnerById(html, "included-list", includedHtml);

  const examplesHtml = C.examples.items
    .map(
      (item) => `
        <figure class="example-card reveal">
          <span class="example-card__fictif">Exemple fictif</span>
          <span class="example-card__label">${escapeHtml(item.label)}</span>
          <figcaption class="example-card__trade">${escapeHtml(item.trade)}</figcaption>
          <p class="example-card__mock-title">${escapeHtml(item.mockTitle)}</p>
        </figure>`
    )
    .join("");
  html = replaceInnerById(html, "examples-grid", examplesHtml);

  html = rebuildFaqSection(html, C, O);

  const resultsHtml = C.problem.results
    .map(
      (r) => `
        <li class="search-result">
          <span class="search-result__name">${escapeHtml(r.name)}</span>
          <span class="search-result__tag">${escapeHtml(r.tag)}</span>
        </li>`
    )
    .join("");
  html = replaceInnerById(html, "search-results", resultsHtml);
  html = html.replace(
    /<span id="fake-search-text" class="search-demo__query">[\s\S]*?<\/span>/i,
    `<span id="fake-search-text" class="search-demo__query">${escapeHtml(C.problem.searchQuery)}</span>`
  );

  html = injectHeroFallback(html, C);
  html = injectContactFormCopy(html, C, O);
  html = ensureOffersScript(html);

  html = injectFooterZones(html);

  const schema = buildSchema(C, O);
  html = html.replace(
    /<script type="application\/ld\+json" id="json-ld">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json" id="json-ld">${schema}</script>`
  );

  html = injectCloudflareAnalytics(html);
  fs.writeFileSync(indexPath, html, "utf8");
  console.log(`Prérendu : ${indexPath}`);
}

function labelForSlug(slug) {
  const page = LOCAL_PAGES.find((p) => p.slug === slug);
  if (page?.placeLabel) return page.placeLabel;
  return slug.replace("site-internet-", "").replace(/-ardeche$/, "").replace(/-/g, " ");
}

function buildFooterZonesHtml() {
  const cityLinks = LOCAL_CITY_SLUGS.map((slug) => {
    return `<li><a href="/${slug}">${escapeHtml(labelForSlug(slug))}</a></li>`;
  }).join("\n            ");
  const tradeLinks = LOCAL_TRADE_SLUGS.map((slug) => {
    return `<li><a href="/${slug}">${escapeHtml(labelForSlug(slug))}</a></li>`;
  }).join("\n            ");
  return `
      <section id="footer-zones" class="footer-zones" aria-labelledby="footer-zones-title">
        <div class="container">
        <h2 id="footer-zones-title" class="footer-zones__title">Zones et métiers</h2>
        <div class="footer-zones__grid">
          <div>
            <h3 class="footer-zones__subtitle">Villes</h3>
            <ul class="footer-zones__list">${cityLinks}
            </ul>
          </div>
          <div>
            <h3 class="footer-zones__subtitle">Métiers</h3>
            <ul class="footer-zones__list">${tradeLinks}
            </ul>
          </div>
        </div>
        </div>
      </section>`;
}

function injectFooterZones(html) {
  if (html.includes('id="footer-zones"')) {
    return html.replace(
      /<section[^>]*id="footer-zones"[^>]*>[\s\S]*?<\/section>/i,
      buildFooterZonesHtml().trim()
    );
  }
  return html.replace(
    /<footer class="site-footer">/i,
    `${buildFooterZonesHtml()}\n  <footer class="site-footer">`
  );
}

function prerenderLegalPages(C) {
  for (const [filename, meta] of Object.entries(LEGAL_PAGES)) {
    const filePath = path.join(publicDir, filename);
    const pageUrl = `${SITE_URL}/${filename}`;
    const html = wrapStaticPage({
      title: meta.title,
      description: meta.description,
      canonicalUrl: pageUrl,
      bodyHtml: meta.body(),
      ogImage: C.seo.ogImage,
    });
    fs.writeFileSync(filePath, html, "utf8");
    console.log(`Prérendu : ${filePath}`);
  }
}

function prerender404Page(C) {
  const filePath = path.join(publicDir, "404.html");
  const html = wrapStaticPage({
    title: "Page introuvable | SiteReady",
    description: "La page demandée n’existe pas sur le site SiteReady.",
    canonicalUrl: `${SITE_URL}/404.html`,
    bodyHtml: `
      <h1>Page introuvable</h1>
      <p>Cette adresse n’existe pas ou n’est plus disponible.</p>
      <p><a href="/">Retour à l’accueil SiteReady</a></p>`,
    ogImage: C.seo.ogImage,
  });
  fs.writeFileSync(filePath, html, "utf8");
  console.log(`Prérendu : ${filePath}`);
}

const C = loadContent(root);
const O = loadOffers(root);
prerenderDynamiqueIndex(C, O);
prerenderLegalPages(C);
prerender404Page(C);
