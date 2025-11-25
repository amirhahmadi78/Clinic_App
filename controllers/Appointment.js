import Appointment from "../models/Appointment.js";
import { DateTime } from "luxon";
import { ConflictRole } from "../utils/ConflictRule.js";
import therapist from "../models/therapist.js";
import patient from "../models/patient.js";
import financial from "../models/financial.js";
import moment from "moment-jalaali";
import { checkTherapistAvailability } from "../utils/Available-check.js";

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
      patientFee,
    } = req.body;

    console.log("START: ", start);

    const startDT = DateTime.fromISO(start, { zone: "Asia/Tehran" });
    const endDT = startDT.plus({ minutes: duration });
    const localDay = startDT.toFormat("yyyy-MM-dd");
    const createdBy = req.user.Id;
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
    );
    console.log("patiessssss" + PatientAppointments);

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

    const { percentDefault, percentIntroduced } = TherapistExist;

    const { introducedBy } = PatientExist;
    let percent = percentDefault;
    if (introducedBy && introducedBy.toString() == therapistId.toString()) {
      percent = percentIntroduced;
    } else {
      percent = percentDefault;
    }
    const therapistShare = (patientFee * percent) / 100;
    const clinicShare = patientFee - therapistShare;

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
      therapistShare,
      clinicShare,
    });
    const CheckAvailable = checkTherapistAvailability(
      PatientExist,
      startDT,
      endDT,
      TherapistExist
    );
    if (CheckAvailable.available == false) {
      return next(new Error(CheckAvailable.error), {
        statusCode: 402,
      });
    }
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
    let { date } = req.query;

    if (!date) {
      const error = new Error(" تاریخ الزامی می باشد!");
      error.statusCode = 400;
      return next(error);
    }
    date = date.trim();
    date = moment(date, "jYYYY-jMM-jDD").format("YYYY-MM-DD");
    const dt = DateTime.fromISO(date, { zone: "Asia/Tehran" });
    const localDay = dt.toFormat("yyyy-MM-dd");
    console.log("localDay", localDay);

    const appointments = await Appointment.find({
      therapistId: req.user.id,
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
    if (!date) {
      return next(new Error("لطفا تاریخ را وارد کنید"));
    }
    date = date.trim();
    date = moment(date, "jYYYY-jMM-jDD").format("YYYY-MM-DD");
    const dt = DateTime.fromISO(date, { zone: "Asia/Tehran" });
    const localDay = dt.toFormat("yyyy-MM-dd");
    const appointments = await Appointment.find({
      patientId: req.user.id,
      localDay,
    });
    if (appointments.length == 0) {
      const error = new Error("برنامه ی مراجع در این تاریخ خالی می باشد");
      error.statusCode = 404;
      return next(error);
    }
    res.status(200).json(appointments);
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

    const appointments = await Appointment.find({
      localDay,
    });

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

export async function GetDailyDef(req, res, next) {
  try {
    const { day } = req.query;

    const Daytherapists = await therapist.find({ "workDays.day": day });
    if (Daytherapists.length == 0) {
      return res.status(200).json({ message: "فاقد درمانگر در روز مورد نظر" });
    }
    res.status(200).json(Daytherapists);
  } catch (error) {
    next(error);
  }
}

export async function EditAppointmen(req, res, next) {
  try {
    const {
      appointmentId,
      therapistId,
      patientId,
      start,
      duration,
      type,
      status,
      room,
      notes,
      patientFee,
    } = req.body.payload;

    if (!appointmentId) {
      return next(
        new Error("لطفا اول جلسه ی را نتخاب نمایید", {
          statusCode: 401,
        })
      );
    }

    const Truetherapist = await therapist.findById(therapistId);
    const Truepatient = await patient.findById(patientId);
    const startDT = DateTime.fromISO(start, { zone: "Asia/Tehran" });
    const endDT = startDT.plus({ minutes: duration });
    const localDay = startDT.toFormat("yyyy-MM-dd");
    const createdBy = req.user.Id;

    let therapistToday = await Appointment.find({
      therapistId,
      localDay,
      _id: { $ne: appointmentId }, // یعنی جلسه فعلی را حذف کن
    });
    therapistToday.forEach((item) => {
      const otherEnd = item.end;
      const otherStart = item.start;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    });

    let patientToday = await Appointment.find({
      patientId,
      localDay,
      _id: { $ne: appointmentId },
    });

    patientToday.forEach((item) => {
      const otherEnd = item.end;
      const otherStart = item.start;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    });
    const CheckAvailable = checkTherapistAvailability(
      Truepatient,
      startDT,
      endDT,
      Truetherapist
    );
    if (CheckAvailable.available == false) {
      return next(new Error(CheckAvailable.error), {
        statusCode: 402,
      });
    }

    const { percentDefault, percentIntroduced } = Truetherapist;

    const { introducedBy } = Truepatient;
    let percent = percentDefault;
    if (introducedBy && introducedBy.toString() == therapistId.toString()) {
      percent = percentIntroduced;
    } else {
      percent = percentDefault;
    }
    const therapistShare = (patientFee * percent) / 100;
    const clinicShare = patientFee - therapistShare;
    const result = await Appointment.findByIdAndUpdate(appointmentId, {
      patientName: Truepatient.firstName + " " + Truepatient.lastName,
      therapistName: Truetherapist.firstName + " " + Truetherapist.lastName,
      therapistId,
      patientId,
      type,
      room,
      notes,
      patientFee,
      start: startDT,
      end: endDT,
      createdBy,
      duration,
      therapistShare,
      clinicShare,
    });

    res.status(201).json({ result });
  } catch (error) {
    next(error);
  }
}

export async function PublishDailyFromDefPlan(req, res, next) {
  try {
    const AllDef = req.body.payload;
    const trueDate = req.body.trueDate;
    const Day = moment(trueDate).format("YYYY-MM-DD");

    for (const item of AllDef) {
      const appointmentData = { ...item };

      delete appointmentData._id;
      delete appointmentData.day;

      const START = moment(item.start).format("HH:mm");
      const END = moment(item.end).format("HH:mm");
      const fullStartdate = `${Day} ${START}`;
      const fullEnddate = `${Day} ${END}`;

      const startDt = DateTime.fromFormat(fullStartdate, "yyyy-MM-dd HH:mm", {
        zone: "Asia/Tehran",
      });
      const endDt = DateTime.fromFormat(fullEnddate, "yyyy-MM-dd HH:mm", {
        zone: "Asia/Tehran",
      });

      const result = new Appointment({
        ...appointmentData,
        start: startDt.toJSDate(),
        localDay: Day,
        end: endDt.toJSDate(),
        date: Day, // اگر فیلد date نیاز باشد
      });

      await result.save();
    }

    res.status(200).json({
      message: "برنامه با موفقیت منتشر شد",
      count: AllDef.length,
    });
  } catch (error) {
    next(error);
  }
}
