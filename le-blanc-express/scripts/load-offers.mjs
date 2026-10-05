import fs from "node:fs";
import path from "node:path";

export function loadOffers(rootDir) {
  const filePath = path.join(rootDir, "public", "assets", "js", "offers-shared.js");
  const text = fs.readFileSync(filePath, "utf8");
  const match = text.match(/window\.SITE_OFFERS\s*=\s*(\{[\s\S]*?\n\});/);
  if (!match) {
    throw new Error("SITE_OFFERS introuvable dans offers-shared.js");
  }
  return Function(`"use strict";return (${match[1]})`)();
}
