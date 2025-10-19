import express from "express";
import { ShowPatients,ShowRequests,therapistChangeStatusAndMakefinance,GetdailyTherapistIncome,GetmonthTherapistIncome,writeReport,postDailyLeaveRequest,postHourlyLeaveRequest } from "../controllers/therapist.js";
// import { body } from "express-validator";
const router = express.Router();



router.get("/therapist/:therapistId/patients",ShowPatients)

router.post("/therapist/changestatus",therapistChangeStatusAndMakefinance)

router.get("/therapist/dayincome",GetdailyTherapistIncome)

router.get("/therapist/monthincome",GetmonthTherapistIncome)

router.post("/therapist/addreport",writeReport)

router.post("/therapist/dailyleaverequest",postDailyLeaveRequest)

router.post("/therapist/hourlyleaverequest",postHourlyLeaveRequest)
router.get("/therapist/showrequests",ShowRequests)

export default router;