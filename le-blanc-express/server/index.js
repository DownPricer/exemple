import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const port = Number(process.env.PORT) || 3001;

const app = express();
app.set("trust proxy", 1);
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

function createTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

function mailConfig() {
  const contactTo = process.env.CONTACT_TO || process.env.MAIL_TO;
  const mailFrom = process.env.MAIL_FROM || "SiteReady <noreply@sitereadyshd.fr>";
  const replyTo =
    process.env.CONTACT_REPLY_TO ||
    process.env.MAIL_REPLY_TO ||
    contactTo ||
    "contact@sitereadyshd.fr";
  const recontactDelay = process.env.CONTACT_RECONTACT_DELAY || "48 heures";
  const publicEmail = process.env.CONTACT_PUBLIC_EMAIL || "contact@sitereadyshd.fr";
  return { contactTo, mailFrom, replyTo, recontactDelay, publicEmail };
}

/** Supprime les retours à la ligne pour les en-têtes MIME (injection). */
function sanitizeHeader(value) {
  if (value == null) return "";
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

function sanitizeEmail(value) {
  const s = sanitizeHeader(value);
  if (!s || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "";
  return s;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const PLAN_LABELS = {
  once: "En une fois",
  monthly: "Par mois",
  "sur-mesure": "Sur mesure",
  unknown: "À définir",
  indecis: "À définir",
  essentiel: "Essentiel",
  signature: "Signature",
};

function formatPlan(plan) {
  const key = String(plan || "").trim();
  return PLAN_LABELS[key] || key || "—";
}

function formatSubmissionDate() {
  return new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  });
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

  const phone = isNonEmptyString(body.phone) ? body.phone.trim() : "";
  const email = isNonEmptyString(body.email) ? body.email.trim() : "";

  if (!phone && !email) {
    errors.contact = "Indiquez un numéro de téléphone ou une adresse e-mail.";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

function buildAdminNotification(data) {
  const city = data.city || "—";
  const subject = sanitizeHeader(
    `Nouvelle demande — ${data.name} (${data.activity}, ${city})`
  );

  const lines = [
    `Date : ${formatSubmissionDate()}`,
    `Nom : ${data.name || "—"}`,
    `Entreprise : ${data.company || "—"}`,
    `Activité : ${data.activity || "—"}`,
    `Ville : ${data.city || "—"}`,
    `Téléphone : ${data.phone || "—"}`,
    `E-mail : ${data.email || "—"}`,
    `Déjà un site : ${data.hasWebsite === "yes" ? "Oui" : data.hasWebsite === "no" ? "Non" : "—"}`,
    `Adresse du site : ${data.websiteUrl || "—"}`,
    `Formule envisagée : ${formatPlan(data.plan)}`,
    `Style préféré : ${data.preferredStyle || "—"}`,
    `Message : ${data.message || "—"}`,
  ];

  return {
    subject,
    text: lines.join("\n"),
  };
}

function buildClientConfirmation(data, recontactDelay, replyTo) {
  const name = data.name || "Bonjour";
  const subject = sanitizeHeader("Votre demande est bien reçue — SiteReady");

  const text = [
    `Bonjour ${name},`,
    "",
    `merci pour votre message. Nous revenons vers vous sous ${recontactDelay} avec votre maquette et votre devis, gratuitement.`,
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.",
    "",
    "— SiteReady, sitereadyshd.fr",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 16px;background:#f6f5ef;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.55;color:#173d2e;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px 20px;">
    <p style="margin:0 0 16px;">Bonjour ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">merci pour votre message. Nous revenons vers vous sous <strong>${escapeHtml(recontactDelay)}</strong> avec votre maquette et votre devis, gratuitement.</p>
    <p style="margin:0 0 16px;color:#656f66;font-size:15px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>
    <p style="margin:0;">— SiteReady, <a href="https://sitereadyshd.fr" style="color:#173d2e;">sitereadyshd.fr</a></p>
  </div>
</body>
</html>`;

  return { subject, text, html, replyTo: sanitizeEmail(replyTo) };
}

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
  const transport = createTransport();
  const { contactTo, mailFrom, replyTo, recontactDelay, publicEmail } = mailConfig();

  if (!transport) {
    console.error("SMTP non configuré : définissez SMTP_HOST (et identifiants) dans .env");
    return res.status(503).json({
      ok: false,
      error: `L’envoi est momentanément indisponible. Écrivez-nous à ${publicEmail}.`,
    });
  }

  if (!contactTo) {
    console.error("CONTACT_TO non configuré dans .env");
    return res.status(503).json({
      ok: false,
      error: `L’envoi est momentanément indisponible. Écrivez-nous à ${publicEmail}.`,
    });
  }

  const clientReplyTo = sanitizeEmail(data.email);
  const adminMail = buildAdminNotification(data);

  try {
    await transport.sendMail({
      from: mailFrom,
      to: contactTo,
      replyTo: clientReplyTo || undefined,
      subject: adminMail.subject,
      text: adminMail.text,
    });
  } catch (error) {
    console.error("Erreur envoi e-mail notification (admin):", error);
    return res.status(500).json({
      ok: false,
      error: `L’envoi a échoué. Réessayez ou écrivez-nous à ${publicEmail}.`,
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
      console.error("Erreur envoi e-mail confirmation (client):", error);
    }
  }

  return res.json({ ok: true });
});

app.use(express.static(publicDir));

app.get(["/elegant", "/elegant/*"], (req, res, next) => {
  if (path.extname(req.path)) {
    return next();
  }
  res.sendFile(path.join(publicDir, "elegant", "index.html"), (err) => {
    if (err) next(err);
  });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  if (req.path.startsWith("/elegant")) {
    return next();
  }
  if (path.extname(req.path)) {
    return res.status(404).send("Not found");
  }
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`SiteReady écoute sur le port ${port}`);
});
