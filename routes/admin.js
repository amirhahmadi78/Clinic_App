import express from "express";
import { findTherapists} from "../controllers/admin.js";
// import { body } from "express-validator";
const router = express.Router();

router.get("/admin/findtherapists",findTherapists)


export default router