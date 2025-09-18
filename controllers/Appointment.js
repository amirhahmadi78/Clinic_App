import Appointment from "../models/Appointment.js";
import { DateTime } from "luxon";
import { ConflictRole } from "../util/ConflictRule.js";
import therapist from "../models/therapist.js";
import patient from "../models/patient.js";
import financial from "../models/financial.js";

export async function AddAppointment(req, res, next) {
  try {
    const {
      therapistId,
      patientId,
      start,
      duration,
      type,
      status,
      room,
      notes,
      patientFee
      
    } = req.body;
  
    const startDT = DateTime.fromISO(start, { zone: "Asia/Tehran" });
    const endDT = startDT.plus({ minutes: duration });
    const localDay = startDT.toFormat("yyyy-MM-dd");
    const createdBy=req.userId ||"68c6b48915700380ed73141d"
    const TherapistExist=await therapist.findById(therapistId)
    if(!TherapistExist){
      const error = new Error("درمانگر مورد نظر وجود ندارد");
      error.statusCode = 404;
      return next(error);
    }

      const PatientExist=await patient.findById(patientId)
    if(!PatientExist){
      const error = new Error("مراجع مورد نظر وجود ندارد");
      error.statusCode = 404;
      return next(error);
    }
    
    const TherapistAppointments=await Appointment.find({therapistId},"start end")

    for (let OneAppointment of TherapistAppointments) {
      const otherStart = OneAppointment.start
      const otherEnd = OneAppointment.end
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    }
   
    
    


    const MakeAppointment = new Appointment({
      therapistId,
      patientId,
      start:startDT.toJSDate(),
      end:endDT.toJSDate(),
      duration,
      type,
      status,
      room,
      notes,
      createdBy,
      localDay,
      patientFee
    });

    const newAppointment = await MakeAppointment.save();
    res.status(200).json({
      newAppointment,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAppointment(req, res, next) {
  try {
    const {
      appointmentId
      
    } = req.body;
    let FinancialOperations="ویزیت حذف شده فاقد عملیات مالی بود"
  const deletedAppointment=await Appointment.findByIdAndDelete(appointmentId)
  const deleteFinancial=await financial.findOneAndDelete({appointmentId:appointmentId})
  if(deleteFinancial){
    FinancialOperations="عملیات مالی مورد نظر حذف گردید"
  }
  if (!deletedAppointment){
     const error = new Error("ویزیت مورد نظر وجود ندارد");
      error.statusCode = 404;
      return next(error);
  }
  res.status(200).json({
    message:" ویزیت مورد نظر با موفقیت حذف شد و"+FinancialOperations,
    deletedAppointment

  })
    
  } catch (error) {
    error = new Error("برنامه ی مورد نظر وجود ندارد");
      error.statusCode = 404;
      
    next(error);
  }
}

export async function DailyScheduleOfTherapist(req , res , next){
  try {
    let { therapistId, date } = req.query;

    if (!therapistId || !date) {
      const error = new Error("مشخصات درمانگر و تاریخ الزامی هستند");
      error.statusCode = 400;
      return next(error);
    }
    date=date.trim()
    const dt = DateTime.fromISO(date, { zone: "Asia/Tehran" });
    const localDay = dt.toFormat("yyyy-MM-dd");
    
    
    const appointments = await Appointment.find({
      therapistId,
      localDay,
    });
    if (appointments.length==0){
      const error = new Error("برنامه ی درمانگر در این تاریخ خالی می باشد");
      error.statusCode = 404;
      return next(error);
    }
    res.status(200).json({ appointments });
  } catch (err) {
    next(err);
  }
}

export async function DailyScheduleOfPatient(req , res , next){
  try {
    let {patientId,date}=req.query
     date=date.trim()
    const dt = DateTime.fromISO(date, { zone: "Asia/Tehran" });
    const localDay = dt.toFormat("yyyy-MM-dd");
    const appointments=await Appointment.find({patientId,localDay})
    if(appointments.length==0){
       const error = new Error("برنامه ی مراجع در این تاریخ خالی می باشد");
      error.statusCode = 404;
      return next(error);
    }
    res.status(200).json({
      appointments
    })
  } catch (error) {
    next(error)
  }
}