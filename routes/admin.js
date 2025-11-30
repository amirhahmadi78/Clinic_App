import express from "express";

import  { TherapistAtDay,findTherapists,AddPatientToTherapist,GetPatientDetails,adminChangeStatusAndMakefinance,GetAllFinancial,GetPatientsList, GetFindLeaveRequests,GetmonthTherapistIncome, GetPatientFinance, MakeTherapist, EditTherapist, DeleteTherapist, MakePatient, EditPatient, DeletePatient, RelateTherapist_Patient, AddSalary, GEtMonthSalary, GetUnprocessedAppointments, GetAvailaibleTime, CheckPatient, RemovePatientToTherapist, FindOnePatient} from "../controllers/admin.js";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";

const router = express.Router();



router.get("/admin/findtherapists",requireAuth,csrfGuard,findTherapists)

router.post("/admin/addpatienttotherapist",requireAuth,csrfGuard,AddPatientToTherapist)

router.post("/admin/removepatienttotherapist",requireAuth,csrfGuard,RemovePatientToTherapist)

router.post("/admin/changestatus",requireAuth,csrfGuard,adminChangeStatusAndMakefinance)

router.get("/admin/leaverequests",requireAuth,csrfGuard,GetFindLeaveRequests)

router.get("/admin/GetAllfinancial",requireAuth,csrfGuard,GetAllFinancial)

router.get("/admin/therapistfinance",requireAuth,csrfGuard,GetmonthTherapistIncome)

router.get("/admin/patientfinance",requireAuth,csrfGuard,GetPatientFinance)

router.get("/admin/patients",requireAuth,csrfGuard,GetPatientsList)

router.get("/admin/patientdetails/:patientId",requireAuth,csrfGuard,GetPatientDetails)

router.post("/admin/addtherapist",requireAuth,csrfGuard,MakeTherapist)

router.post("/admin/edittherapist",requireAuth,csrfGuard,EditTherapist)

router.post("/admin/deletetherapist",requireAuth,csrfGuard,DeleteTherapist)

router.post("/admin/addpatient",requireAuth,csrfGuard,requireAuth,MakePatient)

router.post("/admin/editpatient",requireAuth,csrfGuard,EditPatient)

router.post("/admin/deletepatient",requireAuth,csrfGuard,DeletePatient)

router.get("/admin/therapistatday",requireAuth,csrfGuard,TherapistAtDay)

router.post("/admin/relate",csrfGuard,requireAuth,RelateTherapist_Patient)

router.post("/admin/addsalary",csrfGuard,requireAuth,AddSalary)

router.get("/admin/monthsalary",csrfGuard,requireAuth,GEtMonthSalary)

router.get("/admin/unprocessedappointments",csrfGuard,requireAuth,GetUnprocessedAppointments)

router.get("/admin/availabletime",csrfGuard,requireAuth,GetAvailaibleTime)

router.get("/admin/checkpatient",csrfGuard,requireAuth,CheckPatient)

router.get("/admin/findonepatient",csrfGuard,requireAuth,FindOnePatient)
export default router