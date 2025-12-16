import express from "express";
const router = express.Router();
import {
  AddAppointment,
  DailyScheduleOfTherapist,
  DailyScheduleOfPatient,
  deleteAppointment,
  DailySchedule,
 
  GetDailyDef,
  EditAppointmen,
  PublishDailyFromDefPlan,
  AddGroup,
  updateGroup,
  payOneOfGroup,
  UnpayOneOfGroup,
} from "../controllers/Appointment.js";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";

router.post("/appointment/add", requireAuth, csrfGuard, AddAppointment);

router.post("/appointment/addgroup", requireAuth, csrfGuard, AddGroup);

router.post("/appointment/updategroup/:groupId",requireAuth,csrfGuard,updateGroup)

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



router.get("/appointment/dailydef", requireAuth, csrfGuard, GetDailyDef);

router.post("/appointment/editappointment",requireAuth,csrfGuard,EditAppointmen);

router.post("/appointment/publish",requireAuth,csrfGuard,PublishDailyFromDefPlan);

router.post("/appointment/payone",requireAuth,csrfGuard,payOneOfGroup)


router.post("/appointment/unpayone",requireAuth,csrfGuard,UnpayOneOfGroup)
export default router;
