/**
 * Test d'envoi (notification + confirmation). À lancer sur le serveur avec .env complet :
 *   node scripts/test-contact-email.mjs
 */
import "dotenv/config";
import nodemailer from "nodemailer";

const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "CONTACT_TO", "MAIL_FROM"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Variables manquantes :", missing.join(", "));
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const testEmail = process.env.TEST_CLIENT_EMAIL;
if (!testEmail) {
  console.error("Définissez TEST_CLIENT_EMAIL pour tester la confirmation client.");
  process.exit(1);
}

const payload = {
  name: "Test SiteReady",
  activity: "Plombier",
  city: "Privas",
  email: testEmail,
  preferredStyle: "Dynamique",
};

const subject = `Nouvelle demande — ${payload.name} (${payload.activity}, ${payload.city})`;
const text = [
  `Date : ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
  `Nom : ${payload.name}`,
  `Activité : ${payload.activity}`,
  `Ville : ${payload.city}`,
  `Style préféré : ${payload.preferredStyle}`,
].join("\n");

await transport.sendMail({
  from: process.env.MAIL_FROM,
  to: process.env.CONTACT_TO,
  replyTo: testEmail,
  subject,
  text,
});
console.log("OK notification →", process.env.CONTACT_TO);

const delay = process.env.CONTACT_RECONTACT_DELAY || "48 heures";
await transport.sendMail({
  from: process.env.MAIL_FROM,
  to: testEmail,
  replyTo: process.env.CONTACT_REPLY_TO || process.env.CONTACT_TO,
  subject: "Votre demande est bien reçue — SiteReady",
  text: `Bonjour ${payload.name},\n\nmerci pour votre message. Nous revenons vers vous sous ${delay} avec votre maquette et votre devis, gratuitement.`,
});
console.log("OK confirmation →", testEmail);
