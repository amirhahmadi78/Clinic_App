import express from "express";
import { ShowPatients,ShowRequests,therapistChangeStatusAndMakefinance,GetdailyTherapistIncome,GetmonthTherapistIncome,writeReport,postDailyLeaveRequest,postHourlyLeaveRequest } from "../controllers/therapist.js";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";

const router = express.Router();



router.get("/therapist/:therapistId/patients",csrfGuard,requireAuth,ShowPatients)

router.post("/therapist/changestatus",csrfGuard,requireAuth,therapistChangeStatusAndMakefinance)

router.get("/therapist/dayincome",csrfGuard,requireAuth,GetdailyTherapistIncome)

router.get("/therapist/monthincome",csrfGuard,requireAuth,GetmonthTherapistIncome)

router.post("/therapist/addreport",csrfGuard,requireAuth,writeReport)

router.post("/therapist/dailyleaverequest",csrfGuard,requireAuth,postDailyLeaveRequest)

router.post("/therapist/hourlyleaverequest",csrfGuard,requireAuth,postHourlyLeaveRequest)
router.get("/therapist/showrequests",csrfGuard,requireAuth,ShowRequests)

export default router;