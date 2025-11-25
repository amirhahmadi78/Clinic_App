// routes/transactionRoutes.js
import express from "express";
import {
  walletDeposit,
  walletWithdraw,
  appointmentPayment,
  appointmentCancel,
  getWalletBalance,
  getTransactionHistory,
  getWalletInfo
} from "../controllers/transaction.js"

const router = express.Router();

// 📥 واریز به کیف پول
router.post("/transaction/wallet/deposit", walletDeposit);

// 📤 برداشت از کیف پول
router.post("/transaction/wallet/withdraw", walletWithdraw);

// 💳 پرداخت جلسه درمان
router.post("/transaction/appointment/payment", appointmentPayment);

// ↩️ کنسل کردن پرداخت جلسه
router.post("/transaction/appointment/cancel", appointmentCancel);

// 💰 موجودی کیف پول
router.get("/transaction/wallet/balance/:patientId", getWalletBalance);

// 📊 اطلاعات کامل کیف پول
router.get("/transaction/wallet/info/:patientId", getWalletInfo);

// 📜 تاریخچه تراکنش‌ها
router.get("/transaction/history/:patientId", getTransactionHistory);

export default router;