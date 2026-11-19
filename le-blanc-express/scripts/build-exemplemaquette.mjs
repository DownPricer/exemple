/**
 * Copie « site jardinier/site » vers public/exemplemaquette/ pour sitereadyshd.fr/exemplemaquette/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "./site-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceDir = path.join(root, "site jardinier", "site");
const outDir = path.join(root, "public", "exemplemaquette");
const publicBase = `${SITE_URL}/exemplemaquette/`;

const BANNER_HTML = `<aside id="siteready-demo-banner" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483646;margin:0;padding:0.45rem 0.75rem;font:12px/1.4 system-ui,sans-serif;text-align:center;color:#10243a;background:rgba(251,247,239,0.92);border-top:1px solid rgba(16,36,58,0.12);backdrop-filter:blur(4px);"><span style="display:block;margin-bottom:0.15rem;font-weight:600;">Exemple fictif — démonstration SiteReady</span><a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="color:#0b5d4e;text-decoration:none;">Maquette réalisée par SiteReady — sitereadyshd.fr</a></aside><style>body{padding-bottom:3.25rem !important;}</style>`;

const HTML_PAGES = ["index.html", "refonte.html", "mentions-legales.html"];

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function patchHtml(html) {
  let out = html.replaceAll("https://www.exemple-tnature-jardin.fr/", publicBase);

  if (!/<meta[^>]+name=["']robots["']/i.test(out)) {
    out = out.replace(/<head>/i, '<head>\n  <meta name="robots" content="noindex, nofollow">');
  } else {
    out = out.replace(
      /<meta[^>]+name=["']robots["'][^>]*>/i,
      '<meta name="robots" content="noindex, nofollow">'
    );
  }

  if (!/id=["']siteready-demo-banner["']/.test(out) && /<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${BANNER_HTML}\n</body>`);
  }

  return out;
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Source introuvable : ${sourceDir}`);
  process.exit(1);
}

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
copyRecursive(sourceDir, outDir);

for (const file of HTML_PAGES) {
  const filePath = path.join(outDir, file);
  if (!fs.existsSync(filePath)) continue;
  fs.writeFileSync(filePath, patchHtml(fs.readFileSync(filePath, "utf8")), "utf8");
}

console.log(`OK  public/exemplemaquette/ ← site jardinier/site (${publicBase})`);