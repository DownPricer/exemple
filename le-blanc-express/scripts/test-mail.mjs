/**
 * Test SMTP réel — envoie un message à CONTACT_TO.
 * Usage sur le VPS : npm run test:mail
 */
import "dotenv/config";
import {
  createTransport,
  describeSmtpFailure,
  formatSmtpError,
  isMailConfigured,
  mailConfig,
} from "../server/mail.js";
import { logMissingEnvOnStartup, missingEnvKeys } from "../server/env.js";

const missing = missingEnvKeys();
if (missing.length) {
  console.error("Variables manquantes ou vides :", missing.join(", "));
  process.exit(1);
}

logMissingEnvOnStartup();

if (!isMailConfigured()) {
  process.exit(1);
}

const transport = createTransport();
const { contactTo, mailFrom } = mailConfig();

const subject = `[Test SiteReady] Configuration SMTP — ${new Date().toISOString()}`;
const text = [
  "Ceci est un e-mail de test automatique (npm run test:mail).",
  "",
  "Si vous le recevez, SMTP_HOST, SMTP_PORT, SMTP_USER et MAIL_FROM sont cohérents.",
  "",
  `Horodatage serveur : ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
].join("\n");

try {
  await transport.verify();
} catch (error) {
  console.error("Échec de la connexion SMTP :");
  console.error(describeSmtpFailure(error));
  console.error(formatSmtpError(error));
  process.exit(1);
}

try {
  const info = await transport.sendMail({
    from: mailFrom,
    to: contactTo,
    subject,
    text,
  });
  console.log("envoyé");
  if (info.messageId) console.log("messageId:", info.messageId);
  console.log("destinataire:", contactTo);
} catch (error) {
  console.error("Échec de l'envoi :");
  console.error(describeSmtpFailure(error));
  console.error(formatSmtpError(error));
  process.exit(1);
}
