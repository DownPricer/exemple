import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadOffers } from "./load-offers.mjs";
import { loadContent } from "./load-content.mjs";
import { injectSeoHead } from "./seo-head.mjs";
import { injectCloudflareAnalytics } from "./cloudflare-analytics.mjs";
import { FAVICON_PATH, injectFaviconHead } from "./favicon-head.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "refonte-chatgpt", "SiteReady-refonte", "index.html");
const outDir = path.join(root, "public", "elegant");
const outPath = path.join(outDir, "index.html");

const SELECTOR_STYLE = `
<style id="style-selector-css">
#style-selector.theme-switch-refonte{padding:110px 0;background:#f6f5ef;border-top:1px solid #dcded3;border-bottom:1px solid #dcded3}
#style-selector .theme-switch-refonte__inner{max-width:720px;margin:0 auto;text-align:center;padding:0 24px}
#style-selector h2{font-weight:500;font-size:clamp(28px,5vw,40px);letter-spacing:-2px;line-height:1.12;margin:0 0 14px;color:#173d2e}
#style-selector p{color:#656f66;margin:0 0 22px;font-size:15px;line-height:1.7}
#style-selector .theme-switch-refonte__controls{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}
#style-selector .theme-switch-refonte__btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #173d2e;background:#fff;color:#173d2e;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;cursor:pointer;font-family:inherit}
#style-selector .theme-switch-refonte__btn.is-active{background:#173d2e;color:#f6f5ef}
#style-selector .theme-switch-refonte__btn:focus-visible{outline:3px solid #9679c4;outline-offset:4px}
</style>`;

const SELECTOR_HTML = `
<section id="style-selector" class="theme-switch-refonte" aria-labelledby="theme-switch-title">
  <div class="theme-switch-refonte__inner">
    <h2 id="theme-switch-title">Le site qui vous correspond</h2>
    <p>Choisissez un style : quatre présentations différentes du même service.</p>
    <div class="theme-switch-refonte__controls" role="group" aria-label="Choisir un style de page">
      <a class="theme-switch-refonte__btn" href="/#style-selector" data-go-dynamique data-theme-active="dynamique">Dynamique</a>
      <span class="theme-switch-refonte__btn is-active" data-theme-active="elegant" aria-current="true">Élégant</span>
      <a class="theme-switch-refonte__btn" href="/minimal/#style-selector" data-theme-active="minimal">Minimal</a>
      <a class="theme-switch-refonte__btn" href="/anime/#style-selector" data-theme-active="anime">Animé</a>
    </div>
  </div>
</section>`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyOffers(html, offers) {
  let out = html;
  if (!offers) return out;

  if (offers.onceHostingAddon) {
    out = out.replace(
      /(<p class="plan-hosting-addon"[^>]*>)([^<]*)(<\/p>)/,
      `$1${escapeHtml(offers.onceHostingAddon)}$3`
    );
  }
  if (offers.monthlyHostingIncluded) {
    out = out.replace(
      /(<p class="plan-hosting-included"[^>]*>)([^<]*)(<\/p>)/,
      `$1${escapeHtml(offers.monthlyHostingIncluded)}$3`
    );
  }
  if (offers.onceHostingBullet) {
    out = out.replace(
      /(<li data-offers-once-bullet><svg class="icon"[^>]*><\/svg>\s*)([^<]*)(<\/li>)/,
      `$1${escapeHtml(offers.onceHostingBullet)}$3`
    );
  }
  if (offers.planOnceFormLabel) {
    out = out.replace(
      /(<option value="once">)([^<]*)(<\/option>)/,
      `$1${escapeHtml(offers.planOnceFormLabel)}$3`
    );
  }
  if (offers.faqHosting?.q && offers.faqHosting?.a) {
    const q = escapeHtml(offers.faqHosting.q);
    const a = escapeHtml(offers.faqHosting.a);
    out = out.replace(
      /(<details class="faq-item" data-offers-faq-hosting><summary>)([^<]*)( <svg class="icon"[^>]*><\/svg><\/summary><p>)([^<]*)(<\/p><\/details>)/,
      `$1${q}$3${a}$5`
    );
  }
  if (offers.faqDomain?.q && offers.faqDomain?.a) {
    const q = escapeHtml(offers.faqDomain.q);
    const a = escapeHtml(offers.faqDomain.a);
    out = out.replace(
      /(<details class="faq-item" data-offers-faq-domain><summary>)([^<]*)( <svg class="icon"[^>]*><\/svg><\/summary><p>)([^<]*)(<\/p><\/details>)/,
      `$1${q}$3${a}$5`
    );
  }
  if (offers.customDomainRibbon) {
    out = out.replace(
      /(<span class="ribbon-item" data-offers-ribbon-domain><svg class="icon"[^>]*><\/svg>\s*)([^<]*)(<\/span>)/,
      `$1${escapeHtml(offers.customDomainRibbon)}$3`
    );
  }
  if (offers.customDomainIncluded) {
    out = out.replace(
      /(<li data-offers-included-domain><svg class="icon"[^>]*><\/svg>\s*)([^<]*)(<\/li>)/,
      `$1${escapeHtml(offers.customDomainIncluded)}$3`
    );
  }
  if (offers.customDomainPricingBullet) {
    const bullet = escapeHtml(offers.customDomainPricingBullet);
    out = out.replace(
      /(<li data-offers-domain-bullet-once><svg class="icon"[^>]*><\/svg>\s*)([^<]*)(<\/li>)/,
      `$1${bullet}$3`
    );
    out = out.replace(
      /(<li data-offers-domain-bullet-monthly><svg class="icon"[^>]*><\/svg>\s*)([^<]*)(<\/li>)/,
      `$1${bullet}$3`
    );
  }
  if (offers.monthlyPlanDescription) {
    out = out.replace(
      /(<p class="plan-description" data-offers-monthly-description>)([^<]*)(<\/p>)/,
      `$1${escapeHtml(offers.monthlyPlanDescription)}$3`
    );
  }
  if (offers.monthlyUpdatesBullet) {
    out = out.replace(
      /(<li data-offers-monthly-updates-bullet><svg class="icon"[^>]*><\/svg>\s*)([^<]*)(<\/li>)/,
      `$1${escapeHtml(offers.monthlyUpdatesBullet)}$3`
    );
  }
  return out;
}

function applySeo(html, content) {
  const { seo, site } = content;
  return injectSeoHead(html, seo, site, `${site.url}/elegant/`, { canonicalUrl: `${site.url}/` });
}

function patch(html, offers, content) {
  let out = html;

  if (!out.includes('rel="canonical"')) {
    out = out.replace(
      /<head>/i,
      '<head>\n  <link rel="canonical" href="https://sitereadyshd.fr/">'
    );
  }

  if (!out.includes("style-selector-css")) {
    out = out.replace("</head>", `${SELECTOR_STYLE}\n</head>`);
  }

  if (!out.includes('id="style-selector"')) {
    const tarifsMatch = out.match(/<section[^>]*\sid=["']tarifs["'][^>]*>/i);
    if (!tarifsMatch) {
      throw new Error("Section #tarifs introuvable dans la refonte.");
    }
    out = out.replace(tarifsMatch[0], `${SELECTOR_HTML}\n    ${tarifsMatch[0]}`);
  }

  out = out.replace(/\.\/mentions-legales\.html/gi, "/mentions-legales.html");
  out = out.replace(/\.\/politique-confidentialite\.html/gi, "/politique-confidentialite.html");
  out = out.replace(/href=["']mentions-legales\.html["']/gi, 'href="/mentions-legales.html"');
  out = out.replace(
    /href=["']politique-confidentialite\.html["']/gi,
    'href="/politique-confidentialite.html"'
  );
  out = out.replace(
    /<a href="\/mentions-legales\.html">Mentions légales<\/a><a href="\/politique-confidentialite\.html">/,
    '<a href="/mentions-legales.html">Mentions légales</a><a href="/conditions-de-vente.html">Conditions de vente</a><a href="/politique-confidentialite.html">'
  );
  out = out.replace(
    /<p class="price">500 €<\/p>\s*<p class="price-sub">à partir de<\/p>/g,
    '<p class="price">à partir de 500 €</p><p class="price-sub">&nbsp;</p>'
  );
  out = out.replace(/href=["']Confidentialité["']/gi, 'href="/politique-confidentialite.html"');

  out = out.replace(
    /<div class="field"><label for="phone">[\s\S]*?<p class="field-error" id="error-phone"[\s\S]*?<\/div>\s*/i,
    ""
  );
  out = out.replace(/(<input id="email"[^>]*)(>)/i, '$1 required aria-required="true"$2');
  out = out.replace(
    /(<label class="checkbox-label"[^>]*>[\s\S]*?<span>)(J’accepte[\s\S]*?politique de confidentialité)(<\/a>\.<\/span>)/i,
    (_, a, mid, end) =>
      `${a}${mid}</a> et aux <a href="/conditions-de-vente.html">conditions de vente</a>${end}`
  );

  const hiddenStyle = '<input type="hidden" name="preferredStyle" id="preferredStyle" value="Élégant">';
  if (!out.includes('name="preferredStyle"')) {
    out = out.replace(
      /<form[^>]*id=["']contact-form["'][^>]*>/i,
      (match) => `${match}\n          ${hiddenStyle}`
    );
  }

  if (!out.includes("elegant-bridge.js")) {
    out = out.replace(
      /<\/body>/i,
      '  <script src="/elegant/elegant-bridge.js"></script>\n</body>'
    );
  }

  out = applyOffers(out, offers);
  out = injectFaviconHead(out);
  const brandImg = `<img class="brand-mark" src="${FAVICON_PATH}" alt="" width="28" height="28" decoding="async" style="border-radius:8px;object-fit:cover">`;
  out = out.replace(
    /<svg class="brand-mark"[\s\S]*?<\/svg>/gi,
    brandImg
  );
  if (content) out = applySeo(out, content);
  out = injectCloudflareAnalytics(out);
  return out;
}

if (!fs.existsSync(sourcePath)) {
  console.error(
    `Source introuvable : ${sourcePath}\nPlacez index.html dans refonte-chatgpt/SiteReady-refonte/ puis relancez npm run build:elegant`
  );
  process.exit(1);
}

const offers = loadOffers(root);
const content = loadContent(root);
const source = fs.readFileSync(sourcePath, "utf8");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, patch(source, offers, content), "utf8");

const avisSource = path.join(root, "refonte-chatgpt", "SiteReady-refonte", "avis.json");
if (fs.existsSync(avisSource)) {
  fs.copyFileSync(avisSource, path.join(outDir, "avis.json"));
}

console.log(`Page Élégant générée : ${outPath}`);
