import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCAL_PAGES } from "./local-pages-data.mjs";
import { escapeHtml } from "./legal-static.mjs";
import { wrapStaticPage } from "./build-page-shell.mjs";
import { LOCAL_CITY_SLUGS, LOCAL_TRADE_SLUGS, SITE_URL } from "./site-config.mjs";
import { loadContent } from "./load-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const C = loadContent(path.join(__dirname, ".."));

function linkList(slugs, current) {
  return slugs
    .filter((s) => s !== current)
    .map((s) => {
      const page = LOCAL_PAGES.find((p) => p.slug === s);
      const label = page?.placeLabel || s.replace(/^site-internet-/, "").replace(/-/g, " ");
      return `<li><a href="/${s}">${escapeHtml(label)}</a></li>`;
    })
    .join("\n        ");
}

function buildBody(page) {
  const paras = page.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n      ");
  const faq = page.faq
    .map(
      (item, i) => `
        <div class="faq-item">
          <h3>${escapeHtml(item.q)}</h3>
          <p>${escapeHtml(item.a)}</p>
        </div>`
    )
    .join("");

  return `
      <h1>${escapeHtml(page.h1)}</h1>
      ${paras}
      <h2>Tarifs SiteReady</h2>
      <p>À partir de 500&nbsp;€ + hébergement 5&nbsp;€/mois pour une vitrine, 50&nbsp;€/mois avec hébergement et nom de domaine inclus, ou sur devis. Maquette gratuite avant engagement.</p>
      <p><a class="btn btn--pill btn--yellow" href="/#contact">Demander ma maquette gratuite</a></p>
      <h2>Questions fréquentes</h2>
      <div class="faq local-faq">${faq}
      </div>
      <h2>Autres villes en Ardèche</h2>
      <ul class="local-links">
        ${linkList(LOCAL_CITY_SLUGS, page.slug)}
      </ul>
      <h2>Sites par métier</h2>
      <ul class="local-links">
        ${linkList(LOCAL_TRADE_SLUGS, page.slug)}
      </ul>
      <p><a href="/">Retour à l’accueil SiteReady</a></p>`;
}

for (const page of LOCAL_PAGES) {
  const canonicalUrl = `${SITE_URL}/${page.slug}`;
  const html = wrapStaticPage({
    title: page.title,
    description: page.description,
    canonicalUrl,
    bodyHtml: buildBody(page),
    bodyClass: "legal-page local-landing",
  });
  const outDir = path.join(publicDir, page.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
  console.log(`Page locale : /${page.slug}/`);
}
