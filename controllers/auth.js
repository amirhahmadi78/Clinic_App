import admin from "../models/admin.js";
import patient from "../models/patient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import therapist from "../models/therapist.js";

export async function AdminSignUp(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("مقادیر ورودی اشتباه است");
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
    }

    const { username, name, phone, email, password, role } = req.body;

    const existUser = await admin.findOne({
      $or: [{ username }, { email },{phone}],
    });

    if (existUser) {
      let message = "";
       if (existUser.username === username) {
        message = "نام کاربری قبلاً ثبت شده است!";
      } else if (existUser.email === email) {
        message = "ایمیل قبلاً ثبت شده است!";
      } else if (existUser.phone===phone) {
        message = "شماره تلفن قبلاً ثبت شده است!"
      }

      const error = new Error(message);
      error.statusCode = 409;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newAdmin = new admin({
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      role,
    });
    await newAdmin.save();
    res.status(200).json({
      message: "ادمین با موفقیت ثبت نام شد!",
      userId: newAdmin._id,
      username: newAdmin.username,
      email: newAdmin.email,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}

export async function AdminLogin(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("مقادیر ورودی اشتباه است");
      error.statusCode = 422;
      next(error);
    }
    const { username, password } = req.body;

    const OneAdmin = await admin.findOne({ username });
    if (OneAdmin) {
      const ComparePass = await bcrypt.compare(password, OneAdmin.password);
      if (!ComparePass) {
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
    } else {
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

export async function PatientSignUp(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("لطفا مقادیر را درست وارد کنید");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const { username, name, phone, email, password,introducedBy } = req.body;
    
 const existUser = await patient.findOne({
      $or: [{ username }, { email },{phone}],
    });

    if (existUser) {
      let message = "";
       if (existUser.username === username) {
        message = "نام کاربری قبلاً ثبت شده است!";
      } else if (existUser.email === email) {
        message = "ایمیل قبلاً ثبت شده است!";
      } else if (existUser.phone===phone) {
        message = "شماره تلفن قبلاً ثبت شده است!"
      }else{
        message="ورودی ها نا معتبر هستند"
      }

      const error = new Error(message);
      error.statusCode = 409;
      return next(error);
    }


    const hashedPassword = await bcrypt.hash(password, 12);

    const newPatient = new patient({
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      introducedBy
    });
    await newPatient.save();
    res.status(200).json({
      message: "مراجع با موفقیت ثبت نام شد!",
      userId: newPatient._id,
      username: newPatient.username,
      email: newPatient.email,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}

export async function PatientLogin(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("your entered data is invalid");
      error.statusCode = 422;
      next(error);
    }
    const { username, password } = req.body;

    const OnePatient = await patient.findOne({ username });

    if (!OnePatient) {
       const error = new Error("نام کاربری نامعتبر است.");
        error.statusCode = 401;
        return next(error);
    }

      const ComparePass = bcrypt.compare(password, OnePatient.password);
      if (!ComparePass) {
        const error = new Error("رمز عبور نامعتبر است.");
        error.statusCode = 401;
        return next(error);
      }
      const token = jwt.sign(
        { email: OnePatient.email, AdminId: OnePatient._id },
        "amirmamad",
        { expiresIn: "1h" }
      );
      res.status(200).json({
        AdminId: OnePatient._id.toString(),
        token: token,
      });
    
  } catch (error) {
    error.message = "your entered data is invalid";
    error.statusCode = 401;
    next(error);
  }
}

export async function TherapistSignUp(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty) {
      const error = new Error("مقادیر ورودی نادرست است");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const {
      username,
      name,
      phone,
      email,
      password,
      role,
      skills,
      availableHours,
      patients,
    } = req.body;

 const existUser = await therapist.findOne({
      $or: [{ username }, { email },{phone}],
    });

    if (existUser) {
      let message = "";
       if (existUser.username === username) {
        message = "نام کاربری قبلاً ثبت شده است!";
      } else if (existUser.email === email) {
        message = "ایمیل قبلاً ثبت شده است!";
      } else if (existUser.phone===phone) {
        message = "شماره تلفن قبلاً ثبت شده است!"
      }

      const error = new Error(message);
      error.statusCode = 409;
      return next(error);
    }


    const hashedPassword = await bcrypt.hash(password, 12);
    const newTherapist = new therapist({
      username,
      password: hashedPassword,
      name,
      email,
      phone,
      role,
      skills,
      patients,
      availableHours,
    });
    await newTherapist.save();
    res.status(200).json({
      message: "درمانگر با موفقیت ثبت نام شد!",
      userId: newTherapist._id,
      username: newTherapist.username,
      email: newTherapist.email,
    });
  } catch (error) {
    console.log(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}

export async function TherapistLogin(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("your entered data is invalid");
      error.statusCode = 422;
      next(error);
    }
    const { username, password } = req.body;

    const OneTherapist = await therapist.findOne({ username });
    if (OneTherapist) {
      const ComparePass = await bcrypt.compare(password, OneTherapist.password);
      if (!ComparePass) {
        const error = new Error("نام کاربری یا رمز عبور نامعتبر است.");
        error.statusCode = 401;
        return next(error);
      }
      const token = jwt.sign(
        { email: OneTherapist.email, AdminId: OneTherapist._id },
        "amirmamad",
        { expiresIn: "1h" }
      );
      res.status(200).json({
        TherapistId: OneTherapist._id.toString(),
        token: token,
      });
    } else {
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
