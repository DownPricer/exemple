#!/usr/bin/env node
/**
 * Génère un hash bcrypt pour ADMIN_PASSWORD_HASH.
 * Usage: node scripts/hash-admin-password.mjs "votre-mot-de-passe"
 *    ou: node scripts/hash-admin-password.mjs   (saisie interactive)
 */
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rounds = 12;

async function main() {
  let password = process.argv[2];
  if (!password) {
    const rl = readline.createInterface({ input, output });
    password = await rl.question("Mot de passe admin : ");
    rl.close();
  }
  if (!password || !String(password).trim()) {
    console.error("Mot de passe vide — abandon.");
    process.exit(1);
  }
  const hash = await bcrypt.hash(String(password), rounds);
  console.log("\nAjoutez dans votre .env :\n");
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log("\n(Ne committez jamais le mot de passe en clair.)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
