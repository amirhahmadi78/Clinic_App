import express from "express";
import { AddPatientToTherapist,ShowPatients } from "../controllers/therapist.js";
// import { body } from "express-validator";
const router = express.Router();

router.post("/therapist/addpatient",AddPatientToTherapist)

router.get("/therapist/:therapistId/patients",ShowPatients)
export default router;