/** Variables obligatoires pour l’envoi du formulaire (noms uniquement, jamais les valeurs). */
export const REQUIRED_MAIL_ENV = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "CONTACT_TO",
  "MAIL_FROM",
  "CONTACT_PUBLIC_EMAIL",
  "CONTACT_REPLY_TO",
  "CONTACT_RECONTACT_DELAY",
];

export function missingEnvKeys(keys = REQUIRED_MAIL_ENV) {
  return keys.filter((key) => {
    const value = process.env[key];
    return value == null || String(value).trim() === "";
  });
}

export function logMissingEnvOnStartup() {
  const missing = missingEnvKeys();
  if (missing.length === 0) {
    console.log("Configuration e-mail : toutes les variables requises sont définies.");
    return missing;
  }
  console.warn(
    "Configuration e-mail incomplète — variables manquantes ou vides :",
    missing.join(", ")
  );
  console.warn("Le formulaire renverra une erreur tant que SMTP et CONTACT_TO ne sont pas renseignés.");
  return missing;
}
