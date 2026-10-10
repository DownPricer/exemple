import "dotenv/config";
import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRobotsTxt, buildSitemapXml } from "../scripts/sitemap-xml.mjs";
import { LOCAL_CITY_SLUGS, LOCAL_TRADE_SLUGS } from "../scripts/site-config.mjs";
import { logMissingEnvOnStartup } from "./env.js";
import {
  buildAdminNotification,
  buildClientConfirmation,
  createTransport,
  isMailConfigured,
  logSmtpError,
  mailConfig,
  sanitizeEmail,
} from "./mail.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const port = Number(process.env.PORT) || 3001;

logMissingEnvOnStartup();

const app = express();
// Chaîne : visiteur → downpricer-nginx → client1-static → client1-app (2 proxies).
// Si Cloudflare proxy orange est devant, passer à 3.
app.set("trust proxy", 2);
app.disable("x-powered-by");
app.use(compression());
app.use(express.json({ limit: "32kb" }));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Trop de demandes depuis cette connexion. Réessayez dans une heure.",
  },
});

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeContactPayload(body) {
  return {
    name: isNonEmptyString(body.name) ? body.name.trim() : "",
    company: isNonEmptyString(body.company) ? body.company.trim() : "",
    activity: isNonEmptyString(body.activity) ? body.activity.trim() : "",
    city: isNonEmptyString(body.city) ? body.city.trim() : "",
    phone: isNonEmptyString(body.phone) ? body.phone.trim() : "",
    email: isNonEmptyString(body.email) ? body.email.trim() : "",
    hasWebsite: body.hasWebsite === "yes" ? "yes" : body.hasWebsite === "no" ? "no" : "",
    websiteUrl: isNonEmptyString(body.websiteUrl) ? body.websiteUrl.trim() : "",
    plan: String(body.plan || "").trim(),
    preferredStyle: isNonEmptyString(body.preferredStyle) ? body.preferredStyle.trim() : "—",
    message: isNonEmptyString(body.message) ? body.message.trim() : "",
    consent: body.consent === true || body.consent === "true",
    company_website: isNonEmptyString(body.company_website) ? body.company_website.trim() : "",
  };
}

function validateContact(body) {
  const errors = {};

  if (!isNonEmptyString(body.name)) {
    errors.name = "Indiquez votre nom.";
  }
  if (!isNonEmptyString(body.activity)) {
    errors.activity = "Indiquez votre activité (ex. plombier, boulangerie).";
  }

  const email = isNonEmptyString(body.email) ? body.email.trim() : "";

  if (!email) {
    errors.email = "Indiquez votre adresse e-mail.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Cette adresse e-mail ne semble pas valide.";
  }

  if (body.hasWebsite === "yes" && !isNonEmptyString(body.websiteUrl)) {
    errors.websiteUrl = "Indiquez l’adresse de votre site actuel.";
  }

  if (body.consent !== true && body.consent !== "true") {
    errors.consent = "Veuillez accepter l’utilisation de vos données pour être recontacté.";
  }

  if (isNonEmptyString(body.company_website)) {
    errors._spam = true;
  }

  return errors;
}

function unavailableMessage(publicEmail) {
  if (publicEmail) {
    return `L’envoi est momentanément indisponible. Écrivez-nous à ${publicEmail}.`;
  }
  return "L’envoi est momentanément indisponible. Réessayez plus tard ou contactez-nous par un autre canal.";
}

/** Chemins dont un segment commence par « . », sauf /.well-known/ */
function isHiddenDotPath(urlPath) {
  const parts = String(urlPath || "")
    .split("/")
    .filter(Boolean);
  if (parts[0] === ".well-known") return false;
  return parts.some((part) => part.startsWith("."));
}

function sendNotFound(res) {
  const file = path.join(publicDir, "404.html");
  if (fs.existsSync(file)) {
    return res.status(404).sendFile(file);
  }
  return res
    .status(404)
    .type("html")
    .send(
      "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"UTF-8\"><title>Page introuvable</title></head><body><h1>Page introuvable</h1><p><a href=\"/\">Retour à l’accueil</a></p></body></html>"
    );
}

app.use((req, res, next) => {
  if (isHiddenDotPath(req.path)) {
    return sendNotFound(res);
  }
  return next();
});

app.post("/api/contact", limiter, async (req, res) => {
  const raw = req.body || {};
  const errors = validateContact(raw);

  if (errors._spam) {
    return res.status(200).json({ ok: true });
  }

  if (Object.keys(errors).length > 0) {
    delete errors._spam;
    return res.status(400).json({ ok: false, errors });
  }

  const data = normalizeContactPayload(raw);
  const { contactTo, mailFrom, replyTo, recontactDelay, publicEmail } = mailConfig();
  const transport = createTransport();

  if (!isMailConfigured() || !transport) {
    console.error(
      "Envoi refusé : configuration e-mail incomplète (voir le message au démarrage du serveur)."
    );
    return res.status(503).json({
      ok: false,
      error: unavailableMessage(publicEmail),
    });
  }

  const clientReplyTo = sanitizeEmail(data.email);
  const adminMail = buildAdminNotification(data);

  try {
    const adminResult = await transport.sendMail({
      from: mailFrom,
      to: contactTo,
      replyTo: clientReplyTo || undefined,
      subject: adminMail.subject,
      text: adminMail.text,
    });
    console.log(
      `Notification formulaire envoyée (destinataire admin configuré dans CONTACT_TO, messageId: ${adminResult.messageId || "—"})`
    );
  } catch (error) {
    logSmtpError("notification (admin)", error);
    return res.status(500).json({
      ok: false,
      error: publicEmail
        ? `L’envoi a échoué. Réessayez ou écrivez-nous à ${publicEmail}.`
        : "L’envoi a échoué. Réessayez plus tard.",
    });
  }

  const clientEmail = sanitizeEmail(data.email);
  if (clientEmail) {
    const confirmation = buildClientConfirmation(data, recontactDelay, replyTo);
    try {
      await transport.sendMail({
        from: mailFrom,
        to: clientEmail,
        replyTo: confirmation.replyTo || undefined,
        subject: confirmation.subject,
        text: confirmation.text,
        html: confirmation.html,
      });
    } catch (error) {
      logSmtpError("confirmation (client)", error);
    }
  }

  return res.json({ ok: true });
});

app.get("/sitemap.xml", (_req, res) => {
  res.type("application/xml").send(buildSitemapXml());
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(buildRobotsTxt());
});

const localSlugs = [...LOCAL_CITY_SLUGS, ...LOCAL_TRADE_SLUGS];
for (const slug of localSlugs) {
  app.get(`/${slug}`, (req, res, next) => {
    const file = path.join(publicDir, slug, "index.html");
    if (!fs.existsSync(file)) return next();
    res.sendFile(file, (err) => (err ? next(err) : undefined));
  });
}

app.use(
  "/assets",
  express.static(path.join(publicDir, "assets"), {
    maxAge: "365d",
    immutable: true,
  })
);

app.use(
  express.static(publicDir, {
    maxAge: "1h",
    index: "index.html",
    redirect: true,
    fallthrough: true,
  })
);

// Pages design : uniquement l’index (pas de repli SPA sur les sous-chemins).
for (const dir of ["elegant", "minimal", "anime"]) {
  app.get([`/${dir}`, `/${dir}/`], (req, res, next) => {
    const file = path.join(publicDir, dir, "index.html");
    if (!fs.existsSync(file)) return next();
    res.sendFile(file, (err) => (err ? next(err) : undefined));
  });
}

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  return sendNotFound(res);
});

app.listen(port, () => {
  console.log(`SiteReady écoute sur le port ${port}`);
});
