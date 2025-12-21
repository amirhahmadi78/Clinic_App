import InsurancePaymentTransaction from "../models/InsurancePaymentTransaction.js";
import InsuranceContract from "../models/InsuranceContract.js";
import Appointment from "../models/Appointment.js";
import mongoose from "mongoose";

// @desc    Get insurance contracts for payment dropdown
// @route   GET /api/insurance/payments/contracts
// @access  Private (Admin)
export const getInsuranceContractsForPayment = async (req, res) => {
  try {
    const contracts = await InsuranceContract.find({ status: { $in: ['active', 'pending'] } })
      .select('name code totalPaidAmount totalDebtAmount currentBalance')
      .sort({ name: 1 });

    res.status(200).json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record a new insurance payment transaction
// @route   POST /api/insurance/payments
// @access  Private (Admin)
export const recordInsurancePayment = async (req, res) => {
  const {
    insuranceContractId,
    amount,
    date,
    reference,
    description,
    paymentType = "partial",
  } = req.body;

  if (!insuranceContractId || !amount || !date) {
    return res.status(400).json({ message: "Missing required fields for payment" });
  }


  try {
    // 1. Create the InsurancePaymentTransaction
    const newPaymentTransaction = new InsurancePaymentTransaction({
      insuranceContract: insuranceContractId,
      amount: parseFloat(amount),
      date: new Date(date),
      reference,
      description,
      paymentType,
    });

    const createdTransaction = await newPaymentTransaction.save();

    // 2. Update the InsuranceContract's totalPaidAmount and lastPaymentDate
    const insuranceContract = await InsuranceContract.findById(insuranceContractId)
    if (insuranceContract) {
      insuranceContract.totalPaidAmount += parseFloat(amount);
      insuranceContract.lastPaymentDate = new Date(date);
      // Update current balance: paid - debt
      insuranceContract.currentBalance = insuranceContract.totalPaidAmount - insuranceContract.totalDebtAmount;
      await insuranceContract.save();
    }

  

    res.status(201).json({
      message: "Insurance payment recorded successfully",
      transaction: createdTransaction,
      updatedContract: insuranceContract
    });
  } catch (error) {

    res.status(400).json({ message: error.message });
  }
};

// @desc    Get insurance payment reports (overview of all insurance contracts)
// @route   GET /api/insurance/reports
// @access  Private (Admin)
export const getInsurancePaymentReports = async (req, res) => {
  const {
    dateFrom,
    dateTo,
    status,
  } = req.query;

  try {
    let filter = {};

    // Filter by contract status if provided
    if (status) {
      filter.status = status;
    }

    // Get all insurance contracts
    const contracts = await InsuranceContract.find(filter).sort({ name: 1 });

    // Get payments within date range if provided
    let paymentFilter = {};
    if (dateFrom && dateTo) {
      paymentFilter.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    } else if (dateFrom) {
      paymentFilter.date = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      paymentFilter.date = { $lte: new Date(dateTo) };
    }

    // Get payments for each contract within date range
    const contractsWithPayments = await Promise.all(
      contracts.map(async (contract) => {
        const contractPayments = await InsurancePaymentTransaction.find({
          insuranceContract: contract._id,
          ...paymentFilter,
        }).sort({ date: -1 });

        const periodPaid = contractPayments.reduce((sum, payment) => sum + payment.amount, 0);

        return {
          id: contract._id,
          name: contract.name,
          code: contract.code,
          contactPerson: contract.contactPerson,
          phone: contract.phone,
          status: contract.status,
          contractDate: contract.contractDate,
          expiryDate: contract.expiryDate,
          totalPaidAmount: contract.totalPaidAmount,
          totalDebtAmount: contract.totalDebtAmount,
          currentBalance: contract.currentBalance,
          lastPaymentDate: contract.lastPaymentDate,
          periodPaid, // Payments within the selected date range
          periodPayments: contractPayments.length,
          coverage: contract.coverage,
          discountRate: contract.discountRate,
        };
      })
    );

    // Calculate overall summary
    const summary = {
      totalContracts: contractsWithPayments.length,
      activeContracts: contractsWithPayments.filter(c => c.status === 'active').length,
      totalPaid: contractsWithPayments.reduce((sum, c) => sum + c.totalPaidAmount, 0),
      totalDebt: contractsWithPayments.reduce((sum, c) => sum + c.totalDebtAmount, 0),
      totalBalance: contractsWithPayments.reduce((sum, c) => sum + c.currentBalance, 0),
      periodTotalPaid: contractsWithPayments.reduce((sum, c) => sum + c.periodPaid, 0),
    };

    res.status(200).json({
      summary,
      contracts: contractsWithPayments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

