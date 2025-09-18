import express from "express";
import { ShowPatients,therapistChangeStatusAndMakefinance } from "../controllers/therapist.js";
// import { body } from "express-validator";
const router = express.Router();



router.get("/therapist/:therapistId/patients",ShowPatients)

router.post("/therapist/changestatus",therapistChangeStatusAndMakefinance)


export default router;