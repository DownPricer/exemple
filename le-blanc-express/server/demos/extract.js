import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import yauzl from "yauzl";
import {
  ALLOWED_EXTENSIONS,
  DEMO_META_FILENAME,
  MAX_FILE_BYTES,
  MAX_FILES,
  MAX_UNCOMPRESSED_TOTAL,
  MAX_ZIP_BYTES,
  getDemosDir,
} from "./paths.js";
import { demoDir, randomSlug, writeMeta } from "./store.js";

export class DemoZipError extends Error {
  constructor(message) {
    super(message);
    this.name = "DemoZipError";
  }
}

function openZip(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (err, zipfile) => {
      if (err) reject(err);
      else resolve(zipfile);
    });
  });
}

function shouldIgnoreEntry(entryName) {
  const normalized = entryName.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.some((p) => p === "__MACOSX" || p === ".git" || p === ".env")) return true;
  if (parts.some((p) => p.startsWith(".") || p === ".DS_Store")) return true;
  if (parts[parts.length - 1] === DEMO_META_FILENAME) return true;
  return false;
}

function assertSafeRelativePath(entryName) {
  const raw = entryName.replace(/\\/g, "/");
  if (!raw || raw.endsWith("/")) return null;
  if (path.isAbsolute(raw) || raw.startsWith("/") || /^[a-zA-Z]:/.test(raw)) {
    throw new DemoZipError("Chemin absolu refusé dans le ZIP.");
  }
  if (raw.includes("\0")) {
    throw new DemoZipError("Chemin invalide dans le ZIP.");
  }
  const parts = raw.split("/");
  if (parts.some((p) => p === ".." || p === "")) {
    throw new DemoZipError("Chemin « .. » ou invalide refusé (zip slip).");
  }
  return path.join(...parts);
}

function isSymlinkEntry(entry) {
  // Unix symlink: upper 4 bits of external file attributes (>> 16) & 0xf000 === 0xa000
  const mode = (entry.externalFileAttributes >>> 16) & 0xffff;
  if ((mode & 0xf000) === 0xa000) return true;
  // DOS attribute bit for symlink is uncommon; also reject if versionMadeBy suggests link
  return Boolean(entry.isSymbolicLink);
}

function assertAllowedFile(relPath) {
  const base = path.basename(relPath);
  if (base === DEMO_META_FILENAME) {
    throw new DemoZipError("Fichier meta.json réservé — refusez ce ZIP.");
  }
  const ext = path.extname(base).toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new DemoZipError(
      `Extension non autorisée : ${ext || "(aucune)"} (${base}). ZIP refusé.`
    );
  }
}

function openReadStream(zipfile, entry) {
  return new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (err, stream) => {
      if (err) reject(err);
      else resolve(stream);
    });
  });
}

async function extractZipToDir(buffer, destDir) {
  const zipfile = await openZip(buffer);
  let totalBytes = 0;
  let fileCount = 0;

  await new Promise((resolve, reject) => {
    zipfile.readEntry();
    zipfile.on("entry", async (entry) => {
      try {
        const name = entry.fileName.replace(/\\/g, "/");
        if (/\/$/.test(name) || entry.fileName.endsWith("/")) {
          zipfile.readEntry();
          return;
        }
        if (shouldIgnoreEntry(name)) {
          zipfile.readEntry();
          return;
        }
        if (isSymlinkEntry(entry)) {
          throw new DemoZipError("Liens symboliques refusés dans le ZIP.");
        }
        const rel = assertSafeRelativePath(name);
        if (!rel) {
          zipfile.readEntry();
          return;
        }
        assertAllowedFile(rel);

        const uncompressed = Number(entry.uncompressedSize) || 0;
        if (uncompressed > MAX_FILE_BYTES) {
          throw new DemoZipError(
            `Fichier trop volumineux (> ${MAX_FILE_BYTES / (1024 * 1024)} Mo) : ${rel}`
          );
        }
        if (totalBytes + uncompressed > MAX_UNCOMPRESSED_TOTAL) {
          throw new DemoZipError(
            `Taille décompressée totale > ${MAX_UNCOMPRESSED_TOTAL / (1024 * 1024)} Mo.`
          );
        }
        fileCount += 1;
        if (fileCount > MAX_FILES) {
          throw new DemoZipError(`Trop de fichiers (> ${MAX_FILES}).`);
        }

        const destRoot = path.resolve(destDir);
        const target = path.resolve(destDir, rel);
        if (!target.startsWith(destRoot + path.sep)) {
          throw new DemoZipError("Chemin sortant du dossier cible (zip slip).");
        }

        fs.mkdirSync(path.dirname(target), { recursive: true });
        const readStream = await openReadStream(zipfile, entry);
        let written = 0;
        readStream.on("data", (chunk) => {
          written += chunk.length;
          if (written > MAX_FILE_BYTES || totalBytes + written > MAX_UNCOMPRESSED_TOTAL) {
            readStream.destroy(
              new DemoZipError("Limite de taille dépassée pendant l’extraction.")
            );
          }
        });
        try {
          await pipeline(readStream, createWriteStream(target));
        } catch (pipeErr) {
          try {
            fs.unlinkSync(target);
          } catch {
            /* ignore */
          }
          throw pipeErr;
        }
        totalBytes += written;

        const st = fs.lstatSync(target);
        if (st.isSymbolicLink()) {
          fs.unlinkSync(target);
          throw new DemoZipError("Lien symbolique détecté après extraction — refusé.");
        }

        zipfile.readEntry();
      } catch (err) {
        try {
          zipfile.close();
        } catch {
          /* ignore */
        }
        reject(err);
      }
    });
    zipfile.on("end", resolve);
    zipfile.on("error", reject);
  });

  return { fileCount, totalBytes };
}

function flattenSingleParent(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.name !== DEMO_META_FILENAME);
  if (entries.length !== 1 || !entries[0].isDirectory()) return;
  const only = entries[0].name;
  if (only.startsWith(".") || only === "__MACOSX") return;
  if (fs.existsSync(path.join(dir, "index.html")) || fs.existsSync(path.join(dir, "index.htm"))) {
    return;
  }
  const nested = path.join(dir, only);
  if (!fs.existsSync(path.join(nested, "index.html")) && !fs.existsSync(path.join(nested, "index.htm"))) {
    return;
  }
  const tmp = path.join(dir, `.__flatten_${Date.now()}`);
  fs.renameSync(nested, tmp);
  for (const name of fs.readdirSync(tmp)) {
    fs.renameSync(path.join(tmp, name), path.join(dir, name));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

function assertIndexPresent(dir) {
  if (!fs.existsSync(path.join(dir, "index.html")) && !fs.existsSync(path.join(dir, "index.htm"))) {
    throw new DemoZipError("index.html obligatoire à la racine de la maquette.");
  }
}

/**
 * Extract validated zip buffer into a new demo slug folder.
 * @returns {{ slug: string, meta: object }}
 */
export async function publishDemoFromZip(buffer, { name, daysValid = 30 }) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new DemoZipError("Fichier ZIP manquant.");
  }
  if (buffer.length > MAX_ZIP_BYTES) {
    throw new DemoZipError(`ZIP trop volumineux (max ${MAX_ZIP_BYTES / (1024 * 1024)} Mo).`);
  }

  const prospectName = String(name || "").trim();
  if (!prospectName || prospectName.length > 120) {
    throw new DemoZipError("Indiquez un nom de prospect (max 120 caractères).");
  }

  const validDays = [7, 30, 90].includes(Number(daysValid)) ? Number(daysValid) : 30;
  const demosRoot = getDemosDir();
  fs.mkdirSync(demosRoot, { recursive: true });

  // Staging dans le même volume que le dossier final → rename atomique (pas d’EXDEV).
  const tmpRoot = fs.mkdtempSync(path.join(demosRoot, ".tmp-"));
  try {
    await extractZipToDir(buffer, tmpRoot);
    flattenSingleParent(tmpRoot);
    assertIndexPresent(tmpRoot);

    let slug = randomSlug(12);
    let attempts = 0;
    while (fs.existsSync(demoDir(slug)) && attempts < 5) {
      slug = randomSlug(12);
      attempts += 1;
    }
    if (fs.existsSync(demoDir(slug))) {
      throw new DemoZipError("Impossible de générer un identifiant unique. Réessayez.");
    }

    const finalDir = demoDir(slug);
    fs.renameSync(tmpRoot, finalDir);

    const now = new Date();
    const meta = {
      name: prospectName,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000).toISOString(),
      daysValid: validDays,
    };
    writeMeta(slug, meta);
    return { slug, meta };
  } catch (err) {
    try {
      if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (err instanceof DemoZipError) throw err;
    throw new DemoZipError(err?.message || "Échec du traitement du ZIP.");
  }
}
