import AdminSchema from "../models/admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

export async function PostSignUp(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("your entered data is invalid");
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
    }

    const { username, name, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const newAdmin = new AdminSchema({
      username,
      password: hashedPassword,
      name,
      email,
      phone,
    });
    await newAdmin.save();
    res.status(200).json({
      message: "کاربر با موفقیت ثبت نام شد!",
      userId: newAdmin._id,
      username: newAdmin.username,
      email: newAdmin.email,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500; // خطاهای ناشناخته را 500 در نظر می‌گیریم
    }
    next(error);
  }
}

export async function PostLogin(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("your entered data is invalid");
      error.statusCode = 422;
      next(error);
    }
    const { username, password } = req.body;

    const OneAdmin = await AdminSchema.findOne({ username });
    if (OneAdmin) {
      const ComparePass = await bcrypt.compare(password, OneAdmin.password);
      if (!ComparePass ){
          const error = new Error("نام کاربری یا رمز عبور نامعتبر است.");
      error.statusCode = 401;
      return next(error);
      } 
        const token = jwt.sign(
          { email: OneAdmin.email, AdminId: OneAdmin._id },
          "amirmamad",
          { expiresIn: "1h" }
        );
        res.status(200).json({
          AdminId: OneAdmin._id.toString(),
          token: token,
        });
      
    } else{
         const error = new Error("نام کاربری یا رمز عبور نامعتبر است.");
      error.statusCode = 401; 
      return next(error);
    }
     
  } catch (error) {
    error.message = "your entered data is invalid";
    error.statusCode = 401;
    next(error);
  }
}
