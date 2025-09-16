import express from "express";
import { ShowPatients } from "../controllers/therapist.js";
// import { body } from "express-validator";
const router = express.Router();



router.get("/therapist/:therapistId/patients",ShowPatients)
export default router;