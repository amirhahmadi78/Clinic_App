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

    // Build date filter for appointments
    let dateFilter = {};
    if (dateFrom && dateTo) {
      dateFilter.start = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    } else if (dateFrom) {
      dateFilter.start = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      dateFilter.start = { $lte: new Date(dateTo) };
    }

    // Build payment date filter
    let paymentFilter = {};
    if (dateFrom && dateTo) {
      paymentFilter.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    } else if (dateFrom) {
      paymentFilter.date = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      paymentFilter.date = { $lte: new Date(dateTo) };
    }

    // Get stats for each contract including insurance sessions
    const contractsWithStats = await Promise.all(
      contracts.map(async (contract) => {
        // Calculate insurance sessions stats for this contract
        const insuranceSessionsStats = await Appointment.aggregate([
          {
            $match: {
              status_clinic: "bimeh",
              insuranceContract: contract._id,
              ...dateFilter
            }
          },
          {
            $group: {
              _id: null,
              totalSessions: { $sum: 1 },
              totalAmount: { $sum: "$patientFee" },
              totalInsuranceShare: { $sum: "$insuranceShare" }
            }
          }
        ]);

        const sessionStats = insuranceSessionsStats[0] || {
          totalSessions: 0,
          totalAmount: 0,
          totalInsuranceShare: 0
        };

        // Get payments for this contract within date range
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

          // Insurance sessions statistics
          totalInsuranceSessions: sessionStats.totalSessions,
          totalInsuranceAmount: sessionStats.totalAmount,
          totalInsuranceShare: sessionStats.totalInsuranceShare,
          remainingFromPatients: sessionStats.totalAmount - sessionStats.totalInsuranceShare,

          coverage: contract.coverage,
          discountRate: contract.discountRate,
        };
      })
    );

    // Update totalDebtAmount based on actual insurance sessions and recalculate balances
    for (const contract of contractsWithStats) {
      const insuranceContract = await InsuranceContract.findById(contract.id);
      if (insuranceContract) {
        // Update debt based on actual insurance shares (not total session amounts)
        insuranceContract.totalDebtAmount = contract.totalInsuranceShare;
        insuranceContract.currentBalance = insuranceContract.totalPaidAmount - insuranceContract.totalDebtAmount;
        await insuranceContract.save();

        // Update display stats
        contract.totalDebtAmount = insuranceContract.totalDebtAmount;
        contract.currentBalance = insuranceContract.currentBalance;
      }
    }

    // Calculate overall summary
    const summary = {
      totalContracts: contractsWithStats.length,
      activeContracts: contractsWithStats.filter(c => c.status === 'active').length,
      totalPaid: contractsWithStats.reduce((sum, c) => sum + c.totalPaidAmount, 0),
      totalDebt: contractsWithStats.reduce((sum, c) => sum + c.totalDebtAmount, 0),
      totalBalance: contractsWithStats.reduce((sum, c) => sum + c.currentBalance, 0),
      periodTotalPaid: contractsWithStats.reduce((sum, c) => sum + c.periodPaid, 0),

      // Insurance sessions summary
      totalInsuranceSessions: contractsWithStats.reduce((sum, c) => sum + c.totalInsuranceSessions, 0),
      totalInsuranceAmount: contractsWithStats.reduce((sum, c) => sum + c.totalInsuranceAmount, 0),
      totalInsuranceShare: contractsWithStats.reduce((sum, c) => sum + c.totalInsuranceShare, 0),
      totalRemainingFromPatients: contractsWithStats.reduce((sum, c) => sum + c.remainingFromPatients, 0),
    };

    res.status(200).json({
      summary,
      contracts: contractsWithStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all insurance payment transactions with filtering
// @route   GET /api/insurance/transactions
// @access  Private (Admin)
export const getInsurancePaymentTransactions = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    insuranceContract,
    dateFrom,
    dateTo,
    status,
    minAmount,
    maxAmount,
    sortBy = 'date',
    sortOrder = 'desc'
  } = req.query;

  try {
    let filter = {};

    // Filter by insurance contract
    if (insuranceContract) {
      filter.insuranceContract = insuranceContract;
    }

    // Filter by date range
    if (dateFrom && dateTo) {
      filter.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    } else if (dateFrom) {
      filter.date = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      filter.date = { $lte: new Date(dateTo) };
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by amount range
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Get transactions with insurance contract details
    const transactions = await InsurancePaymentTransaction.find(filter)
      .populate('insuranceContract', 'name code')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await InsurancePaymentTransaction.countDocuments(filter);

    // Calculate summary
    const summaryResult = await InsurancePaymentTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    const summary = summaryResult[0] || {
      totalAmount: 0,
      transactionCount: 0,
      averageAmount: 0
    };

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      transactions,
      summary,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get insurance sessions with filtering and pagination
// @route   GET /api/insurance/sessions
// @access  Private (Admin)
export const getInsuranceSessions = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    insuranceContract,
    insuranceName,
    dateFrom,
    dateTo,
    patientName,
    therapistName,
    status_clinic = 'bimeh'
  } = req.query;

  try {
    let matchQuery = {
      status_clinic: status_clinic
    };

    // Filter by insurance contract
    if (insuranceContract) {
      matchQuery.insuranceContract = mongoose.Types.ObjectId(insuranceContract);
    }

    // Filter by insurance name
    if (insuranceName) {
      matchQuery.insuranceName = { $regex: insuranceName, $options: 'i' };
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      matchQuery.start = {};
      if (dateFrom) matchQuery.start.$gte = new Date(dateFrom);
      if (dateTo) matchQuery.start.$lte = new Date(dateTo);
    }

    // Filter by patient name
    if (patientName) {
      matchQuery.patientName = { $regex: patientName, $options: 'i' };
    }

    // Filter by therapist name
    if (therapistName) {
      matchQuery.therapistName = { $regex: therapistName, $options: 'i' };
    }

    // Get total count
    const totalCountResult = await Appointment.aggregate([
      { $match: matchQuery },
      { $count: "totalCount" }
    ]);

    const totalCount = totalCountResult[0]?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Get paginated sessions with populated data
    const sessions = await Appointment.find(matchQuery)
      .populate('patientId', 'firstName lastName bimehKind paymentType')
      .populate('therapistId', 'firstName lastName')
      .populate('insuranceContract', 'name code')
      .sort({ start: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate summary statistics
    const summaryResult = await Appointment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalAmount: { $sum: "$patientFee" },
          totalInsuranceShare: { $sum: "$insuranceShare" },
          avgSessionFee: { $avg: "$patientFee" }
        }
      }
    ]);

    const summary = summaryResult[0] || {
      totalSessions: 0,
      totalAmount: 0,
      totalInsuranceShare: 0,
      avgSessionFee: 0
    };

    // Group by insurance type for additional stats
    const insuranceStats = await Appointment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$insuranceName",
          sessionCount: { $sum: 1 },
          totalAmount: { $sum: "$patientFee" },
          totalInsuranceShare: { $sum: "$insuranceShare" }
        }
      },
      {
        $project: {
          insuranceName: "$_id",
          sessionCount: 1,
          totalAmount: 1,
          totalInsuranceShare: 1,
          _id: 0
        }
      },
      { $sort: { sessionCount: -1 } }
    ]);

    res.status(200).json({
      sessions,
      summary,
      insuranceBreakdown: insuranceStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get patient insurance debts report
// @route   GET /api/insurance/patient-debts
// @access  Private (Admin)
export const getPatientInsuranceDebts = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    dateFrom,
    dateTo,
    insuranceContract,
    patientName,
    status = 'all', // 'all', 'paid', 'unpaid'
  } = req.query;

  try {
    let filter = {
      status_clinic: "bimeh",
      insuranceContract: { $ne: null }
    };

    // Filter by date range
    if (dateFrom && dateTo) {
      filter.start = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    } else if (dateFrom) {
      filter.start = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      filter.start = { $lte: new Date(dateTo) };
    }

    // Filter by insurance contract
    if (insuranceContract) {
      filter.insuranceContract = insuranceContract;
    }

    // Filter by patient name
    if (patientName) {
      filter.patientName = { $regex: patientName, $options: 'i' };
    }

    // Get all insurance appointments grouped by patient
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const patientDebts = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$patientId",
          patientName: { $first: "$patientName" },
          insuranceName: { $first: "$insuranceName" },
          totalSessions: { $sum: 1 },
          totalAmount: { $sum: "$patientFee" },
          totalInsuranceShare: { $sum: "$insuranceShare" },
          totalPatientShare: { $sum: { $subtract: ["$patientFee", "$insuranceShare"] } },
          sessions: {
            $push: {
              id: "$_id",
              date: "$start",
              amount: "$patientFee",
              insuranceShare: "$insuranceShare",
              patientShare: { $subtract: ["$patientFee", "$insuranceShare"] },
              status_clinic: "$status_clinic"
            }
          }
        }
      },
      {
        $lookup: {
          from: "patients",
          localField: "_id",
          foreignField: "_id",
          as: "patient"
        }
      },
      {
        $addFields: {
          patientInfo: { $arrayElemAt: ["$patient", 0] }
        }
      },
      {
        $project: {
          patientId: "$_id",
          patientName: 1,
          insuranceName: 1,
          totalSessions: 1,
          totalAmount: 1,
          totalInsuranceShare: 1,
          totalPatientShare: 1,
          sessions: 1,
          patientPhone: "$patientInfo.phone",
          patientBimehKind: "$patientInfo.bimehKind"
        }
      },
      { $sort: { totalPatientShare: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Get total count for pagination
    const totalRecordsResult = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$patientId"
        }
      },
      {
        $count: "totalPatients"
      }
    ]);

    const totalRecords = totalRecordsResult[0]?.totalPatients || 0;

    // Calculate overall summary
    const summary = {
      totalPatients: totalRecords,
      totalSessions: patientDebts.reduce((sum, patient) => sum + patient.totalSessions, 0),
      totalInsuranceAmount: patientDebts.reduce((sum, patient) => sum + patient.totalAmount, 0),
      totalInsuranceShare: patientDebts.reduce((sum, patient) => sum + patient.totalInsuranceShare, 0),
      totalPatientShare: patientDebts.reduce((sum, patient) => sum + patient.totalPatientShare, 0),
    };

    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    res.status(200).json({
      patients: patientDebts,
      summary,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Error in getPatientInsuranceDebts:', error);
    res.status(500).json({ message: error.message });
  }
};
