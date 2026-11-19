import { LOCAL_CITY_SLUGS, LOCAL_TRADE_SLUGS } from "./site-config.mjs";
import { LOCAL_PAGES } from "./local-pages-data.mjs";
import { escapeHtml } from "./legal-static.mjs";

function labelForSlug(slug) {
  const page = LOCAL_PAGES.find((p) => p.slug === slug);
  if (page?.placeLabel) return page.placeLabel;
  return slug.replace("site-internet-", "").replace(/-ardeche$/, "").replace(/-/g, " ");
}

export function buildFooterZonesHtml() {
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

const FOOTER_ZONES_CSS = {
  minimal: `
    .footer-zones{padding:40px 0 28px;border-top:1px solid var(--ink)}
    .footer-zones__title{font-size:1.125rem;font-weight:500;margin:0 0 1rem;letter-spacing:-.02em}
    .footer-zones__subtitle{font-size:.75rem;font-weight:500;text-transform:uppercase;letter-spacing:.08em;margin:0 0 .5rem;color:var(--muted)}
    .footer-zones__grid{display:grid;gap:1.5rem}
    .footer-zones__list{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.35rem 1.25rem}
    .footer-zones__list a{font-weight:500;color:inherit;text-underline-offset:5px}
    .footer-zones__list a:hover{color:var(--accent)}
    @media(min-width:768px){.footer-zones__grid{grid-template-columns:1fr 1fr}}`,
  anime: `
    .footer-zones{padding:3rem 0 2rem;border-top:1px solid var(--line)}
    .footer-zones__title{font-size:clamp(1.1rem,2.5vw,1.25rem);font-weight:700;margin:0 0 1rem;letter-spacing:-.03em}
    .footer-zones__subtitle{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0 0 .5rem;color:var(--muted)}
    .footer-zones__grid{display:grid;gap:1.5rem}
    .footer-zones__list{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:.35rem 1.25rem}
    .footer-zones__list a{font-weight:600;color:var(--accent);text-underline-offset:6px}
    .footer-zones__list a:hover{opacity:.85}
    @media(min-width:768px){.footer-zones__grid{grid-template-columns:1fr 1fr}}`,
  elegant: `
    #footer-zones.footer-zones{padding:72px 0 48px;background:#f6f5ef;border-top:1px solid #dcded3}
    #footer-zones .footer-zones__title{font-weight:500;font-size:clamp(22px,3vw,28px);letter-spacing:-1px;margin:0 0 18px;color:#173d2e}
    #footer-zones .footer-zones__subtitle{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;margin:0 0 10px;color:#656f66}
    #footer-zones .footer-zones__grid{display:grid;gap:28px}
    #footer-zones .footer-zones__list{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px 20px}
    #footer-zones .footer-zones__list a{font-size:13px;font-weight:600;color:#173d2e;text-decoration:underline;text-underline-offset:4px}
    @media(min-width:768px){#footer-zones .footer-zones__grid{grid-template-columns:1fr 1fr}}`,
};

export function injectFooterZonesStyles(html, variant) {
  const css = FOOTER_ZONES_CSS[variant];
  if (!css || html.includes("id=\"footer-zones-css\"")) return html;
  return html.replace("</head>", `  <style id="footer-zones-css">${css}</style>\n</head>`);
}

/**
 * @param {string} html
 * @param {{ footerTag?: 'footer' | 'site-footer' }} [opts]
 */
export function injectFooterZones(html, opts = {}) {
  const footerTag = opts.footerTag || "site-footer";
  const footerRe = new RegExp(`<footer class="${footerTag}">`, "i");

  if (html.includes('id="footer-zones"')) {
    return html.replace(
      /<section[^>]*id="footer-zones"[^>]*>[\s\S]*?<\/section>/i,
      buildFooterZonesHtml().trim()
    );
  }
  if (!footerRe.test(html)) return html;
  return html.replace(footerRe, `${buildFooterZonesHtml()}\n  <footer class="${footerTag}">`);
}