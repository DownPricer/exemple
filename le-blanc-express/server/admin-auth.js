import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const SESSION_COOKIE = "sr_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

/** @type {Map<string, { csrfToken: string, expiresAt: number }>} */
const sessions = new Map();

/** @type {Map<string, { count: number, resetAt: number }>} */
const loginAttempts = new Map();

function sessionSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD_HASH ||
    "dev-insecure-session-secret"
  );
}

function signSessionId(sessionId) {
  const sig = crypto.createHmac("sha256", sessionSecret()).update(sessionId).digest("hex");
  return `${sessionId}.${sig}`;
}

function verifySignedCookie(value) {
  if (!value || typeof value !== "string") return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const sessionId = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = crypto.createHmac("sha256", sessionSecret()).update(sessionId).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return sessionId;
}

function pruneSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
}

export function getClientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) {
    return xf.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function isLoginBlocked(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() >= entry.resetAt) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= LOGIN_MAX_ATTEMPTS;
}

export function recordLoginFailure(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now >= entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearLoginFailures(ip) {
  loginAttempts.delete(ip);
}

export function loginAttemptsRemaining(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry || Date.now() >= entry.resetAt) return LOGIN_MAX_ATTEMPTS;
  return Math.max(0, LOGIN_MAX_ATTEMPTS - entry.count);
}

export async function verifyAdminPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash || !password) return false;
  try {
    return await bcrypt.compare(String(password), hash);
  } catch {
    return false;
  }
}

export function createSession(res, req) {
  pruneSessions();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const csrfToken = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, {
    csrfToken,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  const secure =
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.get("x-forwarded-proto") === "https";
  res.cookie(SESSION_COOKIE, signSessionId(sessionId), {
    httpOnly: true,
    secure,
    sameSite: "strict",
    maxAge: SESSION_TTL_MS,
    path: "/admin",
  });
  return { sessionId, csrfToken };
}

export function destroySession(req, res) {
  const sessionId = verifySignedCookie(req.cookies?.[SESSION_COOKIE]);
  if (sessionId) sessions.delete(sessionId);
  res.clearCookie(SESSION_COOKIE, { path: "/admin" });
}

export function getSession(req) {
  pruneSessions();
  const sessionId = verifySignedCookie(req.cookies?.[SESSION_COOKIE]);
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    if (sessionId) sessions.delete(sessionId);
    return null;
  }
  return { sessionId, ...session };
}

export function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.redirect(302, "/admin/login");
  }
  req.adminSession = session;
  return next();
}

export function requireCsrf(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(403).type("html").send("Session expirée. <a href=\"/admin/login\">Reconnectez-vous</a>.");
  }
  const token = req.body?.csrf || req.get("x-csrf-token");
  if (!token || token !== session.csrfToken) {
    return res.status(403).type("html").send("Jeton CSRF invalide. Rechargez la page et réessayez.");
  }
  req.adminSession = session;
  return next();
}

export { SESSION_COOKIE, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS };
