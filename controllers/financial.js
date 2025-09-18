import Appointment from "../models/Appointment.js";
import financial from "../models/financial.js";
import patient from "../models/patient.js";
import therapist from "../models/therapist.js";

export async function addFinancial(req, res, next) {
  try {
    const { appointmentId, status } = req.body;
    const OneAppointment = await Appointment.findById(appointmentId);
    if (!OneAppointment) {
      const error = new Error("ویزیت مورد نظر یافت نشد");
      error.statusCode = 404;
      return next(error);
    }
    const { therapistId, patientId, patientFee } = OneAppointment;
    console.log("therapistId: "+therapistId);
    
    const OneTherapist = await therapist.findById(therapistId);
    if (!OneTherapist) {
      const error = new Error("درمانگر مورد نظر یافت نشد");
      error.statusCode = 404;
      return next(error);
    }
    const { percentDefault, percentIntroduced } = OneTherapist;
    const OnePatient = await patient.findById(patientId);
    if (!OnePatient) {
      const error = new Error("مراجع مورد نظر یافت نشد");
      error.statusCode = 404;
      return next(error);
    }
    const { introducedBy } = OnePatient;
    const userId = req.userId || "68cbcac51a2aa06e0e151dd4" //felan;
    let percent = percentDefault;
    if (introducedBy && introducedBy.toString() == therapistId.toString()) {
      percent = percentIntroduced;
    } else {
      percent = percentDefault;
    }
    const therapistShare = (patientFee * percent) / 100;
    const clinicShare = patientFee - therapistShare;
    const newFinancial = new financial({
      appointmentId,
      therapistId,
      patientId,
      patientFee,
      clinicShare,
      therapistShare,
      status,
      userId,
    });

    const savedFinancial = await newFinancial.save();
    res.status(201).json({message:"ویزیت با موفقیت انجام شد و عملیات امور مالی نیز ثبت شد",
        savedFinancial}
        );
  } catch (error) {
    next(error);
  }
}
