import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getDemosDir() {
  if (process.env.DEMOS_DIR && String(process.env.DEMOS_DIR).trim()) {
    return path.resolve(process.env.DEMOS_DIR);
  }
  return path.join(__dirname, "..", "..", "data", "demos");
}

export const DEMO_META_FILENAME = "meta.json";

export const MAX_ZIP_BYTES = 20 * 1024 * 1024;
export const MAX_UNCOMPRESSED_TOTAL = 50 * 1024 * 1024;
export const MAX_FILES = 300;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".css",
  ".js",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".mp4",
  ".webm",
  ".txt",
]);
