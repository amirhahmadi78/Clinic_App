import express from "express";

import {
  TherapistAtDay,
  findTherapists,
  AddPatientToTherapist,
  GetPatientDetails,
  adminChangeStatusAndMakefinance,
  GetAllFinancial,
  GetPatientsList,
  GetFindLeaveRequests,
  ApproveOrRejectLeaveRequest,
  GetPendingLeaveRequestsCount,
  GetmonthTherapistIncome,
  GetPatientFinance,
  MakeTherapist,
  EditTherapist,
  ArchiveTherapist,
  MakePatient,
  EditPatient,
  DeletePatient,
  RelateTherapist_Patient,
  AddSalary,
  GEtMonthSalary,
  GetUnprocessedAppointments,
  GetAvailaibleTime,
  CheckPatient,
  RemovePatientToTherapist,
  FindOnePatient,
  RestoreTherapist,
  GetArchiveTherapists,
  GetArchivePatients,
  RestorePatient,
  destroyPatient,
  destroytherapist,
  GEtMonthSalaryTherapist,
  GetTherapistBalance,
  PostChangegroupStatus,
  GetAppDetails,
  GetTodayPatients,
  GetDayLeaveRequests,
  migrateLeaveRequests,
  GetTodayApprovedLeaves,
} from "../controllers/admin.js";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/admin/findtherapists", requireAuth, csrfGuard, findTherapists);

router.post(
  "/admin/addpatienttotherapist",
  requireAuth,
  csrfGuard,
  AddPatientToTherapist
);

router.post(
  "/admin/removepatienttotherapist",
  requireAuth,
  csrfGuard,
  RemovePatientToTherapist
);

router.post(
  "/admin/changestatus",
  requireAuth,
  csrfGuard,
  adminChangeStatusAndMakefinance
);

router.get(
  "/admin/leaverequests",
  requireAuth,
  csrfGuard,
  GetFindLeaveRequests
);

router.post(
  "/admin/leaverequests/approve-reject",
  requireAuth,
  csrfGuard,
  ApproveOrRejectLeaveRequest
);

router.get(
  "/admin/leaverequests/pending-count",
  requireAuth,
  csrfGuard,
  GetPendingLeaveRequestsCount
);

router.get(
  "/admin/leaverequests/day-leaves",
  requireAuth,
  csrfGuard,
  GetDayLeaveRequests
);

router.post(
  "/admin/leaverequests/migrate",
  requireAuth,
  csrfGuard,
  migrateLeaveRequests
);

router.get("/admin/GetAllfinancial", requireAuth, csrfGuard, GetAllFinancial);

router.get(
  "/admin/therapistfinance",
  requireAuth,
  csrfGuard,
  GetmonthTherapistIncome
);

router.get("/admin/patientfinance", requireAuth, csrfGuard, GetPatientFinance);

router.get("/admin/patients", requireAuth, csrfGuard, GetPatientsList);

router.get(
  "/admin/patientdetails/:patientId",
  requireAuth,
  csrfGuard,
  GetPatientDetails
);

router.post("/admin/addtherapist", requireAuth, csrfGuard, MakeTherapist);

router.post("/admin/edittherapist", requireAuth, csrfGuard, EditTherapist);

router.post("/admin/deletetherapist", requireAuth, csrfGuard, ArchiveTherapist);

router.post(
  "/admin/restoretherapist",
  requireAuth,
  csrfGuard,
  RestoreTherapist
);

router.get(
  "/admin/archivetherapists",
  requireAuth,
  csrfGuard,
  GetArchiveTherapists
);

router.post(
  "/admin/addpatient",
  requireAuth,
  csrfGuard,
  requireAuth,
  MakePatient
);

router.post("/admin/editpatient", requireAuth, csrfGuard, EditPatient);

router.post("/admin/deletepatient", requireAuth, csrfGuard, DeletePatient);

router.get("/admin/therapistatday", requireAuth, csrfGuard, TherapistAtDay);

router.post("/admin/relate", csrfGuard, requireAuth, RelateTherapist_Patient);

router.post("/admin/addsalary", csrfGuard, requireAuth, AddSalary);

router.get("/admin/monthsalary", csrfGuard, requireAuth, GEtMonthSalary);

router.get(
  "/admin/monthsalarytherapist",
  csrfGuard,
  requireAuth,
  GEtMonthSalaryTherapist
);

router.get(
  "/admin/therapist-balance",
  csrfGuard,
  requireAuth,
  GetTherapistBalance
);

router.post(
  "/admin/changegroupstatus",
  csrfGuard,
  requireAuth,
  PostChangegroupStatus
);

router.get(
  "/admin/unprocessedappointments",
  csrfGuard,
  requireAuth,
  GetUnprocessedAppointments
);

router.get("/admin/availabletime", csrfGuard, requireAuth, GetAvailaibleTime);

router.get("/admin/checkpatient", csrfGuard, requireAuth, CheckPatient);

router.get("/admin/findonepatient", csrfGuard, requireAuth, FindOnePatient);

router.get(
  "/admin/archivepatients",
  csrfGuard,
  requireAuth,
  GetArchivePatients
);

router.post("/admin/restorepatient", csrfGuard, requireAuth, RestorePatient);

router.delete("/admin/destroypatient", csrfGuard, requireAuth, destroyPatient);

router.delete(
  "/admin/destroytherapist",
  csrfGuard,
  requireAuth,
  destroytherapist
);

router.get("/admin/appdetails",csrfGuard,requireAuth,GetAppDetails)

router.get("/admin/daypatients",csrfGuard,requireAuth,GetTodayPatients)

router.get("/admin/approved",csrfGuard,requireAuth,GetTodayApprovedLeaves)



export default router;
