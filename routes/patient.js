import express from "express";
import { showAppointments,showTherapists,showNotPaid,getPatientDetails,getTherapistsExercises, GetNotebook } from "../controllers/patient.js";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";
const router = express.Router();


router.get("/patient/showappointment",requireAuth,csrfGuard,showAppointments)

router.get("/patient/showtherapists",requireAuth,csrfGuard,showTherapists)

router.get("/patient/notpaid",requireAuth,csrfGuard,showNotPaid)

router.get("/patient/:patientId",requireAuth,csrfGuard,getPatientDetails)

router.get("/patient/therapists/exercises",requireAuth,csrfGuard,getTherapistsExercises)

router.get("/patient/notebook",requireAuth,csrfGuard,GetNotebook)
export default router