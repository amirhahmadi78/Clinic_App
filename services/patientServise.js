import Appointment from "../models/Appointment.js";
import patient from "../models/patient.js";

export async function GetPatients(query){
  try {
      const patientList=await patient.find(query).populate("therapists","firstName lastName role")
   if(patientList.length===0){
    const error=new Error("مراجع پیدا نشد")
    error.statusCode=404
    throw error
   }

   return {
    message: "مراجعین با موفقیت دریافت شدند",
    patientList
   }
  } catch (error) {
    throw error
  }
}


export async function PatientDetails(patientId){

  try {
        const OnePatient=await patient.findById(patientId).populate("therapists","firstName lastName role")
        if(!OnePatient){
          const error=new Error("مراجع پیدا نشد")
          error.statusCode=404
          throw error
        }
        let query={patientId}
        const appointmentsOfPatient=await Appointment.find(query).populate("therapistId","firstName lastName role");
        return {
            message: "جزئیات مراجع با موفقیت دریافت شد",
          patientdetail:OnePatient,
          appointmentdetail:appointmentsOfPatient
        };
  } catch (error) {
    throw error;
  }
}