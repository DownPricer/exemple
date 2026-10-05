import fs from "node:fs";
import path from "node:path";

export function loadContent(rootDir) {
  const filePath = path.join(rootDir, "public", "assets", "js", "content.js");
  const text = fs.readFileSync(filePath, "utf8");
  const match = text.match(/window\.SITE_CONTENT\s*=\s*(\{[\s\S]*?\n\});/);
  if (!match) {
    throw new Error("SITE_CONTENT introuvable dans content.js");
  }
  return Function(`"use strict";return (${match[1]})`)();
}
