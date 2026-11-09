import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LANDING_CONFIG } from "../landing/landing.config.mjs";
import { SITE_URL } from "./site-config.mjs";
import {
  buildVtcIndexHtml,
  collectLandingWarnings,
} from "./vtc-landing-html.mjs";
import { vtcMentionsBodyHtml, vtcPrivacyBodyHtml } from "./vtc-legal.mjs";
import { wrapVtcLegalPage } from "./vtc-legal-shell.mjs";
import { injectCallbar } from "./inject-callbar.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const vtcDir = path.join(publicDir, "vtc");
const fontOut = path.join(publicDir, "assets", "fonts", "vtc");

const FONT_COPIES = [
  {
    pkg: "bricolage-grotesque",
    file: "bricolage-grotesque-latin-500-normal.woff2",
    out: "bricolage-grotesque-500.woff2",
    family: "Bricolage Grotesque",
    weight: 500,
  },
  {
    pkg: "bricolage-grotesque",
    file: "bricolage-grotesque-latin-700-normal.woff2",
    out: "bricolage-grotesque-700.woff2",
    family: "Bricolage Grotesque",
    weight: 700,
  },
  {
    pkg: "bricolage-grotesque",
    file: "bricolage-grotesque-latin-800-normal.woff2",
    out: "bricolage-grotesque-800.woff2",
    family: "Bricolage Grotesque",
    weight: 800,
  },
  {
    pkg: "figtree",
    file: "figtree-latin-400-normal.woff2",
    out: "figtree-400.woff2",
    family: "Figtree",
    weight: 400,
  },
  {
    pkg: "figtree",
    file: "figtree-latin-500-normal.woff2",
    out: "figtree-500.woff2",
    family: "Figtree",
    weight: 500,
  },
  {
    pkg: "figtree",
    file: "figtree-latin-600-normal.woff2",
    out: "figtree-600.woff2",
    family: "Figtree",
    weight: 600,
  },
  {
    pkg: "figtree",
    file: "figtree-latin-700-normal.woff2",
    out: "figtree-700.woff2",
    family: "Figtree",
    weight: 700,
  },
  {
    pkg: "share-tech-mono",
    file: "share-tech-mono-latin-400-normal.woff2",
    out: "share-tech-mono-400.woff2",
    family: "Share Tech Mono",
    weight: 400,
  },
];

function copyFonts() {
  fs.mkdirSync(fontOut, { recursive: true });
  const faces = [];
  for (const entry of FONT_COPIES) {
    const src = path.join(root, "node_modules", `@fontsource/${entry.pkg}`, "files", entry.file);
    if (!fs.existsSync(src)) {
      throw new Error(`Police introuvable : ${src} (exécutez npm ci).`);
    }
    fs.copyFileSync(src, path.join(fontOut, entry.out));
    faces.push(`@font-face {
  font-family: '${entry.family}';
  font-style: normal;
  font-display: swap;
  font-weight: ${entry.weight};
  src: url('/assets/fonts/vtc/${entry.out}') format('woff2');
}`);
  }
  return `${faces.join("\n\n")}\n\n`;
}

function buildCss() {
  const base = fs.readFileSync(path.join(root, "landing", "vtc-landing.css"), "utf8");
  const css = copyFonts() + base;
  const outPath = path.join(publicDir, "assets", "css", "vtc-landing.css");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, css, "utf8");
  console.log(`Généré : ${outPath}`);
}

function buildJs() {
  const outDir = path.join(publicDir, "assets", "js");
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of ["vtc-landing.js", "vtc-contact-form.js"]) {
    const src = path.join(root, "landing", name);
    const out = path.join(outDir, name);
    fs.copyFileSync(src, out);
    console.log(`Généré : ${out}`);
  }
}

function buildPages(cfg) {
  const warnings = collectLandingWarnings(cfg);
  fs.mkdirSync(vtcDir, { recursive: true });

  const assetsVersion = String(
    process.env.VTC_ASSETS_VERSION || `${Date.now()}`
  );
  let indexHtml = buildVtcIndexHtml(cfg, warnings, assetsVersion);
  indexHtml = injectCallbar(indexHtml);
  fs.writeFileSync(path.join(vtcDir, "index.html"), indexHtml, "utf8");
  console.log(`Généré : ${path.join(vtcDir, "index.html")}`);

  const mentions = wrapVtcLegalPage({
    title: "Mentions légales — offre VTC | SiteReady SHD",
    description: "Mentions légales de la page de présentation SiteReady SHD pour chauffeurs VTC.",
    canonicalUrl: `${SITE_URL}/vtc/mentions-legales.html`,
    bodyHtml: vtcMentionsBodyHtml(cfg),
  });
  fs.writeFileSync(path.join(vtcDir, "mentions-legales.html"), injectCallbar(mentions), "utf8");

  const privacy = wrapVtcLegalPage({
    title: "Politique de confidentialité — offre VTC | SiteReady SHD",
    description:
      "Comment SiteReady SHD traite vos données lorsque vous contactez l’équipe au sujet de l’offre VTC.",
    canonicalUrl: `${SITE_URL}/vtc/politique-confidentialite.html`,
    bodyHtml: vtcPrivacyBodyHtml(cfg),
  });
  fs.writeFileSync(path.join(vtcDir, "politique-confidentialite.html"), injectCallbar(privacy), "utf8");

  if (warnings.length) {
    console.warn(
      `[landing.config] ${warnings.length} valeur(s) à compléter (détails en console si NODE_ENV !== production sur la page).`
    );
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }
}

buildCss();
buildJs();
buildPages(LANDING_CONFIG);
