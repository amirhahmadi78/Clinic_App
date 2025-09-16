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
