/** Snippet Cloudflare Web Analytics — ne pas modifier le contenu du script. */
export const CLOUDFLARE_WEB_ANALYTICS_SNIPPET =
  `<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "0f05b64f5be2491e8c467e7a7546d590"}'></script><!-- End Cloudflare Web Analytics -->`;

export function injectCloudflareAnalytics(html) {
  if (html.includes("static.cloudflareinsights.com/beacon.min.js")) {
    return html;
  }
  return html.replace(/<\/body>/i, `${CLOUDFLARE_WEB_ANALYTICS_SNIPPET}\n</body>`);
}
