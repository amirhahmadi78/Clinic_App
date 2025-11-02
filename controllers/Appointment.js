import Appointment from "../models/Appointment.js";
import { DateTime } from "luxon";
import { ConflictRole } from "../utils/ConflictRule.js";
import therapist from "../models/therapist.js";
import patient from "../models/patient.js";
import financial from "../models/financial.js";
import moment from "moment-jalaali";

export async function AddAppointment(req, res, next) {
  try {
    const {
      therapistId,
      patientId,
      // localDay,
      start,
      duration,
      type,
      status,
      room,
      notes,
      patientFee,
    } = req.body;

    const startDT = DateTime.fromISO(start, { zone: "Asia/Tehran" });
    const endDT = startDT.plus({ minutes: duration });
    const localDay = startDT.toFormat("yyyy-MM-dd");
    const createdBy = req.user.Id || "68c6b48915700380ed73141d";
    const TherapistExist = await therapist.findById(therapistId);
    if (!TherapistExist) {
      const error = new Error("درمانگر مورد نظر وجود ندارد");
      error.statusCode = 404;
      return next(error);
    }

    const PatientExist = await patient.findById(patientId);
    if (!PatientExist) {
      const error = new Error("مراجع مورد نظر وجود ندارد");
      error.statusCode = 404;
      return next(error);
    }

    const PatientAppointments = await Appointment.find(
      { patientId },
      "start end"
    )
    console.log("patiessssss"+PatientAppointments);
    
     for (let OneAppointment of PatientAppointments) {
      const otherStart = OneAppointment.start;
      const otherEnd = OneAppointment.end;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    }

    const TherapistAppointments = await Appointment.find(
      { therapistId },
      "start end"
    );

    for (let OneAppointment of TherapistAppointments) {
      const otherStart = OneAppointment.start;
      const otherEnd = OneAppointment.end;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    }

    

    const MakeAppointment = new Appointment({
      therapistName: TherapistExist.firstName + " " + TherapistExist.lastName,
      therapistId,
      patientId,
      patientName: PatientExist.firstName + " " + PatientExist.lastName,
      start: startDT.toJSDate(),
      end: endDT.toJSDate(),
      duration,
      type,
      status,
      room,
      notes,
      createdBy,
      localDay,
      patientFee,
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
    const { appointmentId } = req.body;
    let FinancialOperations = "ویزیت حذف شده فاقد عملیات مالی بود";
    const deletedAppointment = await Appointment.findByIdAndDelete(
      appointmentId
    );
    const deleteFinancial = await financial.findOneAndDelete({
      appointmentId: appointmentId,
    });
    if (deleteFinancial) {
      FinancialOperations = "عملیات مالی مورد نظر حذف گردید";
    }
    if (!deletedAppointment) {
      const error = new Error("ویزیت مورد نظر وجود ندارد");
      error.statusCode = 404;
      return next(error);
    }
    res.status(200).json({
      message: " ویزیت مورد نظر با موفقیت حذف شد و" + FinancialOperations,
      deletedAppointment,
    });
  } catch (error) {
    error = new Error("برنامه ی مورد نظر وجود ندارد");
    error.statusCode = 404;

    next(error);
  }
}

export async function DailyScheduleOfTherapist(req, res, next) {
  try {
    let {  date } = req.query;

    if ( !date) {
      const error = new Error(" تاریخ الزامی می باشد!");
      error.statusCode = 400;
      return next(error);
    }
    date = date.trim();
    date=moment(date, 'jYYYY-jMM-jDD').format('YYYY-MM-DD')
    const dt = DateTime.fromISO(date, { zone: "Asia/Tehran" });
    const localDay = dt.toFormat("yyyy-MM-dd");
console.log("localDay",localDay);

    const appointments = await Appointment.find({
      therapistId:req.user.id,
      localDay,
    });
    if (appointments.length == 0) {
      const error = new Error("برنامه ی درمانگر در این تاریخ خالی می باشد");
      error.statusCode = 201;
      return next(error);
    }
    res.status(200).json({ appointments });
  } catch (err) {
    next(err);
  }
}

export async function DailyScheduleOfPatient(req, res, next) {
  try {
    let { date } = req.query;
    if(!date){
      return next(new Error("لطفا تاریخ را وارد کنید"))
    }
    date = date.trim();
    date=moment(date, 'jYYYY-jMM-jDD').format('YYYY-MM-DD')
    const dt = DateTime.fromISO(date, { zone: "Asia/Tehran" });
    const localDay = dt.toFormat("yyyy-MM-dd");
    const appointments = await Appointment.find({ patientId:req.user.id, localDay });
    if (appointments.length == 0) {
      const error = new Error("برنامه ی مراجع در این تاریخ خالی می باشد");
      error.statusCode = 404;
      return next(error);
    }
    res.status(200).json(
      appointments
    );
  } catch (error) {
    next(error);
  }
}

export async function DailySchedule(req, res, next) {
  try {
    let { date } = req.query;

    if (!date) {
      const error = new Error("   تاریخ الزامی هستند");
      error.statusCode = 400;
      return next(error);
    }
    date = date.trim();
    const dt = DateTime.fromISO(date, { zone: "Asia/Tehran" });
    const localDay = dt.toFormat("yyyy-MM-dd");
    
    console.log("localDay:", localDay);

    const appointments = await Appointment.find({
      localDay,
    });
    console.log(appointments);

    // if (appointments.length==0){
    //   const error = new Error("برنامه در این تاریخ خالی می باشد");
    //   error.statusCode = 201;
    //   return next(error);
    // }
    res.status(200).json({ appointments });
  } catch (err) {
    next(err);
  }
}

export async function AddDefAppointment(req, res, next) {
  try {
    const { therapistId, date, patientId, time, duration, expiresAt, note } = req.body;

    // ۱. پیدا کردن درمانگر و روز کاری مربوطه
    const def_Appointments = await therapist.findOne(
      { _id: therapistId, "workDays.day": date },
      { "workDays.$": 1 }
    );

    // ۲. روزهای هفته و تاریخ‌های مرجع
    const dayToDate = {
      Saturday: "2025-10-25",
      Sunday: "2025-10-26",
      Monday: "2025-10-27",
      Tuesday: "2025-10-28",
      Wednesday: "2025-10-29",
      Thursday: "2025-10-30",
      Friday: "2025-10-31",
    };

    const trueDay = dayToDate[date];
    if (!trueDay) {
      const error = new Error("روز هفته نامعتبر است!");
      error.statusCode = 400;
      return next(error);
    }

    // ۳. ساخت زمان شروع بر اساس منطقه زمانی ایران
    const fulldate = `${trueDay} ${time}`;
    const startD = DateTime.fromFormat(fulldate, "yyyy-MM-dd HH:mm", {
      zone: "Asia/Tehran",
    });
    const startDT = DateTime.fromISO(startD, { zone: "Asia/Tehran" });
console.log(date);

    // if (!startDT.isValid) {
    //   const error = new Error("زمان شروع نامعتبر است!");
    //   error.statusCode = 400;
    //   return next(error);
    // }

    const endDT = startDT.plus({ minutes: duration });

    // ۴. بررسی وجود مراجع
    const onePatient = await patient.findById(patientId);
    if (!onePatient) {
      const error = new Error("مراجع مورد نظر یافت نشد!");
      error.statusCode = 404;
      return next(error);
    }

    // ۵. بررسی تداخل زمانی
    if (def_Appointments && def_Appointments.workDays.length !== 0) {
      def_Appointments.workDays.map((one) => {
        const otherStart = one.start;
        const otherEnd = one.end;
        ConflictRole(startDT, endDT, otherStart, otherEnd);
      });
    }

    // ۶. افزودن نوبت ثابت
    const AddAdef_Appointment = await therapist.updateOne(
      { _id: therapistId, "workDays.day": date },
      {
        $push: {
          "workDays.$.defaultAppointments": {
            patientId,
            patientName: `${onePatient.firstName} ${onePatient.lastName}`,
            start: startDT.toISO(), // ذخیره به فرمت استاندارد ISO
            end: endDT.toISO(),
            day:date,
            duration,
            note,
            expiresAt,
          },
        },
      }
    );

    res.status(200).json({
      message: "افزودن به برنامه ثابت انجام شد",
      result: AddAdef_Appointment,
    });

  } catch (error) {
    next(error);
  }
}

export async function GetDailyDef(req, res, next) {
  try {
    const { day } = req.query;

    const Daytherapists = await therapist.find({ "workDays.day": day });
    if(Daytherapists.length==0){
      return res.status(200).json({message:"فاقد درمانگر در روز مورد نظر"})
    }
    res.status(200).json(Daytherapists);
  } catch (error) {
    next(error);
  }
}
