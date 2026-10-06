import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./load-content.mjs";
import { loadOffers } from "./load-offers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "design-minimal", "index.html");
const outDir = path.join(root, "public", "minimal");
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
    /<span class="field__legend" id="plan-label" data-label-plan>[^<]*<\/span>/,
    `<span class="field__legend" id="plan-label" data-label-plan>${escapeHtml(f.plan)}</span>`
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
    /<button type="submit" class="btn contact-form__submit" data-submit-label>[^<]*<\/button>/,
    `<button type="submit" class="btn contact-form__submit" data-submit-label>${escapeHtml(f.submit)}</button>`
  );
  if (O.planOnceFormLabel) {
    out = out.replace(
      /(<button type="button" class="pill-choice is-selected" data-pill-group="plan" data-value="once"[^>]*>)[^<]*(<\/button>)/,
      `$1${escapeHtml(O.planOnceFormLabel)}$2`
    );
  }
  return out;
}

function patchStyleSelector(html, C) {
  const t = C.themeSwitch;
  const controls = `
        <div class="theme-switch__controls" role="group" aria-label="Choisir un style de page">
          <a class="theme-switch__btn" href="/#style-selector" data-go-dynamique data-theme-active="dynamique" data-theme-switch-dynamique>${escapeHtml(t.dynamique)}</a>
          <a class="theme-switch__btn" href="/elegant/#style-selector" data-go-elegant data-theme-active="elegant" data-theme-switch-elegant>${escapeHtml(t.elegant)}</a>
          <button type="button" class="theme-switch__btn is-active" data-theme-active="minimal" aria-pressed="true" data-theme-switch-minimal>${escapeHtml(t.minimal)}</button>
        </div>`;
  let out = html.replace(
    /<p class="section-lead" data-theme-switch-subtitle>[^<]*<\/p>/,
    `<p class="section-lead" data-theme-switch-subtitle>${escapeHtml(t.subtitle)}</p>`
  );
  out = out.replace(
    /<div class="theme-switch__controls"[\s\S]*?<\/div>\s*<\/div>\s*<\/section>\s*<section id="tarifs"/,
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
  if (!out.includes('rel="canonical"')) {
    out = out.replace(/<head>/i, '<head>\n  <link rel="canonical" href="https://sitereadyshd.fr/">');
  } else {
    out = out.replace(
      /<link rel="canonical" href="[^"]*">/i,
      '<link rel="canonical" href="https://sitereadyshd.fr/">'
    );
  }
  out = patchStyleSelector(out, content);
  out = patchFormCopy(out, content, offers);
  out = out.replace(
    /\n\s*\/\* Formulaire : validation et envoi[\s\S]*?\.then\(function \(\) \{ btn\.disabled = false; \}\);\s*\}\);\s*/,
    "\n"
  );
  if (!out.includes("minimal-bridge.js")) {
    out = out.replace(/<\/body>/i, '  <script src="/minimal/minimal-bridge.js"></script>\n</body>');
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
console.log(`Page Minimal générée : ${outPath}`);
