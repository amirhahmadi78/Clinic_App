import jwt from "jsonwebtoken";

export async function VerifyToken(req, res, next) {
  try {
    const AuthHeader = req.get("Authorization");
    if (!AuthHeader) {
      const error = new Error("Authorization header missing");
      error.status = 401;
      return next(error);
    }
    const Decoded = jwt.verify(AuthHeader, "amirmamad");
    if (!Decoded) {
      const error = new Error("invalid Token");
      error.status = 401;
      return next(error);
    }
    req.userId = Decoded.AdminId;
  } catch (error) {
    error.status = 401;
    return next(error);
  }
}
