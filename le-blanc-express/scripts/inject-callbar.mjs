/** Bandeau d’appel partagé — sans numéro dans le HTML (voir callbar-shd.js). */
export const CALLBAR_MARKUP = `
<aside class="callbar-shd" id="callbar" data-nosnippet aria-label="Contact téléphonique">
  <div class="callbar-shd__in">
    <p><b>Une démo ou plus d'infos ?</b> <span class="callbar-shd__long">Appelez-nous</span> <span class="callbar-shd__num" id="callNum" aria-live="polite"></span></p>
    <button class="callbar-shd__go" id="callBtn" type="button">Appeler</button>
    <button class="callbar-shd__x" id="callClose" type="button" aria-label="Fermer le bandeau">×</button>
  </div>
</aside>`;

export function injectCallbar(html) {
  if (!html || html.includes('id="callbar"')) return html;
  let out = html;
  if (!out.includes("callbar-shd.css")) {
    out = out.replace(/<\/head>/i, '  <link rel="stylesheet" href="/assets/css/callbar-shd.css">\n</head>');
  }
  out = out.replace(
    /<\/body>/i,
    `${CALLBAR_MARKUP}\n  <script src="/assets/js/callbar-shd.js" defer></script>\n</body>`
  );
  return out;
}
