import express from "express";
import { PostLogin, PostSignUp } from "../controllers/auth.js";
import { body } from "express-validator";
const router = express.Router();

router.post(
  "/signup",
  body("email").isEmail(),
  body("password").isLength({ min: 5 }).isAlphanumeric(),
  body("name").isLength({ min: 5 }).trim(),
  body("username").isLength({ min: 5 }).trim(),
  body("phone").isNumeric,
  PostSignUp
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").isLength({ min: 5 }).isAlphanumeric(),
  PostLogin
);

export default router;
