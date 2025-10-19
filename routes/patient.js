import express from "express";
import { showAppointments,showTherapists,showNotPaid } from "../controllers/patient.js";
const router = express.Router();


router.get("/patient/showappointment",showAppointments)

router.get("/patient/showtherapists",showTherapists)

router.get("/patient/notpaid",showNotPaid)
export default router