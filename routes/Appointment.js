import express from "express";
const router = express.Router();
import {AddAppointment,DailyScheduleOfTherapist,DailyScheduleOfPatient, deleteAppointment} from "../controllers/appointment.js"

router.post("/appointment/add",AddAppointment)

router.get("/appointment/dailytherapist",DailyScheduleOfTherapist)

router.get("/appointment/dailyofpatient",DailyScheduleOfPatient)

router.post("/appointment/delete",deleteAppointment)

export default router;