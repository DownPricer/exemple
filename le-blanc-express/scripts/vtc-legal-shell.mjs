import { escapeHtml } from "./seo-head.mjs";
import { buildSeoHeadBlock } from "./seo-head.mjs";
import { SITE_URL } from "./site-config.mjs";

/** Enveloppe HTML des pages légales VTC — sans Cloudflare Analytics. */
export function wrapVtcLegalPage({ title, description, canonicalUrl, bodyHtml }) {
  const seo = {
    title,
    description,
    ogLocale: "fr_FR",
    ogImage: `${SITE_URL}/assets/img/og-image.png`,
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };
  const headBlock = buildSeoHeadBlock(seo, { url: SITE_URL }, canonicalUrl, { canonicalUrl });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>${headBlock}
  <link rel="stylesheet" href="/assets/css/vtc-legal.css">
</head>
<body class="vtc-legal-page">
  <main class="vtc-legal-wrap" id="legal-content">${bodyHtml}
  </main>
</body>
</html>`;
}
