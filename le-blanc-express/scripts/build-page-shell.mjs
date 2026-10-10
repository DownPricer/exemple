import { escapeHtml } from "./legal-static.mjs";
import { injectCloudflareAnalytics } from "./cloudflare-analytics.mjs";
import { injectFaviconHead } from "./favicon-head.mjs";
import { buildSeoHeadBlock } from "./seo-head.mjs";

export function wrapStaticPage({
  title,
  description,
  canonicalUrl,
  bodyHtml,
  extraHead = "",
  bodyClass = "legal-page",
  ogImage,
}) {
  const seo = {
    title,
    description,
    ogLocale: "fr_FR",
    ogImage: ogImage || "https://sitereadyshd.fr/assets/img/og-image.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
  };
  const headBlock = buildSeoHeadBlock(seo, { url: "https://sitereadyshd.fr" }, canonicalUrl, {
    canonicalUrl,
  });

  let html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>${headBlock}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@800;900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/styles.css">
  ${extraHead}
</head>
<body class="${bodyClass}">
  <main class="container container--narrow" id="legal-content">${bodyHtml}
  </main>
</body>
</html>
`;
  html = injectFaviconHead(html);
  html = injectCloudflareAnalytics(html);
  return html;
}
