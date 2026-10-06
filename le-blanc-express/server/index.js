import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

function unavailableMessage(publicEmail) {
  if (publicEmail) {
    return `L’envoi est momentanément indisponible. Écrivez-nous à ${publicEmail}.`;
  }
  return "L’envoi est momentanément indisponible. Réessayez plus tard ou contactez-nous par un autre canal.";
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
    await transport.sendMail({
      from: mailFrom,
      to: contactTo,
      replyTo: clientReplyTo || undefined,
      subject: adminMail.subject,
      text: adminMail.text,
    });
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

app.use(express.static(publicDir));

app.get(["/elegant", "/elegant/*"], (req, res, next) => {
  if (path.extname(req.path)) {
    return next();
  }
  res.sendFile(path.join(publicDir, "elegant", "index.html"), (err) => {
    if (err) next(err);
  });
});

app.get(["/minimal", "/minimal/*"], (req, res, next) => {
  if (path.extname(req.path)) {
    return next();
  }
  res.sendFile(path.join(publicDir, "minimal", "index.html"), (err) => {
    if (err) next(err);
  });
});

app.get(["/anime", "/anime/*"], (req, res, next) => {
  if (path.extname(req.path)) {
    return next();
  }
  res.sendFile(path.join(publicDir, "anime", "index.html"), (err) => {
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
  if (req.path.startsWith("/minimal")) {
    return next();
  }
  if (req.path.startsWith("/anime")) {
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
