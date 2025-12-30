import express from "express";
import { ShowPatients, createLeaveRequest, getTherapistLeaveRequests, deleteLeaveRequest, therapistChangeStatusAndMakefinance, GetdailyTherapistIncome, GetmonthTherapistIncome, writeReport, uploadExercise, getTherapistExercises, updateExercise, deleteExercise } from "../controllers/therapist.js";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";
import { getExercises } from "../controllers/exercise.js";

const router = express.Router();



router.get("/therapist/patients",csrfGuard,requireAuth,ShowPatients)

router.post("/therapist/changestatus",csrfGuard,requireAuth,therapistChangeStatusAndMakefinance)

router.get("/therapist/dayincome",csrfGuard,requireAuth,GetdailyTherapistIncome)

router.get("/therapist/monthincome",csrfGuard,requireAuth,GetmonthTherapistIncome)

router.post("/therapist/addreport",csrfGuard,requireAuth,writeReport)

router.post("/therapist/leave-requests",csrfGuard,requireAuth,createLeaveRequest);
router.get("/therapist/leave-requests",csrfGuard,requireAuth,getTherapistLeaveRequests);
router.delete("/therapist/leave-requests/:requestId",csrfGuard,requireAuth,deleteLeaveRequest);

// Exercise Routes
router.post("/therapist/exercises", csrfGuard, requireAuth, uploadExercise);
router.get("/therapist/exercises", csrfGuard, requireAuth, getTherapistExercises);
router.put("/therapist/exercises/:exerciseId", csrfGuard, requireAuth, updateExercise);
router.delete("/therapist/exercises/:exerciseId", csrfGuard, requireAuth, deleteExercise);

export default router;