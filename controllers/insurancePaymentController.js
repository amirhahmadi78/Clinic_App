import InsurancePaymentTransaction from "../models/InsurancePaymentTransaction.js";
import InsuranceContract from "../models/InsuranceContract.js";
import Appointment from "../models/Appointment.js";
import mongoose from "mongoose";

// @desc    Get appointments eligible for insurance payment
// @route   GET /api/insurance/payments/appointments
// @access  Private (Admin)
export const getAppointmentsForInsurancePayment = async (req, res) => {
  const { searchTerm, selectedInsurance, dateFrom, dateTo } = req.query;
  const filter = {};

  // Appointments that are not yet marked as 'bimeh' paid
  filter.bimeh = false;
  filter.sessionType = "individual"; // Assuming group sessions are handled differently or not by insurance this way

  if (selectedInsurance && selectedInsurance !== "bimeh_false" && selectedInsurance !== "bimeh_true") {
    filter.insuranceContract = selectedInsurance; // Assuming selectedInsurance is an ID
  } else if (selectedInsurance === "bimeh_true") {
    filter.bimeh = true;
  } else if (selectedInsurance === "bimeh_false") {
    filter.bimeh = false;
  }

  if (searchTerm) {
    filter.$or = [
      { patientName: { $regex: searchTerm, $options: "i" } },
      { therapistName: { $regex: searchTerm, $options: "i" } },
      { role: { $regex: searchTerm, $options: "i" } }, // 'role' corresponds to 'service' in frontend
    ];
  }

  if (dateFrom && dateTo) {
    filter.start = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
  } else if (dateFrom) {
    filter.start = { $gte: new Date(dateFrom) };
  } else if (dateTo) {
    filter.start = { $lte: new Date(dateTo) };
  }

  try {
    const appointments = await Appointment.find(filter)
      .populate("patientId", "name")
      .populate("therapistId", "name")
      .populate("insuranceContract", "name code")
      .sort({ start: 1 });

    // Transform data to match frontend structure (patientFee, insuranceCoverage, bimeh, etc.)
    const transformedAppointments = appointments.map((app) => ({
      id: app._id,
      patientName: app.patientName,
      therapistName: app.therapistName,
      date: app.localDay, // Assuming localDay is the date string
      time: `${app.start.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}-${app.end.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`,
      service: app.role, // 'role' is the service type
      patientFee: app.patientFee,
      insuranceCoverage: app.insuranceShare, // Assuming insuranceShare is calculated and stored
      bimeh: app.bimeh, // True if insurance has paid
      insuranceContractName: app.insuranceContract ? app.insuranceContract.name : "N/A",
      insuranceContractCode: app.insuranceContract ? app.insuranceContract.code : "N/A",
    }));

    res.status(200).json(transformedAppointments);
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
    selectedAppointments,
  } = req.body;

  if (!insuranceContractId || !amount || !date || !selectedAppointments || selectedAppointments.length === 0) {
    return res.status(400).json({ message: "Missing required fields for payment" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create the InsurancePaymentTransaction
    const newPaymentTransaction = new InsurancePaymentTransaction({
      insuranceContract: insuranceContractId,
      amount,
      date: new Date(date),
      reference,
      description,
      coveredAppointments: selectedAppointments.map(app => ({
        appointmentId: app.id,
        insuranceShare: app.insuranceCoverage,
      })),
    });

    const createdTransaction = await newPaymentTransaction.save({ session });

    // 2. Update each covered appointment
    for (const app of selectedAppointments) {
      await Appointment.findByIdAndUpdate(
        app.id,
        {
          $set: {
            bimeh: true,
            status_clinic: "completed-paid", // Or 'bimeh' depending on desired flow
            insuranceContract: insuranceContractId,
            insuranceShare: app.insuranceCoverage,
            // You might want to add paidAt, pay_details if they are relevant for insurance payments
          },
        },
        { session }
      );
    }

    // 3. Update the InsuranceContract's totalPaidAmount and lastPaymentDate
    const insuranceContract = await InsuranceContract.findById(insuranceContractId).session(session);
    if (insuranceContract) {
      insuranceContract.totalPaidAmount += amount;
      insuranceContract.lastPaymentDate = new Date(date);
      await insuranceContract.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Insurance payment recorded successfully", transaction: createdTransaction });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get insurance payment reports
// @route   GET /api/insurance/reports
// @access  Private (Admin)
export const getInsurancePaymentReports = async (req, res) => {
  const {
    insurance,
    dateFrom,
    dateTo,
    status,
    patient,
    therapist,
  } = req.query;

  const filter = {};
  // Only include appointments that have insuranceContract field set.
  filter.insuranceContract = { $ne: null };

  if (insurance) {
    filter.insuranceContract = insurance; // Assuming insurance is an ID
  }

  if (status) {
    // Map frontend status to backend status_clinic and bimeh field
    if (status === "paid") {
      filter.bimeh = true;
    } else if (status === "pending") {
      filter.bimeh = false; // Not yet paid by insurance
      filter.status_clinic = { $ne: "canceled" }; // exclude canceled appointments
    } else if (status === "rejected") {
      // This status might require a more complex logic, e.g., a specific rejection field in Appointment
      // For now, we'll assume 'rejected' implies bimeh: false and maybe a specific status_clinic or notes
      // As there's no explicit rejection status in Appointment model, we'll leave it out or map it carefully.
      // For simplicity, let's assume 'rejected' means bimeh: false and status_clinic is not 'completed-paid'.
      filter.bimeh = false;
    }
  }

  if (patient) {
    filter.$or = [
      { patientName: { $regex: patient, $options: "i" } },
      // { 'patientId.patientId': { $regex: patient, $options: "i" } } // If patientId has a patientId field
    ];
  }

  if (therapist) {
    filter.therapistName = { $regex: therapist, $options: "i" };
  }

  if (dateFrom && dateTo) {
    filter.start = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
  } else if (dateFrom) {
    filter.start = { $gte: new Date(dateFrom) };
  } else if (dateTo) {
    filter.start = { $lte: new Date(dateTo) };
  }

  try {
    const appointments = await Appointment.find(filter)
      .populate("insuranceContract", "name code")
      .populate("patientId", "name patientId") // Assuming patient model has patientId field
      .populate("therapistId", "name")
      .sort({ start: -1 });

    // Calculate summary totals
    const totalSessions = appointments.length;
    const totalInsurance = appointments.reduce((sum, app) => sum + (app.insuranceShare || 0), 0);
    const totalPatient = appointments.reduce((sum, app) => sum + (app.patientFee - (app.insuranceShare || 0)), 0);
    const paidAmount = appointments
      .filter((app) => app.bimeh)
      .reduce((sum, app) => sum + (app.insuranceShare || 0), 0);
    const pendingAmount = appointments
      .filter((app) => !app.bimeh && app.status_clinic !== "canceled")
      .reduce((sum, app) => sum + (app.insuranceShare || 0), 0);

    const transformedReports = appointments.map((app) => ({
      id: app._id,
      insurance: app.insuranceContract ? app.insuranceContract.name : "N/A",
      patientName: app.patientName,
      patientId: app.patientId ? app.patientId.patientId : "N/A", // Assuming patientId.patientId
      therapistName: app.therapistName,
      date: app.localDay,
      service: app.role,
      sessionFee: app.patientFee,
      insuranceShare: app.insuranceShare || 0,
      patientShare: app.patientFee - (app.insuranceShare || 0),
      status: app.bimeh ? "paid" : (app.status_clinic === "canceled" ? "rejected" : "pending"), // Simplified status mapping
      paymentDate: app.paidAt, // Use existing paidAt for paymentDate
      paymentRef: app.pay_details, // Use existing pay_details for paymentRef
      // rejectionReason: app.notes, // If notes can be used for rejection reason
    }));

    res.status(200).json({
      summary: {
        totalSessions,
        totalInsurance,
        totalPatient,
        paidAmount,
        pendingAmount,
      },
      reports: transformedReports,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

