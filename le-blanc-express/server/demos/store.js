import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DEMO_META_FILENAME, getDemosDir } from "./paths.js";

export function ensureDemosDir() {
  const dir = getDemosDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function randomSlug(length = 12) {
  // base64url → 16 chars from 12 bytes; slice to length
  return crypto.randomBytes(Math.ceil((length * 3) / 4)).toString("base64url").slice(0, length);
}

export function demoDir(slug) {
  return path.join(getDemosDir(), slug);
}

export function metaPath(slug) {
  return path.join(demoDir(slug), DEMO_META_FILENAME);
}

export function readMeta(slug) {
  const file = metaPath(slug);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function writeMeta(slug, meta) {
  fs.writeFileSync(metaPath(slug), JSON.stringify(meta, null, 2), "utf8");
}

export function isExpired(meta, now = Date.now()) {
  if (!meta?.expiresAt) return true;
  return new Date(meta.expiresAt).getTime() <= now;
}

export function listDemos() {
  ensureDemosDir();
  const root = getDemosDir();
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const demos = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    const meta = readMeta(entry.name);
    if (!meta) continue;
    demos.push({
      slug: entry.name,
      name: meta.name || entry.name,
      createdAt: meta.createdAt,
      expiresAt: meta.expiresAt,
      expired: isExpired(meta),
    });
  }
  demos.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return demos;
}

export function deleteDemo(slug) {
  const dir = demoDir(slug);
  if (!fs.existsSync(dir)) return false;
  fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

export function extendDemo(slug, days = 30) {
  const meta = readMeta(slug);
  if (!meta) return null;
  const base = Math.max(Date.now(), new Date(meta.expiresAt).getTime());
  meta.expiresAt = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
  writeMeta(slug, meta);
  return meta;
}

export function cleanupExpiredDemos() {
  ensureDemosDir();
  const root = getDemosDir();
  let removed = 0;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    // Dossiers de staging abandonnés (.tmp-…)
    if (entry.name.startsWith(".tmp-")) {
      fs.rmSync(path.join(root, entry.name), { recursive: true, force: true });
      removed += 1;
      continue;
    }
    if (entry.name.startsWith(".")) continue;
    const meta = readMeta(entry.name);
    if (!meta || isExpired(meta)) {
      fs.rmSync(path.join(root, entry.name), { recursive: true, force: true });
      removed += 1;
    }
  }
  if (removed > 0) {
    console.log(`Nettoyage démos : ${removed} dossier(s) expiré(s) ou invalide(s) supprimé(s).`);
  }
  return removed;
}

export function startDemoCleanupScheduler() {
  cleanupExpiredDemos();
  const dayMs = 24 * 60 * 60 * 1000;
  setInterval(() => {
    try {
      cleanupExpiredDemos();
    } catch (err) {
      console.error("Échec nettoyage démos :", err);
    }
  }, dayMs).unref?.();
}
