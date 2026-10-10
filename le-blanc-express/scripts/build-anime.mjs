import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./load-content.mjs";
import { loadOffers } from "./load-offers.mjs";
import { injectSeoHead } from "./seo-head.mjs";
import { injectCloudflareAnalytics } from "./cloudflare-analytics.mjs";
import { injectFaviconHead } from "./favicon-head.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "design-anime", "index.html");
const outDir = path.join(root, "public", "anime");
const outPath = path.join(outDir, "index.html");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function patchFormCopy(html, C, O) {
  let out = html;
  const f = C.contact.form;
  out = out.replace(
    /<legend data-label-has-website>[^<]*<\/legend>/,
    `<legend data-label-has-website>${escapeHtml(f.hasWebsite)}</legend>`
  );
  out = out.replace(
    /<legend data-label-plan>[^<]*<\/legend>/,
    `<legend data-label-plan>${escapeHtml(f.plan)}</legend>`
  );
  out = out.replace(
    /<span data-has-website-no>[^<]*<\/span>/,
    `<span data-has-website-no>${escapeHtml(f.hasWebsiteNo)}</span>`
  );
  out = out.replace(
    /<span data-has-website-yes>[^<]*<\/span>/,
    `<span data-has-website-yes>${escapeHtml(f.hasWebsiteYes)}</span>`
  );
  const consentHtml = `${escapeHtml(f.consentBefore)}<a href="/politique-confidentialite.html">${escapeHtml(f.consentLink)}</a>${escapeHtml(f.consentAndTerms || " et aux ")}<a href="/conditions-de-vente.html">${escapeHtml(f.consentTermsLink || "conditions de vente")}</a>.`;
  out = out.replace(/<span data-label-consent>[\s\S]*?<\/span>/, `<span data-label-consent>${consentHtml}</span>`);
  out = out.replace(
    /<span class="btn__label">[^<]*<\/span>/,
    `<span class="btn__label">${escapeHtml(f.submit)}</span>`
  );
  if (O.planOnceFormLabel) {
    out = out.replace(
      /(<label class="pill-choice" for="plan-once">)[^<]*(<\/label>)/,
      `$1${escapeHtml(O.planOnceFormLabel)}$2`
    );
  }
  const labelMap = {
    name: f.name,
    company: f.company,
    activity: f.activity,
    city: f.city,
    phone: f.phone,
    email: f.email,
    websiteUrl: f.websiteUrl,
    message: f.message,
  };
  for (const [id, text] of Object.entries(labelMap)) {
    out = out.replace(
      new RegExp(`(<label for="${id}">)[^<]*(<\\/label>)`),
      `$1${escapeHtml(text)}$2`
    );
  }
  return out;
}

function injectNoScriptAnime(html) {
  const block =
    '<noscript><style>.faq-item__panel[hidden]{display:block!important;margin-top:.75rem}.reveal{opacity:1!important;transform:none!important}</style></noscript>';
  if (html.includes("faq-item__panel[hidden]")) return html;
  return html.replace("</head>", `${block}\n</head>`);
}

function patchStyleSelector(html, C) {
  const t = C.themeSwitch;
  const controls = `
        <div class="theme-switch__controls reveal" role="group" aria-label="Choisir un style de page">
          <a class="theme-switch__btn" href="/#style-selector" data-go-dynamique data-theme-active="dynamique" data-theme-switch-dynamique>${escapeHtml(t.dynamique)}</a>
          <a class="theme-switch__btn" href="/elegant/#style-selector" data-go-elegant data-theme-active="elegant" data-theme-switch-elegant>${escapeHtml(t.elegant)}</a>
          <a class="theme-switch__btn" href="/minimal/#style-selector" data-go-minimal data-theme-active="minimal" data-theme-switch-minimal>${escapeHtml(t.minimal)}</a>
          <button type="button" class="theme-switch__btn is-active" data-theme-active="anime" aria-pressed="true" data-theme-switch-anime>${escapeHtml(t.anime)}</button>
        </div>`;
  let out = html.replace(
    /<p class="section-lead[^"]*" data-theme-switch-subtitle>[^<]*<\/p>/,
    `<p class="section-lead reveal" data-theme-switch-subtitle>${escapeHtml(t.subtitle)}</p>`
  );
  out = out.replace(
    /<div class="theme-switch__controls[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<section id="tarifs"/,
    `${controls}
      </div>
    </section>

    <section id="tarifs"`
  );
  return out;
}

function patchLayout(html) {
  let out = html;
  out = out.replace(
    /<div class="field">\s*<label for="phone">[\s\S]*?<p class="field-error" id="err-phone"[\s\S]*?<\/div>\s*/i,
    ""
  );
  out = out.replace(/(<input id="email"[^>]*)(>)/i, '$1 required aria-required="true"$2');
  out = out.replace(/Par message ou par téléphone\./g, "Par message.");
  out = out.replace(
    /<p class="price-card__price"><span class="count" data-count="500">500<\/span> €<\/p>/,
    '<p class="price-card__price">à partir de 500 €</p>'
  );
  out = out.replace(/<p class="price-card__note">à partir de<\/p>\s*/i, "");
  out = out.replace(
    /<span class="example-card__label">Exemple de maquette<\/span>/g,
    '<span class="example-card__fictif">Exemple fictif</span><span class="example-card__label">Exemple de maquette</span>'
  );
  return out;
}

function patch(html, content, offers) {
  let out = patchLayout(html);
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/\smethod="post"\saction="\/api\/contact"/i, "");
  out = out.replace(
    /<link rel="canonical" href="[^"]*">/i,
    '<link rel="canonical" href="https://sitereadyshd.fr/">'
  );
  out = patchStyleSelector(out, content);
  out = patchFormCopy(out, content, offers);
  out = injectFaviconHead(out);
  out = injectSeoHead(out, content.seo, content.site, `${content.site.url}/anime/`, {
    canonicalUrl: `${content.site.url}/`,
  });
  out = out.replace(
    /<a href="\/politique-confidentialite\.html">Politique de confidentialité<\/a>/,
    '<a href="/conditions-de-vente.html">Conditions de vente</a>\n        <a href="/politique-confidentialite.html">Politique de confidentialité</a>'
  );
  out = injectNoScriptAnime(out);
  out = out.replace(
    /\n    form\.addEventListener\('submit', function \(e\) \{[\s\S]*?\n    \}\);\n\n    \/\* =+ ANIMATIONS/,
    "\n\n    /* =============== ANIMATIONS"
  );
  if (!out.includes("anime-bridge.js")) {
    out = out.replace(/<\/body>/i, '  <script src="/anime/anime-bridge.js"></script>\n</body>');
  }
  out = injectCloudflareAnalytics(out);
  return out;
}

if (!fs.existsSync(sourcePath)) {
  console.error(`Source introuvable : ${sourcePath}`);
  process.exit(1);
}

const content = loadContent(root);
const offers = loadOffers(root);
const source = fs.readFileSync(sourcePath, "utf8");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, patch(source, content, offers), "utf8");
console.log(`Page Animé générée : ${outPath}`);
