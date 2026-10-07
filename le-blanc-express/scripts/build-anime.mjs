import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./load-content.mjs";
import { loadOffers } from "./load-offers.mjs";
import { injectSeoHead } from "./seo-head.mjs";

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
  const consentHtml = `${escapeHtml(f.consentBefore)}<a href="/politique-confidentialite.html">${escapeHtml(f.consentLink)}</a>.`;
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

function patch(html, content, offers) {
  let out = html;
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/\smethod="post"\saction="\/api\/contact"/i, "");
  out = out.replace(
    /<link rel="canonical" href="[^"]*">/i,
    '<link rel="canonical" href="https://sitereadyshd.fr/">'
  );
  out = patchStyleSelector(out, content);
  out = patchFormCopy(out, content, offers);
  out = injectSeoHead(out, content.seo, content.site, `${content.site.url}/anime/`);
  out = injectNoScriptAnime(out);
  out = out.replace(
    /\n    form\.addEventListener\('submit', function \(e\) \{[\s\S]*?\n    \}\);\n\n    \/\* =+ ANIMATIONS/,
    "\n\n    /* =============== ANIMATIONS"
  );
  if (!out.includes("anime-bridge.js")) {
    out = out.replace(/<\/body>/i, '  <script src="/anime/anime-bridge.js"></script>\n</body>');
  }
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
