import Appointment from "../models/Appointment.js";
import { DateTime } from "luxon";
import { ConflictRole } from "../util/ConflictRule.js";

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
      
    } = req.body;
  
    const startDT = DateTime.fromISO(start, { zone: "Asia/Tehran" });
    const endDT = startDT.plus({ minutes: duration });
    const localDay = startDT.toFormat("yyyy-MM-dd");
    const createdBy=req.userId ||"68c6b48915700380ed73141d"
    
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
  const deletedAppointment=await Appointment.findByIdAndDelete(appointmentId)
  if (!deletedAppointment){
     const error = new Error("برنامه ی مورد نظر وجود ندارد");
      error.statusCode = 404;
      return next(error);
  }
  res.status(200).json({
    message:"برنامه ی مورد نظر با موفقیت حذف شد",
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