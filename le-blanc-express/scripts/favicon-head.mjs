/** Balises favicon / icône d’app — chemin unique dans public/assets/img/ */
export const FAVICON_PATH = "/assets/img/favicon.png";

export function buildFaviconHeadBlock() {
  return `
  <link rel="icon" type="image/png" href="${FAVICON_PATH}" sizes="32x32">
  <link rel="apple-touch-icon" href="${FAVICON_PATH}">`;
}

export function injectFaviconHead(html) {
  if (html.includes('rel="icon"')) return html;
  return html.replace(/<meta charset="[^"]*">/i, (m) => `${m}${buildFaviconHeadBlock()}`);
}

export const BRAND_MARK_IMG = `<img class="brand__mark" src="${FAVICON_PATH}" alt="" width="32" height="32" decoding="async">`;
