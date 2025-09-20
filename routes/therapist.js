import express from "express";
import { ShowPatients,therapistChangeStatusAndMakefinance,GetdailyTherapistIncome,GetmonthTherapistIncome } from "../controllers/therapist.js";
// import { body } from "express-validator";
const router = express.Router();



router.get("/therapist/:therapistId/patients",ShowPatients)

router.post("/therapist/changestatus",therapistChangeStatusAndMakefinance)

router.get("/therapist/dayincome",GetdailyTherapistIncome)

router.get("/therapist/monthincome",GetmonthTherapistIncome)

export default router;