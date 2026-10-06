import nodemailer from "nodemailer";
import { missingEnvKeys, REQUIRED_MAIL_ENV } from "./env.js";

export function isMailConfigured() {
  return missingEnvKeys(REQUIRED_MAIL_ENV).length === 0;
}

export function createTransport() {
  if (!isMailConfigured()) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export function mailConfig() {
  return {
    contactTo: String(process.env.CONTACT_TO ?? "").trim(),
    mailFrom: String(process.env.MAIL_FROM ?? "").trim(),
    replyTo: String(process.env.CONTACT_REPLY_TO ?? "").trim(),
    recontactDelay: String(process.env.CONTACT_RECONTACT_DELAY ?? "").trim(),
    publicEmail: String(process.env.CONTACT_PUBLIC_EMAIL ?? "").trim(),
  };
}

/** Supprime les retours à la ligne pour les en-têtes MIME (injection). */
export function sanitizeHeader(value) {
  if (value == null) return "";
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

export function sanitizeEmail(value) {
  const s = sanitizeHeader(value);
  if (!s || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "";
  return s;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

export function formatPlan(plan) {
  const key = String(plan || "").trim();
  return PLAN_LABELS[key] || key || "—";
}

export function formatSubmissionDate() {
  return new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  });
}

export function buildAdminNotification(data) {
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

export function buildClientConfirmation(data, recontactDelay, replyTo) {
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

/** Détail exploitable pour les logs et le script test:mail. */
export function formatSmtpError(error) {
  if (!error) return "Erreur SMTP inconnue.";
  const parts = [];
  if (error.message) parts.push(error.message);
  if (error.code) parts.push(`code=${error.code}`);
  if (error.responseCode) parts.push(`responseCode=${error.responseCode}`);
  if (error.command) parts.push(`command=${error.command}`);
  if (error.response) parts.push(`response=${String(error.response).trim()}`);
  if (error.errno) parts.push(`errno=${error.errno}`);
  if (error.syscall) parts.push(`syscall=${error.syscall}`);
  return parts.length ? parts.join(" | ") : String(error);
}

export function describeSmtpFailure(error) {
  const detail = formatSmtpError(error);
  const code = error?.code || "";
  const response = String(error?.response || "").toLowerCase();
  const msg = String(error?.message || "").toLowerCase();

  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ENOTFOUND") {
    return `Connexion SMTP impossible (${detail}). Vérifiez SMTP_HOST, SMTP_PORT et le pare-feu du VPS.`;
  }
  if (code === "EAUTH" || response.includes("authentication") || response.includes("535")) {
    return `Identifiants SMTP refusés (${detail}). Vérifiez SMTP_USER et SMTP_PASS.`;
  }
  if (
    response.includes("sender") ||
    response.includes("from") ||
    response.includes("550") ||
    msg.includes("sender")
  ) {
    return `Adresse expéditeur refusée (${detail}). MAIL_FROM doit correspondre à une adresse autorisée par votre hébergeur (souvent identique à SMTP_USER).`;
  }
  if (code === "ESOCKET" || msg.includes("wrong version number") || msg.includes("ssl")) {
    return `Problème TLS/SSL (${detail}). Essayez SMTP_SECURE=false avec le port 587, ou SMTP_SECURE=true avec le port 465.`;
  }
  return detail;
}

export function logSmtpError(context, error) {
  console.error(`Erreur envoi e-mail ${context}: ${formatSmtpError(error)}`);
}
