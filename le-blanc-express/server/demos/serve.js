import fs from "node:fs";
import path from "node:path";
import express from "express";
import { SITE_URL } from "../../scripts/site-config.mjs";
import { DEMO_META_FILENAME } from "./paths.js";
import { demoDir, isExpired, readMeta } from "./store.js";

const BANNER_HTML = `<aside id="siteready-demo-banner" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483646;margin:0;padding:0.45rem 0.75rem;font:12px/1.4 system-ui,sans-serif;text-align:center;color:#10243a;background:rgba(251,247,239,0.92);border-top:1px solid rgba(16,36,58,0.12);backdrop-filter:blur(4px);"><a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="color:#0b5d4e;text-decoration:none;">Maquette réalisée par SiteReady — sitereadyshd.fr</a></aside><style>body{padding-bottom:2.5rem !important;}</style>`;

export function setDemoSecurityHeaders(_req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "sandbox allow-scripts allow-forms allow-popups allow-modals"
  );
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  return next();
}

export function sendDemoUnavailable(res, status = 410) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Maquette indisponible</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#fbf7ef;color:#10243a;}
    main{text-align:center;padding:2rem;}
    a{color:#0b5d4e;}
  </style>
</head>
<body>
  <main>
    <h1>Cette maquette n’est plus disponible</h1>
    <p><a href="${SITE_URL}">Retour sur sitereadyshd.fr</a></p>
  </main>
</body>
</html>`;
  return res.status(status).type("html").send(html);
}

function isHiddenSegment(urlPath) {
  return String(urlPath || "")
    .split("/")
    .filter(Boolean)
    .some((part) => part.startsWith("."));
}

function resolveDemoFile(slug, subPath) {
  const root = path.resolve(demoDir(slug));
  const rel = String(subPath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  if (!rel || rel.endsWith("/")) {
    const base = rel ? path.join(root, rel) : root;
    const indexHtml = path.join(base, "index.html");
    const indexHtm = path.join(base, "index.htm");
    if (fs.existsSync(indexHtml)) return indexHtml;
    if (fs.existsSync(indexHtm)) return indexHtm;
    return null;
  }

  const target = path.resolve(root, rel);
  if (!target.startsWith(root + path.sep) && target !== root) return null;
  if (path.basename(target) === DEMO_META_FILENAME) return null;
  if (!fs.existsSync(target)) return null;
  const st = fs.lstatSync(target);
  if (st.isSymbolicLink()) return null;
  if (st.isDirectory()) {
    const indexHtml = path.join(target, "index.html");
    const indexHtm = path.join(target, "index.htm");
    if (fs.existsSync(indexHtml)) return indexHtml;
    if (fs.existsSync(indexHtm)) return indexHtm;
    return null;
  }
  if (!st.isFile()) return null;
  return target;
}

function injectBanner(html) {
  if (/id=["']siteready-demo-banner["']/.test(html)) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${BANNER_HTML}</body>`);
  }
  return html + BANNER_HTML;
}

export function createDemoRouter() {
  const router = express.Router();
  router.use(setDemoSecurityHeaders);

  router.use((req, res) => {
    const parts = req.path.split("/").filter(Boolean);
    const slug = parts[0];
    const restParts = parts.slice(1);
    const rest = restParts.join("/");
    const wantsDirIndex = req.path.endsWith("/") || restParts.length === 0;

    if (!slug || slug.startsWith(".")) {
      return sendDemoUnavailable(res, 404);
    }
    if (isHiddenSegment(rest)) {
      return res.status(404).type("text").send("Not found");
    }

    const meta = readMeta(slug);
    const dir = demoDir(slug);
    if (!meta || !fs.existsSync(dir) || isExpired(meta)) {
      return sendDemoUnavailable(res, meta && isExpired(meta) ? 410 : 404);
    }

    if (restParts.length === 0 && !req.path.endsWith("/")) {
      return res.redirect(302, `/demo/${slug}/`);
    }

    if (path.basename(rest) === DEMO_META_FILENAME) {
      return res.status(404).type("text").send("Not found");
    }

    const file = resolveDemoFile(slug, wantsDirIndex && rest ? `${rest}/` : rest);
    if (!file) {
      if (restParts.length === 0) return sendDemoUnavailable(res, 404);
      return res.status(404).type("text").send("Not found");
    }

    const ext = path.extname(file).toLowerCase();
    if (ext === ".html" || ext === ".htm") {
      const html = injectBanner(fs.readFileSync(file, "utf8"));
      return res.type("html").send(html);
    }
    return res.sendFile(file);
  });

  return router;
}
