import { SITE_URL, allSitemapPaths } from "./site-config.mjs";

export function buildSitemapXml() {
  const urls = allSitemapPaths()
    .map((path) => {
      const loc =
        path === "/"
          ? `${SITE_URL}/`
          : path.endsWith("/")
            ? `${SITE_URL}${path}`
            : `${SITE_URL}${path}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function buildRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}
