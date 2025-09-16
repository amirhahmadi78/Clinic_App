import admin from "../models/admin.js";

export async function isAdminOrInternalManager(req, res, next) {
  try {
    const isAdminOrIntmanager = await admin.findById(req.userId);
    if (!isAdminOrIntmanager) {
      const error = new Error(
        "برای افزودن به لیست مراجعین دسترسی فقط برای مدیران وجود دارد"
      );
      error.statusCode = 403;
      return next(error);
    }

    if (
      isAdminOrIntmanager.role !== "admin" &&
      isAdminOrIntmanager.role !== "internalManager"
    ) {
      const error = new Error(
        "برای افزودن به لیست مراجعین دسترسی برای منشی وجود ندارد"
      );
      error.statusCode = 403;
      return next(error);
    }

 
    next();
  } catch (err) {
    next(err);
  }
}