import { DateTime } from "luxon";
import moment from "moment-jalaali";

function getPersianDayOfWeek(dayNumber) {
  switch(dayNumber) {
    case 6: return "Saturday";
    case 7: return "Sunday";
    case 1: return "Monday";
    case 2: return "Tuesday";
    case 3: return "Wednesday";
    case 4: return "Thursday";
    case 5: return "Friday";
    default: return "Invalid day";
  }
}

export function checkTherapistAvailability(patient, start, end, therapist) {
  try {
    const patientDays = patient.workDays;
    const therapistDays = therapist.workDays;
    
    const appointmentStart = DateTime.fromJSDate(new Date(start), { zone: "Asia/Tehran" });
    const appointmentEnd = DateTime.fromJSDate(new Date(end), { zone: "Asia/Tehran" });
    
    const dayNumber = appointmentStart.weekday;
    const TrueDay = getPersianDayOfWeek(dayNumber);

 

    const DayOfpatient = patientDays.find(item => item.day === TrueDay);
    const DayOftherapist = therapistDays.find(item => item.day === TrueDay);

    if (!DayOfpatient) throw new Error("مراجع در این روز کاری ندارد");
    if (!DayOftherapist) throw new Error("درمانگر در این روز کاری ندارد");


    const appointmentStartTime = appointmentStart.toFormat("HH:mm");
    const appointmentEndTime = appointmentEnd.toFormat("HH:mm");



  
    if (appointmentStartTime < DayOftherapist.startTime || appointmentEndTime > DayOftherapist.endTime) {
      throw new Error(`تایم درخواستی خارج از محدوده درمانگر است (${DayOftherapist.startTime} - ${DayOftherapist.endTime})`);
    }

    if (appointmentStartTime < DayOfpatient.startTime || appointmentEndTime > DayOfpatient.endTime) {
      throw new Error(`تایم درخواستی خارج از محدوده مراجع است (${DayOfpatient.startTime} - ${DayOfpatient.endTime})`);
    }

    return { available: true };

  } catch (error) {

    return {
      available: false,
      error: error.message
    };
  }
}