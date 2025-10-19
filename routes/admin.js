import express from "express";
// import { isAdminOrInternalManager } from "../middlewares/CheckRole.js"; بعدا بزارم توی افزودن مراجع به درمانگر felan
import { findTherapists,AddPatientToTherapist,GetPatientDetails,adminChangeStatusAndMakefinance,GetAllFinancial,GetPatientsList, GetFindLeaveRequests,GetmonthTherapistIncome, GetPatientFinance} from "../controllers/admin.js";
// import { body } from "express-validator";
const router = express.Router();

// router.get("/admin/daily/:localDay",)

router.get("/admin/findtherapists",findTherapists)

router.post("/admin/addpatienttotherapist",AddPatientToTherapist)

router.post("/admin/changestatus",adminChangeStatusAndMakefinance)

router.get("/admin/leaverequests",GetFindLeaveRequests)

router.get("/admin/GetAllfinancial",GetAllFinancial)

router.get("/admin/therapistfinance",GetmonthTherapistIncome)

router.get("/admin/patientfinance",GetPatientFinance)

router.get("/admin/patients",GetPatientsList)

router.get("/admin/patientdetails/:patientId",GetPatientDetails)
export default router