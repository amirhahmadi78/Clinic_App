// controllers/transactionController.js
import transactionService from "../services/transaction.js";

export const walletDeposit = async (req, res,next) => {
  try {
    const { patientId, amount, description } = req.body;
    
    const result = await transactionService.walletDeposit(patientId, amount, description);
    
    res.json(result);
  } catch (error) {
  next(error)
  }
};

export const walletWithdraw = async (req, res,next) => {
  try {
    const { patientId, amount, description } = req.body;
    
    const result = await transactionService.walletWithdraw(patientId, amount, description);
    
    res.json(result);
  } catch (error) {
 next(error)
  }
};

export const appointmentPayment = async (req, res,next) => {
  try {
    const { patientId, amount, appointmentId, description } = req.body;
    
    const result = await transactionService.appointmentPayment(patientId, amount, appointmentId, description);
    
    res.json(result);
  } catch (error) {
next(error)
  }
};

export const appointmentCancel = async (req, res,next) => {
  try {
    const {  appointmentId } = req.body;

    
    const result = await transactionService.appointmentCancel( appointmentId);
    
    res.json(result);
  } catch (error) {
   next(error)
  }
};

export const getWalletBalance = async (req, res,next) => {
  try {
    const { patientId } = req.params;
    
    const balance = await transactionService.calculateBalance(patientId);
    
    res.json({
      success: true,
      balance,
      formattedBalance: transactionService.formatAmount(balance)
    });
  } catch (error) {
   next(error)
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page, limit, type, for: forFilter, startDate, endDate } = req.query;

    
    const result = await transactionService.getTransactionHistory(
      patientId, 
      parseInt(page) || 1, 
      parseInt(limit) || 10,
      { type, for: forFilter, startDate, endDate }
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error)
  }
};

export const getWalletInfo = async (req, res,next) => {
  try {
    const { patientId } = req.params;
    
    const walletInfo = await transactionService.getWalletInfo(patientId);
    
    res.json({
      success: true,
      ...walletInfo
    });
  } catch (error) {
    next(error)
  }
};