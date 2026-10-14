/**
 * Tests locaux de la feature démos (sans Docker).
 * Prérequis : serveur lancé avec ADMIN_PASSWORD_HASH + DEMOS_DIR.
 *
 * Usage:
 *   node scripts/hash-admin-password.mjs "test-admin-pass"
 *   # .env : ADMIN_PASSWORD_HASH=... SESSION_SECRET=test SECRET
 *   DEMOS_DIR=./data/demos-test ADMIN_PASSWORD_HASH=... SESSION_SECRET=x node server/index.js
 *   node scripts/test-demos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const password = process.env.TEST_ADMIN_PASSWORD || "test-admin-pass";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function curl(args) {
  const r = spawnSync("curl", ["-sS", ...args], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  if (r.error) throw r.error;
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

/** Minimal ZIP writer (store method) for fixtures */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function zipStore(files) {
  // files: [{ name, data: Buffer|string }]
  const locals = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, "utf8");
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    const cen = Buffer.alloc(46 + name.length);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0, 8);
    cen.writeUInt16LE(0, 10);
    cen.writeUInt16LE(0, 12);
    cen.writeUInt16LE(0, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(data.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt16LE(0, 30);
    cen.writeUInt16LE(0, 32);
    cen.writeUInt16LE(0, 34);
    cen.writeUInt16LE(0, 36);
    cen.writeUInt32LE(0, 38);
    cen.writeUInt32LE(offset, 42);
    name.copy(cen, 46);
    locals.push(Buffer.concat([local, data]));
    central.push(cen);
    offset += local.length + data.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralBuf, end]);
}

function writeFixture(name, buf) {
  const dir = path.join(root, "data", "test-fixtures");
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, name);
  fs.writeFileSync(p, buf);
  return p;
}

async function main() {
  console.log(`Base URL: ${base}`);

  // 1) /admin/demos sans cookie → redirect login
  {
    const r = curl(["-o", "NUL", "-w", "%{http_code} %{redirect_url}", `${base}/admin/demos`]);
    // On Windows curl -o NUL ; redirect_url may be empty with -L off
    const code = curl(["-sS", "-o", "NUL", "-w", "%{http_code}", `${base}/admin/demos`]).stdout.trim();
    assert(code === "302", `Attendu 302 vers login, reçu ${code}`);
    const loc = curl(["-sS", "-I", `${base}/admin/demos`]).stdout;
    assert(/\/admin\/login/i.test(loc), "Location doit pointer vers /admin/login");
    console.log("OK  /admin/demos sans auth → 302 login");
  }

  // 2) 6 mauvais mots de passe → blocage
  {
    for (let i = 0; i < 6; i++) {
      curl([
        "-sS",
        "-o",
        "NUL",
        "-c",
        "NUL",
        "-b",
        "NUL",
        "-X",
        "POST",
        "-d",
        "password=wrong-password-xyz",
        `${base}/admin/login`,
      ]);
    }
    const page = curl([`${base}/admin/login`]).stdout;
    assert(/bloqué|15 minutes|Trop de tentatives/i.test(page), "Page login doit indiquer le blocage");
    console.log("OK  6 mauvais mots de passe → blocage temporaire");
  }

  // Note: IP is blocked now — tests that need login should use a note or restart.
  // For upload tests we call the extract module directly + HTTP for public demos.

  const { publishDemoFromZip, DemoZipError } = await import("../server/demos/extract.js");
  const { cleanupExpiredDemos, readMeta, writeMeta, demoDir } = await import(
    "../server/demos/store.js"
  );

  // Valid zip
  const validZip = zipStore([
    {
      name: "index.html",
      data: "<!DOCTYPE html><html><head><link rel=stylesheet href=style.css></head><body><h1>Demo</h1><img src=pic.png alt=x></body></html>",
    },
    { name: "style.css", data: "h1{color:teal}" },
    { name: "pic.png", data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]) },
  ]);
  writeFixture("valid.zip", validZip);

  const published = await publishDemoFromZip(validZip, { name: "Garage Test", daysValid: 30 });
  const demoUrl = `${base}/demo/${published.slug}/`;
  {
    const html = curl([demoUrl]).stdout;
    assert(/Demo/.test(html), "index.html démo doit s’afficher");
    assert(/siteready-demo-banner/.test(html), "Bandeau SiteReady attendu");
    const cssCode = curl(["-sS", "-o", "NUL", "-w", "%{http_code}", `${demoUrl}style.css`]).stdout.trim();
    assert(cssCode === "200", `CSS doit charger (200), reçu ${cssCode}`);
    const imgCode = curl(["-sS", "-o", "NUL", "-w", "%{http_code}", `${demoUrl}pic.png`]).stdout.trim();
    assert(imgCode === "200", `Image doit charger (200), reçu ${imgCode}`);
    console.log("OK  ZIP valide → lien, CSS et image OK");
  }

  // Security headers
  {
    const headers = curl(["-sS", "-I", demoUrl]).stdout.toLowerCase();
    assert(headers.includes("content-security-policy:") && headers.includes("sandbox"), "CSP sandbox");
    assert(headers.includes("x-robots-tag:") && headers.includes("noindex"), "X-Robots-Tag");
    assert(headers.includes("x-content-type-options:") && headers.includes("nosniff"), "nosniff");
    assert(headers.includes("referrer-policy:") && headers.includes("no-referrer"), "Referrer-Policy");
    console.log("OK  curl -I → 4 en-têtes de sécurité");
  }

  // 404 vrai pour fichier manquant
  {
    const code = curl([
      "-sS",
      "-o",
      "NUL",
      "-w",
      "%{http_code}",
      `${demoUrl}nexistepas.css`,
    ]).stdout.trim();
    assert(code === "404", `Fichier inexistant → 404, reçu ${code}`);
    console.log("OK  /demo/<slug>/nexistepas.css → 404");
  }

  // slug bidon
  {
    const body = curl([`${base}/demo/slugbidon/`]).stdout;
    assert(/n’est plus disponible|n'est plus disponible|plus disponible/i.test(body), "Page indisponible");
    console.log("OK  /demo/slugbidon/ → plus disponible");
  }

  // Zip slip
  {
    const slip = zipStore([{ name: "../test.txt", data: "pwned" }]);
    let refused = false;
    try {
      await publishDemoFromZip(slip, { name: "slip", daysValid: 7 });
    } catch (e) {
      refused = e instanceof DemoZipError;
    }
    assert(refused, "Zip slip doit être refusé");
    console.log("OK  ZIP avec ../test.txt → refusé");
  }

  // .php
  {
    const bad = zipStore([
      { name: "index.html", data: "<html></html>" },
      { name: "shell.php", data: "<?php" },
    ]);
    let refused = false;
    try {
      await publishDemoFromZip(bad, { name: "php", daysValid: 7 });
    } catch (e) {
      refused = e instanceof DemoZipError;
    }
    assert(refused, "ZIP avec .php doit être refusé");
    console.log("OK  ZIP avec .php → refusé");
  }

  // > 20 Mo
  {
    const big = Buffer.alloc(20 * 1024 * 1024 + 10, 1);
    // not a real zip — size check first
    let refused = false;
    try {
      await publishDemoFromZip(big, { name: "big", daysValid: 7 });
    } catch (e) {
      refused = e instanceof DemoZipError && /volumineux/i.test(e.message);
    }
    assert(refused, "ZIP > 20 Mo doit être refusé");
    console.log("OK  ZIP > 20 Mo → refusé");
  }

  // sans index.html
  {
    const noIndex = zipStore([{ name: "style.css", data: "body{}" }]);
    let refused = false;
    try {
      await publishDemoFromZip(noIndex, { name: "noindex", daysValid: 7 });
    } catch (e) {
      refused = e instanceof DemoZipError && /index\.html/i.test(e.message);
    }
    assert(refused, "ZIP sans index.html doit être refusé");
    console.log("OK  ZIP sans index.html → refusé");
  }

  // Expiration + cleanup
  {
    const meta = readMeta(published.slug);
    meta.expiresAt = new Date(Date.now() - 60_000).toISOString();
    writeMeta(published.slug, meta);
    const body = curl([demoUrl]).stdout;
    assert(/plus disponible/i.test(body), "Démo expirée inaccessible");
    cleanupExpiredDemos();
    assert(!fs.existsSync(demoDir(published.slug)), "Démo expirée supprimée au nettoyage");
    console.log("OK  démo expirée → inaccessible + nettoyage");
  }

  // robots.txt
  {
    const robots = curl([`${base}/robots.txt`]).stdout;
    assert(/Disallow:\s*\/demo\//i.test(robots), "robots Disallow /demo/");
    assert(/Disallow:\s*\/admin\//i.test(robots), "robots Disallow /admin/");
    console.log("OK  robots.txt Disallow /demo/ et /admin/");
  }

  // contact API still up
  {
    const code = curl([
      "-sS",
      "-o",
      "NUL",
      "-w",
      "%{http_code}",
      "-H",
      "Content-Type: application/json",
      "-d",
      '{"name":"t","activity":"x","email":"bad","consent":false}',
      `${base}/api/contact`,
    ]).stdout.trim();
    assert(code === "400", `Formulaire contact toujours actif (400 validation), reçu ${code}`);
    console.log("OK  /api/contact répond toujours");
  }

  console.log("\nTous les tests automatisés locaux ont réussi.");
  console.log("À vérifier manuellement après déploiement : document.cookie vide dans une démo, persistance volume Docker.");
}

main().catch((err) => {
  console.error("\nÉCHEC:", err.message);
  process.exit(1);
});
