import express from "express";
const router = express.Router();
import {
  AddAppointment,
  DailyScheduleOfTherapist,
  DailyScheduleOfPatient,
  deleteAppointment,
  DailySchedule,
  AddDefAppointment,
  GetDailyDef,
  EditAppointmen,
} from "../controllers/Appointment.js";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";

router.post("/appointment/add", requireAuth, csrfGuard, AddAppointment);

router.get(
  "/appointment/dailytherapist",
  requireAuth,
  csrfGuard,
  DailyScheduleOfTherapist
);

router.get(
  "/appointment/dailyofpatient",
  requireAuth,
  csrfGuard,
  DailyScheduleOfPatient
);

router.post("/appointment/delete", requireAuth, csrfGuard, deleteAppointment);

router.get("/appointment/dailyschedule", requireAuth, csrfGuard, DailySchedule);

router.post("/appointment/adddef", requireAuth, csrfGuard, AddDefAppointment);

router.get("/appointment/dailydef", requireAuth, csrfGuard, GetDailyDef);

router.post("/appointment/editappointment",requireAuth,csrfGuard,EditAppointmen);

export default router;
