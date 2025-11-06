import express from "express";
import { AdminLogin , AdminSignUp ,  RefreshSession,
  AdminLogout, PatientLogin,PatientSignUp,TherapistLogin,TherapistSignUp,TherapisLogout, 
  PatientLogout,
  getCsrfToken} from "../controllers/auth.js";
import { body } from "express-validator";
import { requireAuth, csrfGuard } from "../middlewares/auth.js";
import { csrfCookieOptions, generateCsrfToken } from "../utils/auth.js";
const router = express.Router();

router.post(
  "/signup/admin",
  body("email").isEmail(),
  body("password").isLength({ min: 5 }).isAlphanumeric(),
  body("firstName").isLength({ min: 3 }).trim(),
  body("lastName").isLength({ min: 3 }).trim(),
  body("username").isLength({ min: 5 }).trim(),
  body("phone").isNumeric(),
  AdminSignUp
);

router.post(
  "/login/admin",
  body("username").isLength({ min: 5 }),
  body("password").isLength({ min: 5 }),
  AdminLogin
);

router.get("/auth/refresh", RefreshSession);

router.post("/logout/admin", requireAuth, csrfGuard, AdminLogout);

router.post("/signup/patient", 
  body("email").isEmail(),
  body("password").isLength({ min: 5 }).isAlphanumeric(),
  body("firstName").isLength({ min: 3 }).trim(),
  body("lastName").isLength({ min: 3 }).trim(),
  body("username").isLength({ min: 5 }).trim(),
  body("phone").isNumeric(),
PatientSignUp)



router.post(
  "/login/patient",
  body("username").isLength({ min: 5 }),
  body("password").isLength({ min: 5 }),
  PatientLogin
);


router.post("/signup/therapist",
   body("email").isEmail(),
  body("password").isLength({ min: 5 }).isAlphanumeric(),
  body("firstName").isLength({ min: 3 }).trim(),
  body("lastName").isLength({ min: 3 }).trim(),
  body("username").isLength({ min: 5 }).trim(),
  body("phone").isNumeric(),
  TherapistSignUp
)

router.post(
  "/login/therapist",
  body("username").isLength({ min: 5 }),
  body("password").isLength({ min: 5 }),
  TherapistLogin
);

router.post("/logout/therapist", requireAuth, csrfGuard, TherapisLogout);


router.post("/logout/admin", requireAuth, csrfGuard, AdminLogout);

router.post("/logout/patient", requireAuth, csrfGuard, PatientLogout);

router.get("/auth/csrf", (req, res) => {
  const newCsrf = generateCsrfToken();
  res.cookie("csrf_token", newCsrf, csrfCookieOptions);
  res.json({ csrfToken: newCsrf });
});


export default router;


