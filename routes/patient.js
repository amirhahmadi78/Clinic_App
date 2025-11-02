import express from "express";
import { showAppointments,showTherapists,showNotPaid } from "../controllers/patient.js";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";
const router = express.Router();


router.get("/patient/showappointment",requireAuth,csrfGuard,showAppointments)

router.get("/patient/showtherapists",requireAuth,csrfGuard,showTherapists)

router.get("/patient/notpaid",requireAuth,csrfGuard,showNotPaid)
export default router