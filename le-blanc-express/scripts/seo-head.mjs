import { buildFaviconHeadBlock } from "./favicon-head.mjs";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Balises title, description, Open Graph et Twitter à partir de SITE_CONTENT.seo */
export function buildSeoHeadBlock(seo, site, pageUrl) {
  const url = pageUrl || `${site.url}/`;
  const ogImage = seo.ogImage || `${site.url}/assets/img/og-share.png`;
  const ogW = seo.ogImageWidth || 1200;
  const ogH = seo.ogImageHeight || 630;
  return `
  <meta name="description" content="${escapeHtml(seo.description)}">
  <meta property="og:title" content="${escapeHtml(seo.title)}">
  <meta property="og:description" content="${escapeHtml(seo.description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:locale" content="${escapeHtml(seo.ogLocale || "fr_FR")}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:width" content="${ogW}">
  <meta property="og:image:height" content="${ogH}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(seo.title)}">
  <meta name="twitter:description" content="${escapeHtml(seo.description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <link rel="canonical" href="${escapeHtml(url)}">${buildFaviconHeadBlock()}`;
}

export function injectSeoHead(html, seo, site, pageUrl) {
  const block = buildSeoHeadBlock(seo, site, pageUrl);
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);

  const strip = [
    /<meta name="description"[^>]*>\s*/gi,
    /<meta property="og:title"[^>]*>\s*/gi,
    /<meta property="og:description"[^>]*>\s*/gi,
    /<meta property="og:type"[^>]*>\s*/gi,
    /<meta property="og:url"[^>]*>\s*/gi,
    /<meta property="og:locale"[^>]*>\s*/gi,
    /<meta property="og:image"[^>]*>\s*/gi,
    /<meta property="og:image:width"[^>]*>\s*/gi,
    /<meta property="og:image:height"[^>]*>\s*/gi,
    /<meta name="twitter:card"[^>]*>\s*/gi,
    /<meta name="twitter:title"[^>]*>\s*/gi,
    /<meta name="twitter:description"[^>]*>\s*/gi,
    /<meta name="twitter:image"[^>]*>\s*/gi,
    /<link rel="canonical"[^>]*>\s*/gi,
    /<link rel="icon"[^>]*>\s*/gi,
    /<link rel="apple-touch-icon"[^>]*>\s*/gi,
  ];
  for (const re of strip) out = out.replace(re, "");

  out = out.replace(/<meta name="viewport"[^>]*>/i, `$&${block}`);
  return out;
}
