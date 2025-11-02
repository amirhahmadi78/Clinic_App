// middlewares/auth.js
import { verifyAccess } from "../utils/auth.js";

const UNSAFE_METHODS = new Set(["POST","PUT","PATCH","DELETE","GET"]);

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.access_token; // از کوکی می‌خوانیم
    if (!token) return res.status(401).json({ message: "No access token" });
    const decoded = verifyAccess(token);
    req.user = { id: decoded.id , role: decoded.role, modeluser: decoded.modeluser ,name:decoded.firstName+" "+decoded.lastName};
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid/expired access token" });
  }
}

// Double-submit CSRF: اگر متد ناامن بود، همسانی کوکی و هدر را چک کن
export function csrfGuard(req, res, next) {

      const exemptRoutes = [
        "/",
    "/login/admin",
    "/login/patient",
    "/login/therapist",
    "/signup/admin",
    "/signup/patient",
    "/signup/therapist",
    "/auth/refresh"
  ];

  if (exemptRoutes.includes(req.path)) {
    return next(); // ❌ از بررسی CSRF رد میشه
  }
  if (!UNSAFE_METHODS.has(req.method)) return next();

  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.get("x-csrf-token");
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: "CSRF token mismatch" });
  }
  next();
}
