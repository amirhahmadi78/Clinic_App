import express from "express";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";
import { AddDefAppointment, EditDefAppointment,DeleteDefAppointment, GetDailyDef, GetDailyDefPatient, GetDailyDefTherapist } from "../controllers/DefAppointments.js";
const router = express.Router();

router.post("/defappointment/add",csrfGuard,requireAuth,AddDefAppointment)

router.get("/defappointment/dailydef", requireAuth, csrfGuard, GetDailyDef);

router.post("/defappointment/edit",csrfGuard,requireAuth,EditDefAppointment)

router.get("/defappointment/getdailydefpatient",csrfGuard,requireAuth,GetDailyDefPatient)

router.get("/defappointment/getdailydeftherapist",csrfGuard,requireAuth,GetDailyDefTherapist)

router.post("/defappointment/delete",csrfGuard,requireAuth,DeleteDefAppointment)
export default router;