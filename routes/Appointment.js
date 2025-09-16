import express from "express";
const router = express.Router();
import {AddAppointment} from "../controllers/Appointment.js"

router.post("/appointment/add",AddAppointment)


export default router;