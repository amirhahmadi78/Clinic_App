import jwt from "jsonwebtoken";
import crypto from "crypto";

const isProd = process.env.NODE_ENV

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
}
export function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn:  "7d",
  });
}

export function verifyAccess(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
export function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// CSRF: یک توکن تصادفی ساده (double-submit)
export function generateCsrfToken() {
  return crypto.randomBytes(24).toString("hex");
}

// تنظیمات کوکی‌ها
export const accessCookieOptions = {
  httpOnly: true,
  secure: false,           // در dev می‌تونی false بگذاری اگر روی http هستی
  sameSite: isProd ? "None" : "Lax",

  maxAge: 1000 * 60 * 15,   // 15 دقیقه
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const csrfCookieOptions = {
   httpOnly: false,
  sameSite: isProd ? "None" : "Lax",
};
