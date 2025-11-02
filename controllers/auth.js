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
} from "../utils/auth.js";
import message from "../models/message.js";

function setAuthCookies(res, accessToken, refreshToken, csrfToken) {
  res.cookie("access_token", accessToken, accessCookieOptions);
  res.cookie("refresh_token", refreshToken, refreshCookieOptions);
  res.cookie("csrf_token", csrfToken, csrfCookieOptions); // non-HttpOnly
}


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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("مقادیر ورودی اشتباه است");
      error.statusCode = 422;
      next(error);
    }
    const { username, password } = req.body;

    const OneAdmin = await admin.findOne({ username });
    if (OneAdmin) {
      const ok =bcrypt.compare(password, OneAdmin.password);
      if (!ok) {
        const error = new Error("نام کاربری یا رمز عبور نامعتبر است.");
        error.statusCode = 401;
        return next(error);
      }
        // صدور توکن‌ها
    const payload = { modeluser:OneAdmin.modeluser,firstName:OneAdmin.firstName,lastName:OneAdmin.lastName, id: OneAdmin._id, role:OneAdmin.role  };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // ذخیره هش refresh در DB (multi-device)
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7));
    OneAdmin.refreshTokens.push({
      tokenHash,
      expiresAt,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });
    await OneAdmin.save();

    // CSRF token (برای double-submit)
    const csrfToken = generateCsrfToken();
    setAuthCookies(res, accessToken, refreshToken, csrfToken);


      res.status(200).json({
         user:OneAdmin,
         csrfToken,
        message:"ورود با موفقیت انجام شد"
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

export async function RefreshSession(req, res, next) {
  try {

   
    
    const rToken = req.cookies?.refresh_token;
    if (!rToken) return res.status(401).json({ message: "No refresh token" });

    const decoded = verifyRefresh(rToken); // throws if invalid/expired
    var user
    if (decoded.modeluser=="admin"){
       user = await admin.findById(decoded.id);
    }

        if (decoded.modeluser=="therapist"){
       user = await therapist.findById(decoded.id);
    }

        if (decoded.modeluser=="patient"){
       user = await patient.findById(decoded.id);
    }


    if (!user) return res.status(401).json({ message: "User not found" });
   

    // وجود توکن در DB با هش
    const hash = sha256(rToken);
    const entry = user.refreshTokens.find(t => t.tokenHash === hash && !t.revokedAt);
    if (!entry || entry.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh token invalid/revoked" });
    }

    // Rotation: revoke قدیمی و ساخت جدید
    entry.revokedAt = new Date();
user.refreshTokens = user.refreshTokens.filter(t => !t.revokedAt && t.expiresAt > new Date());

    const payload = { modeluser:user.modeluser,firstName:user.firstName,lastName:user.lastName, id: user._id, role:user.role  };
    const newAccess = signAccessToken(payload);
    const newRefresh = signRefreshToken(payload);
    
    user.refreshTokens.push({
      tokenHash: sha256(newRefresh),
      expiresAt: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)),
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });

    await user.save();

    const newCsrf = generateCsrfToken();
    setAuthCookies(res, newAccess, newRefresh, newCsrf);

    res.status(200).json({ message: "session refreshed" ,
      csrfToken:newCsrf
    });
  } catch (e) {
    return res.status(401).json({ message: "Cannot refresh session" });
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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("مقادیر ورودی اشتباه است");
      error.statusCode = 422;
      next(error);
    }
    const { username, password } = req.body;

    const OnePatient = await patient.findOne({ username });
    if (OnePatient) {
      const ok =bcrypt.compare(password, OnePatient.password);
      if (!ok) {
        const error = new Error("نام کاربری یا رمز عبور نامعتبر است.");
        error.statusCode = 401;
        return next(error);
      }
        // صدور توکن‌ها
    const payload = { modeluser:OnePatient.modeluser,firstName:OnePatient.firstName,lastName:OnePatient.lastName, id: OnePatient._id, role:OnePatient.role  };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // ذخیره هش refresh در DB (multi-device)
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7));
    OnePatient.refreshTokens.push({
      tokenHash,
      expiresAt,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });
    await OnePatient.save();

    // CSRF token (برای double-submit)
    const csrfToken = generateCsrfToken();
    setAuthCookies(res, accessToken, refreshToken, csrfToken);


      res.status(200).json({
         user:OnePatient,
         csrfToken,
        message:"ورود با موفقیت انجام شد"
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
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("مقادیر ورودی اشتباه است");
      error.statusCode = 422;
      next(error);
    }
    const { username, password } = req.body;
console.log("vared shod");

    const OneTherapist = await therapist.findOne({ username });
    if (OneTherapist) {
      const ok =bcrypt.compare(password, OneTherapist.password);
      if (!ok) {
        const error = new Error("نام کاربری یا رمز عبور نامعتبر است.");
        error.statusCode = 401;
        return next(error);
      }
        // صدور توکن‌ها
    const payload = { modeluser:OneTherapist.modeluser,firstName:OneTherapist.firstName,lastName:OneTherapist.lastName, id: OneTherapist._id, role:OneTherapist.role  };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // ذخیره هش refresh در DB (multi-device)
    const tokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24 * 7));
    OneTherapist.refreshTokens.push({
      tokenHash,
      expiresAt,
      userAgent: req.get("user-agent"),
      ip: req.ip,
    });
    await OneTherapist.save();

    // CSRF token (برای double-submit)
    const csrfToken = generateCsrfToken();
    setAuthCookies(res, accessToken, refreshToken, csrfToken);


      res.status(200).json({
         user:OneTherapist,
         csrfToken,
        message:"ورود با موفقیت انجام شد"
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


// export async function PatientSignUp(req, res, next) {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       const error = new Error("لطفا مقادیر را درست وارد کنید");
//       error.statusCode = 422;
//       error.data = errors.array();
//       throw error;
//     }
//     const { username, firstName,lastName, phone, email, password,introducedBy } = req.body;
    
//  const existUser = await patient.findOne({
//       $or: [{ username }, { email },{phone}],
//     });

//     if (existUser) {
//       let message = "";
//        if (existUser.username === username) {
//         message = "نام کاربری قبلاً ثبت شده است!";
//       } else if (existUser.email === email) {
//         message = "ایمیل قبلاً ثبت شده است!";
//       } else if (existUser.phone===phone) {
//         message = "شماره تلفن قبلاً ثبت شده است!"
//       }else{
//         message="ورودی ها نا معتبر هستند"
//       }

//       const error = new Error(message);
//       error.statusCode = 409;
//       return next(error);
//     }


//     const hashedPassword = await bcrypt.hash(password, 12);

//     const newPatient = new patient({
//       username,
//       password: hashedPassword,
//       firstName,
//       lastName,
//       email,
//       phone,
//       introducedBy
//     });
//     await newPatient.save();
//     res.status(200).json({
//       message: "مراجع با موفقیت ثبت نام شد!",
//       userId: newPatient._id,
//       username: newPatient.username,
//       email: newPatient.email,
//     });
//   } catch (error) {
//     if (!error.statusCode) {
//       error.statusCode = 500;
//     }
//     next(error);
//   }
// }

// export async function PatientLogin(req, res, next) {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       const error = new Error("your entered data is invalid");
//       error.statusCode = 422;
//       next(error);
//     }
//     const { username, password } = req.body;

//     const OnePatient = await patient.findOne({ username });

//     if (!OnePatient) {
//        const error = new Error("نام کاربری نامعتبر است.");
//         error.statusCode = 401;
//         return next(error);
//     }

//       const ComparePass = bcrypt.compare(password, OnePatient.password);
//       if (!ComparePass) {
//         const error = new Error("رمز عبور نامعتبر است.");
//         error.statusCode = 401;
//         return next(error);
//       }
//       const token = jwt.sign(
//         { email: OnePatient.email, AdminId: OnePatient._id ,role: OnePatient.role},
//         "amirmamad",
//         { expiresIn: "1h" }
//       );
//       res.status(200).json({
//         user: OnePatient,
//         token: token,
//       });
    
//   } catch (error) {
//     error.message = "your entered data is invalid";
//     error.statusCode = 401;
//     next(error);
//   }
// }

// export async function TherapistSignUp(req, res, next) {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty) {
//       const error = new Error("مقادیر ورودی نادرست است");
//       error.statusCode = 422;
//       error.data = errors.array();
//       throw error;
//     }

//     const {
//       username,
//       firstName,
//       lastName,
//       phone,
//       email,
//       password,
//       role,
//       skills,
//       availableHours,
//       patients,
//     } = req.body;

//  const existUser = await therapist.findOne({
//       $or: [{ username }, { email },{phone}],
//     });

//     if (existUser) {
//       let message = "";
//        if (existUser.username === username) {
//         message = "نام کاربری قبلاً ثبت شده است!";
//       } else if (existUser.email === email) {
//         message = "ایمیل قبلاً ثبت شده است!";
//       } else if (existUser.phone===phone) {
//         message = "شماره تلفن قبلاً ثبت شده است!"
//       }

//       const error = new Error(message);
//       error.statusCode = 409;
//       return next(error);
//     }


//     const hashedPassword = await bcrypt.hash(password, 12);
//     const newTherapist = new therapist({
//       username,
//       password: hashedPassword,
//       firstName,
//       lastName,
//       email,
//       phone,
//       role,
//       skills,
//       patients,
//       availableHours,
//     });
//     await newTherapist.save();
//     res.status(200).json({
//       message: "درمانگر با موفقیت ثبت نام شد!",
//       userId: newTherapist._id,
//       username: newTherapist.username,
//       email: newTherapist.email,
//     });
//   } catch (error) {
//     console.log(error);
//     if (!error.statusCode) {
//       error.statusCode = 500;
//     }
//     next(error);
//   }
// }

// export async function TherapistLogin(req, res, next) {
//   try {
//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       const error = new Error("your entered data is invalid");
//       error.statusCode = 422;
//       next(error);
//     }
//     const { username, password } = req.body;

//     const OneTherapist = await therapist.findOne({ username });
//     if (OneTherapist) {
//       const ComparePass = await bcrypt.compare(password, OneTherapist.password);
//       if (!ComparePass) {
//         const error = new Error("نام کاربری یا رمز عبور نامعتبر است.");
//         error.statusCode = 401;
//         return next(error);
//       }
//       const token = jwt.sign(
//         { email: OneTherapist.email, AdminId: OneTherapist._id ,role: OneTherapist.role },
//         "amirmamad",
//         { expiresIn: "1h" }
//       );
//       res.status(200).json({
//         user: OneTherapist,
//         token: token,
//       });
//     } else {
//       const error = new Error("نام کاربری یا رمز عبور نامعتبر است.");
//       error.statusCode = 401;
//       return next(error);
//     }
//   } catch (error) {
//     error.message = "your entered data is invalid";
//     error.statusCode = 401;
//     next(error);
//   }
// }
