import admin from "../models/admin.js";
import patient from "../models/patient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import therapist from "../models/therapist.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
  sha256,
  generateCsrfToken,
  accessCookieOptions,
  refreshCookieOptions,
  csrfCookieOptions,
  setAuthCookies,
} from "../utils/auth.js";


// function setAuthCookies(res, accessToken, refreshToken, csrfToken) {
//   res.cookie("access_token", accessToken, accessCookieOptions);
//   res.cookie("refresh_token", refreshToken, refreshCookieOptions);
//   res.cookie("csrf_token", csrfToken, csrfCookieOptions); // non-HttpOnly
// }


export async function AdminSignUp(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("مقادیر ورودی اشتباه است");
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
    }

    const { username, firstName,lastName, phone, email, password, role } = req.body;

    const existUser = await admin.findOne({
      $or: [{ username }, { email },{phone}],
    });

    if (existUser) {

      let message 
       if (existUser.username === username) {
        message = "نام کاربری قبلاً ثبت شده است!";
      } else if (existUser.email === email) {
        message = "ایمیل قبلاً ثبت شده است!";
      } else if (existUser.phone===phone) {
        message = "شماره تلفن قبلاً ثبت شده است!"
      }
      
      
      const error = new Error(message);
      error.statusCode = 409;
      console.log(error);
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newAdmin = new admin({
      modeluser:"admin",
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      phone,
      role,
    });


  const accessToken = signAccessToken({ modeluser:newAdmin.modeluser,firstName:newAdmin.firstName,lastName:newAdmin.lastName, id: newAdmin._id, role:newAdmin.role });
    const refreshToken = signRefreshToken({ email, id: newAdmin._id, role });

    // ذخیره هش refresh در DB (rotation-friendly)
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)); // 7d
    newAdmin.refreshTokens.push({
      tokenHash,
      expiresAt,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    await newAdmin.save();

    // const csrfToken = generateCsrfToken();
    // setAuthCookies(res, accessToken, refreshToken, csrfToken)

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
    const { username, password } = req.body;

    const OneAdmin = await admin.findOne({ username });
    if (!OneAdmin) {
      return res.status(401).json({ message: "نام کاربری یا رمز عبور نامعتبر است." });
    }

    const ok = await bcrypt.compare(password, OneAdmin.password);
    if (!ok) {
      return res.status(401).json({ message: "نام کاربری یا رمز عبور نامعتبر است." });
    }

    const payload = {
      id: OneAdmin._id,
      role: OneAdmin.role,
      modeluser: OneAdmin.modeluser,
      firstName: OneAdmin.firstName,
      lastName: OneAdmin.lastName,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const tokenHash = sha256(refreshToken);

    OneAdmin.refreshTokens.push({
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    await OneAdmin.save();

    const csrfToken = generateCsrfToken();
    setAuthCookies(res, accessToken, refreshToken, csrfToken);

    res.json({
      user: payload,
      csrfToken,
      message: "ورود موفق",
    });

  } catch (e) {
    next(e);
  }
}


export async function RefreshSession(req, res) {
  try {
    console.log("omaadrefresh");
    
    const rToken = req.cookies?.refresh_token;
    if (!rToken) return res.status(401).json({ message: "No refresh token" });

    const decoded = verifyRefresh(rToken);

    let userModel;
    if (decoded.modeluser === "admin") userModel = admin;
    if (decoded.modeluser === "therapist") userModel = therapist;
    if (decoded.modeluser === "patient") userModel = patient;

    const user = await userModel.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const hash = sha256(rToken);
    const entry = user.refreshTokens.find(t => t.tokenHash === hash);

    if (!entry || entry.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh invalid" });
    }

    entry.revokedAt = new Date();

    const payload = {
      id: user._id,
      role: user.role,
      modeluser: user.modeluser,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const newAccess = signAccessToken(payload);
    const newRefresh = signRefreshToken(payload);

    user.refreshTokens.push({
      tokenHash: sha256(newRefresh),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    await user.save();

    const newCsrf = generateCsrfToken();
    setAuthCookies(res, newAccess, newRefresh, newCsrf);

    res.json({ csrfToken: newCsrf, message: "session refreshed" });

  } catch (e) {
    res.status(401).json({ message: "Cannot refresh session" });
  }
}



export async function AdminLogout(req, res, next) {
  try {
    const rToken = req.cookies?.refresh_token;
    if (rToken) {
      try {
        const { id } = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET);
        const user = await admin.findById(id);
        if (user) {
          const hash = sha256(rToken);
          const entry = user.refreshTokens.find(t => t.tokenHash === hash && !t.revokedAt);
          if (entry) entry.revokedAt = new Date();
          await user.save();
        }
      } catch (_) {}
    }

    // پاک کردن کوکی‌ها
    res.clearCookie("access_token", { ...accessCookieOptions, maxAge: 0 });
    res.clearCookie("refresh_token", { ...refreshCookieOptions, maxAge: 0 });
    res.clearCookie("csrf_token", { ...csrfCookieOptions, maxAge: 0 });

    res.status(200).json({ message: "خروج انجام شد" });
  } catch (e) {
    next(e);
  }
}

//patient


export async function PatientSignUp(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("مقادیر ورودی اشتباه است");
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
    }

    const { username, firstName,lastName, phone, email, password, role } = req.body;

    const existUser = await patient.findOne({
      $or: [{ username }, { email },{phone}],
    });

    if (existUser) {

      let message 
       if (existUser.username === username) {
        message = "نام کاربری قبلاً ثبت شده است!";
      } else if (existUser.email === email) {
        message = "ایمیل قبلاً ثبت شده است!";
      } else if (existUser.phone===phone) {
        message = "شماره تلفن قبلاً ثبت شده است!"
      }
      
      
      const error = new Error(message);
      error.statusCode = 409;
      console.log(error);
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newPatient = new patient({
      modeluser:"patient",
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      phone,
      role,
    });


  const accessToken = signAccessToken({ modeluser:newPatient.modeluser,firstName:newPatient.firstName,lastName:newPatient.lastName, id: newPatient._id, role:newPatient.role });
    const refreshToken = signRefreshToken({ email, id: newPatient._id, role });

    // ذخیره هش refresh در DB (rotation-friendly)
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)); // 7d
    newPatient.refreshTokens.push({
      tokenHash,
      expiresAt,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    await newPatient.save();

    const csrfToken = generateCsrfToken();
    setAuthCookies(res, accessToken, refreshToken, csrfToken)

    res.status(200).json({
      message: "مراجعس با موفقیت ثبت نام شد!",
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
    const { username, password } = req.body;

    const OnePatient = await patient.findOne({ username });
    if (!OnePatient) {
      return res.status(401).json({ message: "نام کاربری یا رمز عبور نامعتبر است." });
    }

    const ok = await bcrypt.compare(password, OnePatient.password);
    if (!ok) {
      return res.status(401).json({ message: "نام کاربری یا رمز عبور نامعتبر است." });
    }

    const payload = {
      id: OnePatient._id,
      role: OnePatient.role,
      modeluser: OnePatient.modeluser,
      firstName: OnePatient.firstName,
      lastName: OnePatient.lastName,
      percentDefault:OnePatient.percentDefault
      
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const tokenHash = sha256(refreshToken);

    OnePatient.refreshTokens.push({
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    await OnePatient.save();

    const csrfToken = generateCsrfToken();
    setAuthCookies(res, accessToken, refreshToken, csrfToken);

    res.json({
      user: payload,
      csrfToken,
      message: "ورود موفق",
    });

  } catch (e) {
    next(e);
  }
}





export async function PatientLogout(req, res, next) {
  try {
    const rToken = req.cookies?.refresh_token;
    if (rToken) {
      try {
        const { id } = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET);
        const user = await patient.findById(id);
        if (user) {
          const hash = sha256(rToken);
          const entry = user.refreshTokens.find(t => t.tokenHash === hash && !t.revokedAt);
          if (entry) entry.revokedAt = new Date();
          await user.save();
        }
      } catch (_) {}
    }

    // پاک کردن کوکی‌ها
    res.clearCookie("access_token", { ...accessCookieOptions, maxAge: 0 });
    res.clearCookie("refresh_token", { ...refreshCookieOptions, maxAge: 0 });
    res.clearCookie("csrf_token", { ...csrfCookieOptions, maxAge: 0 });

    res.status(200).json({ message: "خروج انجام شد" });
  } catch (e) {
    next(e);
  }
}


//therapist

export async function TherapistSignUp(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("مقادیر ورودی اشتباه است");
      error.statusCode = 422;
      error.data = errors.array();
      return next(error);
    }

    const { username, firstName,lastName, phone, email, password, role } = req.body;

    const existUser = await therapist.findOne({
      $or: [{ username }, { email },{phone}],
    });

    if (existUser) {

      let message 
       if (existUser.username === username) {
        message = "نام کاربری قبلاً ثبت شده است!";
      } else if (existUser.email === email) {
        message = "ایمیل قبلاً ثبت شده است!";
      } else if (existUser.phone===phone) {
        message = "شماره تلفن قبلاً ثبت شده است!"
      }
      
      
      const error = new Error(message);
      error.statusCode = 409;
      console.log(error);
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newTherapist = new therapist({
      modeluser:"therapist",
      username,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      phone,
      role,
    });


  const accessToken = signAccessToken({ modeluser:newTherapist.modeluser,firstName:newTherapist.firstName,lastName:newTherapist.lastName, id: newTherapist._id, role:newTherapist.role });
    const refreshToken = signRefreshToken({ email, id: newTherapist._id, role });

    // ذخیره هش refresh در DB (rotation-friendly)
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)); // 7d
    newTherapist.refreshTokens.push({
      tokenHash,
      expiresAt,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    await newTherapist.save();

    const csrfToken = generateCsrfToken();
    setAuthCookies(res, accessToken, refreshToken, csrfToken)

    res.status(200).json({
      message: "درمانگر با موفقیت ثبت نام شد!",
      userId: newTherapist._id,
      username: newTherapist.username,
      email: newTherapist.email,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}

export async function TherapistLogin(req, res, next) {
  try {
    const { username, password } = req.body;

    const OneTherapist = await therapist.findOne({ username });
    if (!OneTherapist) {
      return res.status(401).json({ message: "نام کاربری یا رمز عبور نامعتبر است." });
    }

    const ok = await bcrypt.compare(password, OneTherapist.password);
    if (!ok) {
      return res.status(401).json({ message: "نام کاربری یا رمز عبور نامعتبر است." });
    }

    const payload = {
      id: OneTherapist._id,
      role: OneTherapist.role,
      modeluser: OneTherapist.modeluser,
      firstName: OneTherapist.firstName,
      lastName: OneTherapist.lastName,
      percentDefault:OneTherapist.percentDefault
      
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const tokenHash = sha256(refreshToken);

    OneTherapist.refreshTokens.push({
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    await OneTherapist.save();

    const csrfToken = generateCsrfToken();
    setAuthCookies(res, accessToken, refreshToken, csrfToken);

    res.json({
      user: payload,
      csrfToken,
      message: "ورود موفق",
    });

  } catch (e) {
    next(e);
  }
}





export async function TherapisLogout(req, res, next) {
  try {
    const rToken = req.cookies?.refresh_token;
    if (rToken) {
      try {
        const { id } = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET);
        const user = await therapist.findById(id);
        if (user) {
          const hash = sha256(rToken);
          const entry = user.refreshTokens.find(t => t.tokenHash === hash && !t.revokedAt);
          if (entry) entry.revokedAt = new Date();
          await user.save();
        }
      } catch (_) {}
    }

    // پاک کردن کوکی‌ها
    res.clearCookie("access_token", { ...accessCookieOptions, maxAge: 0 });
    res.clearCookie("refresh_token", { ...refreshCookieOptions, maxAge: 0 });
    res.clearCookie("csrf_token", { ...csrfCookieOptions, maxAge: 0 });

    res.status(200).json({ message: "خروج انجام شد" });
  } catch (e) {
    next(e);
  }
}



export const getCsrfToken = (req, res) => {
  try {
    
    
    const csrfToken = generateCsrfToken();
    res.cookie("csrf_token", csrfToken, csrfCookieOptions);
    return res.status(200).json({ csrfToken });
  } catch (err) {
    console.error("❌ Error in /auth/csrf:", err);
    return res.status(500).json({ message: "Failed to generate CSRF token" });
  }
};
