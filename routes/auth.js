import express from "express";
import { AdminLogin , AdminSignUp , PatientLogin,PatientSignUp,TherapistLogin,TherapistSignUp } from "../controllers/auth.js";
import { body } from "express-validator";
const router = express.Router();

router.post(
  "/signup/admin",
  body("email").isEmail(),
  body("password").isLength({ min: 5 }).isAlphanumeric(),
  body("name").isLength({ min: 5 }).trim(),
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


router.post("/signup/patient", 
  body("email").isEmail(),
  body("password").isLength({ min: 5 }).isAlphanumeric(),
  body("name").isLength({ min: 5 }).trim(),
  body("username").isLength({ min: 5 }).trim(),
  body("phone").isNumeric(),
PatientSignUp)



router.post(
  "/login/patient",
  body("username").isLength({ min: 5 }),
  body("password").isLength({ min: 5 }),
  AdminLogin
);


router.post("/signup/therapist",
   body("email").isEmail(),
  body("password").isLength({ min: 5 }).isAlphanumeric(),
  body("name").isLength({ min: 5 }).trim(),
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

export default router;
