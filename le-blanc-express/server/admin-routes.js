import express from "express";
import multer from "multer";
import { SITE_URL } from "../scripts/site-config.mjs";
import {
  clearLoginFailures,
  createSession,
  destroySession,
  getClientIp,
  getSession,
  isLoginBlocked,
  loginAttemptsRemaining,
  recordLoginFailure,
  requireAdmin,
  requireCsrf,
  verifyAdminPassword,
} from "./admin-auth.js";
import { DemoZipError, publishDemoFromZip } from "./demos/extract.js";
import { MAX_ZIP_BYTES } from "./demos/paths.js";
import { deleteDemo, extendDemo, listDemos } from "./demos/store.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ZIP_BYTES, files: 1 },
});

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout({ title, body, csrfToken = "" }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)} — SiteReady</title>
  <style>
    :root {
      --night:#10243a; --yellow:#ffc531; --cream:#fbf7ef; --green:#0b5d4e;
      --red:#e8452c; --muted:#3d4f63; --white:#fff;
    }
    *{box-sizing:border-box}
    body{margin:0;font-family:system-ui,sans-serif;background:linear-gradient(165deg,#fbf7ef 0%,#eef4f1 45%,#f7f0e2 100%);color:var(--night);min-height:100vh;}
    header{padding:1.25rem 1.5rem;border-bottom:1px solid rgba(16,36,58,.08);display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;}
    header strong{font-size:1.35rem;letter-spacing:-.02em;}
    main{max-width:920px;margin:0 auto;padding:1.5rem;}
    h1{font-size:1.6rem;margin:0 0 .75rem;}
    p{color:var(--muted);line-height:1.5;}
    .card{background:rgba(255,255,255,.72);border:1px solid rgba(16,36,58,.08);border-radius:18px;padding:1.25rem;margin:1rem 0;}
    label{display:block;font-weight:600;margin:.85rem 0 .35rem;}
    input[type=text],input[type=password],select{width:100%;padding:.7rem .85rem;border:1px solid rgba(16,36,58,.18);border-radius:12px;font:inherit;background:#fff;}
    .drop{border:2px dashed rgba(16,36,58,.22);border-radius:16px;padding:1.5rem;text-align:center;background:rgba(255,255,255,.55);transition:border-color .15s,background .15s;}
    .drop.drag{border-color:var(--green);background:rgba(11,93,78,.06);}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;border:0;border-radius:999px;padding:.65rem 1.1rem;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;color:var(--night);background:var(--yellow);}
    .btn.secondary{background:transparent;border:1px solid rgba(16,36,58,.2);}
    .btn.danger{background:var(--red);color:#fff;}
    .btn:disabled{opacity:.55;cursor:not-allowed;}
    .row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin-top:.75rem;}
    .error{background:rgba(232,69,44,.1);color:#8a1f10;padding:.75rem 1rem;border-radius:12px;margin:1rem 0;}
    .ok{background:rgba(11,93,78,.1);color:var(--green);padding:.75rem 1rem;border-radius:12px;margin:1rem 0;}
    .linkbox{font-family:ui-monospace,monospace;word-break:break-all;background:#fff;border:1px solid rgba(16,36,58,.12);border-radius:10px;padding:.65rem .8rem;}
    table{width:100%;border-collapse:collapse;font-size:.95rem;}
    th,td{text-align:left;padding:.7rem .4rem;border-bottom:1px solid rgba(16,36,58,.08);vertical-align:top;}
    th{font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);}
    .muted{color:var(--muted);font-size:.9rem;}
    .expired{color:var(--red);font-weight:600;}
  </style>
</head>
<body>
  <header>
    <strong>SiteReady</strong>
    <span class="muted">Admin démos</span>
  </header>
  <main>
    ${body}
  </main>
  ${csrfToken ? `<script>window.__CSRF=${JSON.stringify(csrfToken)};</script>` : ""}
</body>
</html>`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  } catch {
    return String(iso || "—");
  }
}

function demoPublicUrl(slug) {
  return `${SITE_URL}/demo/${slug}/`;
}

export function createAdminRouter() {
  const router = express.Router();

  router.get("/", (_req, res) => res.redirect(302, "/admin/demos"));

  router.get("/login", (req, res) => {
    if (getSession(req)) return res.redirect(302, "/admin/demos");
    const ip = getClientIp(req);
    const blocked = isLoginBlocked(ip);
    const error = req.query.error === "1" ? "Mot de passe incorrect." : req.query.error === "blocked"
      ? "Trop de tentatives. Réessayez dans 15 minutes."
      : "";
    const body = `
      <h1>Connexion</h1>
      <p>Accès réservé à la publication de maquettes prospects.</p>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
      <div class="card">
        <form method="post" action="/admin/login" ${blocked ? "onsubmit=\"return false\"" : ""}>
          <label for="password">Mot de passe</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required ${blocked ? "disabled" : ""}>
          <div class="row">
            <button class="btn" type="submit" ${blocked ? "disabled" : ""}>Se connecter</button>
            <span class="muted">${blocked ? "Accès temporairement bloqué" : `${loginAttemptsRemaining(ip)} tentative(s) restante(s)`}</span>
          </div>
        </form>
      </div>`;
    res.type("html").send(layout({ title: "Connexion", body }));
  });

  router.post("/login", express.urlencoded({ extended: false }), async (req, res) => {
    const ip = getClientIp(req);
    if (isLoginBlocked(ip)) {
      return res.redirect(302, "/admin/login?error=blocked");
    }
    const ok = await verifyAdminPassword(req.body?.password || "");
    if (!ok) {
      recordLoginFailure(ip);
      if (isLoginBlocked(ip)) {
        return res.redirect(302, "/admin/login?error=blocked");
      }
      return res.redirect(302, "/admin/login?error=1");
    }
    clearLoginFailures(ip);
    createSession(res, req);
    return res.redirect(302, "/admin/demos");
  });

  router.post("/logout", express.urlencoded({ extended: false }), requireCsrf, (req, res) => {
    destroySession(req, res);
    return res.redirect(302, "/admin/login");
  });

  router.get("/demos", requireAdmin, (req, res) => {
    const session = req.adminSession;
    const demos = listDemos();
    const flashOk = req.query.uploaded ? demoPublicUrl(String(req.query.uploaded)) : "";
    const flashErr = req.query.err ? String(req.query.err) : "";

    const rows = demos
      .map((d) => {
        const url = demoPublicUrl(d.slug);
        return `<tr>
          <td><strong>${escapeHtml(d.name)}</strong><div class="muted">${escapeHtml(d.slug)}</div></td>
          <td>${escapeHtml(formatDate(d.createdAt))}</td>
          <td class="${d.expired ? "expired" : ""}">${escapeHtml(formatDate(d.expiresAt))}${d.expired ? " (expirée)" : ""}</td>
          <td>
            <div class="row">
              <button type="button" class="btn secondary" data-copy="${escapeHtml(url)}">Copier</button>
              <a class="btn secondary" href="${escapeHtml(url)}" target="_blank" rel="noopener">Ouvrir</a>
              <form method="post" action="/admin/demos/${encodeURIComponent(d.slug)}/extend" style="display:inline">
                <input type="hidden" name="csrf" value="${escapeHtml(session.csrfToken)}">
                <button class="btn secondary" type="submit">Prolonger 30 j</button>
              </form>
              <form method="post" action="/admin/demos/${encodeURIComponent(d.slug)}/delete" style="display:inline" onsubmit="return confirm('Supprimer cette démo ?');">
                <input type="hidden" name="csrf" value="${escapeHtml(session.csrfToken)}">
                <button class="btn danger" type="submit">Supprimer</button>
              </form>
            </div>
          </td>
        </tr>`;
      })
      .join("");

    const body = `
      <div class="row" style="justify-content:space-between">
        <h1>Démos prospects</h1>
        <form method="post" action="/admin/logout">
          <input type="hidden" name="csrf" value="${escapeHtml(session.csrfToken)}">
          <button class="btn secondary" type="submit">Déconnexion</button>
        </form>
      </div>
      ${flashOk ? `<div class="ok">Démo publiée.<div class="linkbox" id="new-link">${escapeHtml(flashOk)}</div><div class="row"><button type="button" class="btn" data-copy="${escapeHtml(flashOk)}">Copier le lien</button><a class="btn secondary" href="${escapeHtml(flashOk)}" target="_blank" rel="noopener">Ouvrir</a></div></div>` : ""}
      ${flashErr ? `<div class="error">${escapeHtml(flashErr)}</div>` : ""}
      <div class="card">
        <h2 style="margin-top:0;font-size:1.15rem;">Publier une maquette</h2>
        <form id="upload-form" method="post" action="/admin/demos/upload" enctype="multipart/form-data">
          <input type="hidden" name="csrf" value="${escapeHtml(session.csrfToken)}">
          <div class="drop" id="dropzone">
            <p style="margin:0 0 .75rem">Glissez-déposez un fichier <strong>.zip</strong> (max 20 Mo)</p>
            <input id="zip" name="zip" type="file" accept=".zip,application/zip" required>
          </div>
          <label for="name">Nom du prospect</label>
          <input id="name" name="name" type="text" maxlength="120" placeholder="Garage Dupont – Annonay" required>
          <label for="days">Durée de validité</label>
          <select id="days" name="days">
            <option value="7">7 jours</option>
            <option value="30" selected>30 jours</option>
            <option value="90">90 jours</option>
          </select>
          <div class="row">
            <button class="btn" type="submit">Publier la démo</button>
          </div>
        </form>
      </div>
      <div class="card">
        <h2 style="margin-top:0;font-size:1.15rem;">Démos existantes</h2>
        ${
          demos.length
            ? `<table><thead><tr><th>Prospect</th><th>Créée</th><th>Expire</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>`
            : `<p class="muted">Aucune démo pour le moment.</p>`
        }
      </div>
      <script>
        (function(){
          const drop = document.getElementById('dropzone');
          const input = document.getElementById('zip');
          if (drop && input) {
            ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
            ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
            drop.addEventListener('drop', e => {
              const files = e.dataTransfer && e.dataTransfer.files;
              if (files && files[0]) input.files = files;
            });
          }
          document.querySelectorAll('[data-copy]').forEach(btn => {
            btn.addEventListener('click', async () => {
              const text = btn.getAttribute('data-copy') || '';
              try { await navigator.clipboard.writeText(text); btn.textContent = 'Copié !'; setTimeout(() => btn.textContent = 'Copier', 1200); }
              catch { prompt('Copiez ce lien :', text); }
            });
          });
        })();
      </script>`;

    res.type("html").send(layout({ title: "Démos", body, csrfToken: session.csrfToken }));
  });

  router.post(
    "/demos/upload",
    requireAdmin,
    (req, res, next) => {
      upload.single("zip")(req, res, (err) => {
        if (err) {
          const msg =
            err.code === "LIMIT_FILE_SIZE"
              ? "ZIP trop volumineux (max 20 Mo)."
              : err.message || "Échec de l’upload.";
          return res.redirect(302, `/admin/demos?err=${encodeURIComponent(msg)}`);
        }
        return next();
      });
    },
    requireCsrf,
    async (req, res) => {
      try {
        if (!req.file?.buffer) {
          throw new DemoZipError("Choisissez un fichier ZIP.");
        }
        const original = String(req.file.originalname || "").toLowerCase();
        if (!original.endsWith(".zip") && req.file.mimetype !== "application/zip" && req.file.mimetype !== "application/x-zip-compressed") {
          // still try if buffer looks like zip; otherwise reject soft
          if (req.file.buffer[0] !== 0x50 || req.file.buffer[1] !== 0x4b) {
            throw new DemoZipError("Le fichier doit être un .zip.");
          }
        }
        const { slug } = await publishDemoFromZip(req.file.buffer, {
          name: req.body?.name,
          daysValid: Number(req.body?.days) || 30,
        });
        return res.redirect(302, `/admin/demos?uploaded=${encodeURIComponent(slug)}`);
      } catch (err) {
        const msg = err instanceof DemoZipError ? err.message : "Erreur serveur lors de la publication.";
        console.error("Publication démo :", err);
        return res.redirect(302, `/admin/demos?err=${encodeURIComponent(msg)}`);
      }
    }
  );

  router.post(
    "/demos/:slug/extend",
    express.urlencoded({ extended: false }),
    requireCsrf,
    (req, res) => {
      const meta = extendDemo(req.params.slug, 30);
      if (!meta) {
        return res.redirect(302, `/admin/demos?err=${encodeURIComponent("Démo introuvable.")}`);
      }
      return res.redirect(302, "/admin/demos");
    }
  );

  router.post(
    "/demos/:slug/delete",
    express.urlencoded({ extended: false }),
    requireCsrf,
    (req, res) => {
      deleteDemo(req.params.slug);
      return res.redirect(302, "/admin/demos");
    }
  );

  return router;
}
