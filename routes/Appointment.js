import express from "express";
const router = express.Router();
import {AddAppointment,DailyScheduleOfTherapist,DailyScheduleOfPatient, deleteAppointment} from "../controllers/appointment.js"
import { csrfGuard, requireAuth } from "../middlewares/auth.js";

router.post("/appointment/add",requireAuth,csrfGuard,AddAppointment)

router.get("/appointment/dailytherapist",requireAuth,csrfGuard,DailyScheduleOfTherapist)

router.get("/appointment/dailyofpatient",requireAuth,csrfGuard,DailyScheduleOfPatient)

router.post("/appointment/delete",requireAuth,csrfGuard,deleteAppointment)

export default router;