// controllers/transactionController.js
import transactionService from "../services/transaction.js";

export const walletDeposit = async (req, res) => {
  try {
    const { patientId, amount, description } = req.body;
    
    const result = await transactionService.walletDeposit(patientId, amount, description);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const walletWithdraw = async (req, res) => {
  try {
    const { patientId, amount, description } = req.body;
    
    const result = await transactionService.walletWithdraw(patientId, amount, description);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const appointmentPayment = async (req, res) => {
  try {
    const { patientId, amount, appointmentId, description } = req.body;
    
    const result = await transactionService.appointmentPayment(patientId, amount, appointmentId, description);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const appointmentCancel = async (req, res) => {
  try {
    const { patientId, amount, appointmentId, description } = req.body;
    
    const result = await transactionService.appointmentCancel(patientId, amount, appointmentId, description);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getWalletBalance = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const balance = await transactionService.calculateBalance(patientId);
    
    res.json({
      success: true,
      balance,
      formattedBalance: transactionService.formatAmount(balance)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getWalletInfo = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const walletInfo = await transactionService.getWalletInfo(patientId);
    
    res.json({
      success: true,
      ...walletInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};