import express from "express";
// import { isAdminOrInternalManager } from "../middlewares/CheckRole.js"; بعدا بزارم توی افزودن مراجع به درمانگر felan
import { findTherapists ,AddPatientToTherapist,adminChangeStatusAndMakefinance} from "../controllers/admin.js";
// import { body } from "express-validator";
const router = express.Router();

router.get("/admin/findtherapists",findTherapists)

router.post("/admin/addpatienttotherapist",AddPatientToTherapist)

router.post("/admin/changestatus",adminChangeStatusAndMakefinance)

export default router