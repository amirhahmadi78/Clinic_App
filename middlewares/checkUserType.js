
import admin from "../models/admin.js";
import therapist from "../models/therapist.js";
export async function checkUserType(userId) {
  if (!userId) {
    const error = new Error("شناسه کاربر ارسال نشده است");
    error.statusCode = 400;
    return next(error);
  }
  const user = await admin.findById(userId) || await therapist.findById(userId);
  if (!user) {
    const error = new Error("کاربر یافت نشد");
    error.statusCode = 404;
    return next(error);
  }
  return user.modeluser

}
