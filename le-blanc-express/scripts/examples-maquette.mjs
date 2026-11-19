import { escapeHtml } from "./legal-static.mjs";

const PAYSAGISTE_CARD_MINIMAL = `
          <a class="example-card example-card--link reveal" href="/exemplemaquette/">
            <div class="example-card__shot">
              <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                <rect x="24" y="200" width="352" height="48" fill="#2d5a27" opacity=".25"/>
                <ellipse cx="120" cy="170" rx="52" ry="70" fill="none" stroke="#0b0b0b" stroke-width="1.5"/>
                <ellipse cx="260" cy="155" rx="70" ry="88" fill="none" stroke="#0b0b0b" stroke-width="1.5"/>
                <rect x="24" y="64" width="160" height="14" fill="#0b0b0b"/>
                <rect x="24" y="92" width="220" height="1.5" fill="#bdbdbd"/>
                <rect x="290" y="64" width="86" height="30" fill="#c8321a"/>
              </svg>
              <span class="example-card__fictif">Exemple fictif</span><span class="example-card__label">${escapeHtml("Exemple de maquette")}</span>
            </div>
            <span class="example-card__trade">Paysagiste</span>
          </a>`;

const PAYSAGISTE_CARD_ANIME = `
          <a class="example-card example-card--link" href="/exemplemaquette/">
            <div class="example-card__shot">
              <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                <ellipse cx="110" cy="175" rx="48" ry="62" fill="none" stroke="#f4f2ec" stroke-width="2"/>
                <ellipse cx="268" cy="160" rx="62" ry="78" fill="none" stroke="#f4f2ec" stroke-width="2"/>
                <rect x="24" y="210" width="352" height="44" rx="8" fill="#2d5a27" opacity=".45"/>
                <rect x="24" y="64" width="150" height="16" rx="3" fill="#f4f2ec"/>
                <rect x="290" y="64" width="86" height="32" rx="9" fill="#ff3d81"/>
              </svg>
              <span class="example-card__fictif">Exemple fictif</span><span class="example-card__label">${escapeHtml("Exemple de maquette")}</span>
            </div>
            <span class="example-card__trade">Paysagiste</span>
          </a>`;

/** Ajoute la carte « Paysagiste » vers /exemplemaquette/ (minimal : grille statique). */
export function appendPaysagisteExampleCard(html) {
  if (html.includes('href="/exemplemaquette/"')) return html;
  if (html.includes('id="examples-grid"') && html.includes("gallery")) {
    return html.replace(
      /(<figcaption class="example-card__trade">Restaurant<\/figcaption>\s*<\/figure>\s*)(<\/div>\s*<\/div>\s*<\/section>\s*<section id="avis")/,
      `$1${PAYSAGISTE_CARD_ANIME}$2`
    );
  }
  return html.replace(
    /(<figcaption class="example-card__trade">Restaurant<\/figcaption>\s*<\/figure>\s*)(<\/div>\s*<\/div>\s*<\/section>\s*<section id="avis")/,
    `$1${PAYSAGISTE_CARD_MINIMAL}$2`
  );
}

export function injectMinimalExampleLinkStyles(html) {
  if (html.includes("example-card--link{")) return html;
  return html.replace(
    "</style>",
    `
    .example-card--link{text-decoration:none;color:inherit;display:block}
    .example-card--link .example-card__trade{display:block;padding:16px 18px;font-weight:300;font-size:1.375rem;letter-spacing:-.01em}
    .example-card--link:hover .example-card__shot{background:#fafafa}
    .examples-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
  </style>`
  );
}

export function injectAnimeExampleLinkStyles(html) {
  if (html.includes("example-card--link{")) return html;
  return html.replace(
    "</style>",
    `
    a.example-card--link{text-decoration:none;color:inherit;flex:0 0 auto;width:min(320px,78vw)}
    a.example-card--link .example-card__trade{display:block;padding:14px 16px;font-weight:600}
  </style>`
  );
}