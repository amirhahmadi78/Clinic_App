import Appointment from "../models/Appointment.js";
import therapist from "../models/therapist.js";
import patient from "../models/patient.js";
import financial from "../models/financial.js";
 
 export async function addFinancial(appointmentId,userId ) {
    
 try {
    
    const OneAppointment = await Appointment.findById(appointmentId);
    if (!OneAppointment) {
      const error = new Error("ویزیت مورد نظر یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    const { therapistId, patientId, patientFee } = OneAppointment;
    
    
    const OneTherapist = await therapist.findById(therapistId);
    if (!OneTherapist) {
      const error = new Error("درمانگر مورد نظر یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    const { percentDefault, percentIntroduced } = OneTherapist;
    const OnePatient = await patient.findById(patientId);
    if (!OnePatient) {
      const error = new Error("مراجع مورد نظر یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    const { introducedBy } = OnePatient;
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
      userId: userId || "68cbcac51a2aa06e0e151dd4", // fellan
    });

    const savedFinancial = await newFinancial.save();
    return({message:"ویزیت با موفقیت انجام شد و عملیات امور مالی نیز ثبت شد",
        savedFinancial}
        );
  } catch (error) {
    throw error;
  }
}
