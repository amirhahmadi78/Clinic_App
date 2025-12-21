import express from "express";
import {csrfGuard, requireAuth} from "../middlewares/auth.js";

import {
  getAllInsuranceContracts,
  getInsuranceContractById,
  createInsuranceContract,
  updateInsuranceContract,
  deleteInsuranceContract,
} from "../controllers/insuranceController.js";

import {
  getInsuranceContractsForPayment,
  recordInsurancePayment,
  getInsurancePaymentReports,
} from "../controllers/insurancePaymentController.js";

const router = express.Router();

router.route("/contracts").get(csrfGuard, requireAuth, getAllInsuranceContracts);  
router.route("/contracts/:id").get(csrfGuard, requireAuth, getInsuranceContractById);
router.route("/contracts").post(csrfGuard, requireAuth, createInsuranceContract);
router.route("/contracts/:id").put(csrfGuard, requireAuth, updateInsuranceContract);
router.route("/contracts/:id").delete(csrfGuard, requireAuth, deleteInsuranceContract);

router.route("/payments/contracts").get(csrfGuard, requireAuth, getInsuranceContractsForPayment);
router.route("/payments").post(csrfGuard, requireAuth, recordInsurancePayment);
router.route("/reports").get(csrfGuard, requireAuth, getInsurancePaymentReports);

export default router;

