
import { verifyAccess } from "../utils/auth.js";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE","GET"]);

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.access_token;
    if (!token) return res.status(401).json({ message: "No access token" });

    const decoded = verifyAccess(token);
    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired access token" });
  }
}

export function csrfGuard(req, res, next) {

  const exempt = [
    "/login/admin",
    "/login/patient",
    "/login/therapist",
    "/signup/admin",
    "/signup/patient",
    "/signup/therapist",
    "/auth/refresh",
    "/auth/csrf"
  ];

  // if (exempt.includes(req.path)) return next();
  // if (!UNSAFE.has(req.method)) return next();
  if (exempt.some(route => req.path.startsWith(route))) {
    return next();
  }
  const csrfCookie = req.cookies?.csrf_token;
  const csrfHeader = req.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: "CSRF token mismatch" });
  }

  next();
}

