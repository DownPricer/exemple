import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    <p>Choisissez un style : deux présentations différentes du même service.</p>
    <div class="theme-switch-refonte__controls" role="group" aria-label="Choisir un style de page">
      <a class="theme-switch-refonte__btn" href="/#style-selector" data-go-dynamique data-theme-active="dynamique">Dynamique</a>
      <span class="theme-switch-refonte__btn is-active" data-theme-active="elegant" aria-current="true">Élégant</span>
    </div>
  </div>
</section>`;

function patch(html) {
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
  out = out.replace(/href=["']Confidentialité["']/gi, 'href="/politique-confidentialite.html"');

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

  return out;
}

if (!fs.existsSync(sourcePath)) {
  console.error(
    `Source introuvable : ${sourcePath}\nPlacez index.html dans refonte-chatgpt/SiteReady-refonte/ puis relancez npm run build:elegant`
  );
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, "utf8");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, patch(source), "utf8");

const avisSource = path.join(root, "refonte-chatgpt", "SiteReady-refonte", "avis.json");
if (fs.existsSync(avisSource)) {
  fs.copyFileSync(avisSource, path.join(outDir, "avis.json"));
}

console.log(`Page Élégant générée : ${outPath}`);
