import { DateTime } from "luxon";
import DefAppointments from "../models/DefAppointments.js";
import patient from "../models/patient.js";
import therapist from "../models/therapist.js";
import { ConflictRole } from "../utils/ConflictRule.js";
import { checkTherapistAvailability } from "../utils/Available-check.js";

export async function AddDefAppointment(req, res, next) {
  try {
    const {
      therapistId,
      patientId,
      date,
      time,
      duration,
      type,
      room,
      notes,
      patientFee,
    } = req.body;

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
    const endDT = startDT.plus({ minutes: duration });

    const createdBy = req.user.id;
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

    if (!TherapistExist.patients.includes(patientId)) {
      TherapistExist.patients.push(patientId);
      await TherapistExist.save();
    }
    if (!PatientExist.therapists.includes(therapistId)) {
      PatientExist.therapists.push(therapistId);
      await PatientExist.save();
    }

if(type=="lunch"||type=="break"){
   const TherapistAppointments = await DefAppointments.find(
      { therapistId, day: date },
      "start end"
    );

    for (let OneAppointment of TherapistAppointments) {
      const otherStart = OneAppointment.start;
      const otherEnd = OneAppointment.end;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    }
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
 const MakeAppointment = new DefAppointments({
      therapistName: TherapistExist.firstName + " " + TherapistExist.lastName,
      therapistId,
      patientId,
      patientName: PatientExist.firstName + " " + PatientExist.lastName,
      start: startDT.toJSDate(),
      end: endDT.toJSDate(),
      duration,
      type,
      room,
      notes,
      day: date,
      createdBy,
      localDay: trueDay,
      patientFee:0,
      therapistShare:0,
      clinicShare:0,
      role:TherapistExist.role,
      status_clinic:"break"
    });

    const newDefAppointment = await MakeAppointment.save();
    res.status(200).json({
      newDefAppointment,
    });
}else{

    const PatientAppointments = await DefAppointments.find(
      { patientId, day: date },
      "start end"
    );

    for (let OneAppointment of PatientAppointments) {
      const otherStart = OneAppointment.start;
      const otherEnd = OneAppointment.end;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    }

    const TherapistAppointments = await DefAppointments.find(
      { therapistId, day: date },
      "start end"
    );

    for (let OneAppointment of TherapistAppointments) {
      const otherStart = OneAppointment.start;
      const otherEnd = OneAppointment.end;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    }
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

    const MakeAppointment = new DefAppointments({
      therapistName: TherapistExist.firstName + " " + TherapistExist.lastName,
      therapistId,
      patientId,
      patientName: PatientExist.firstName + " " + PatientExist.lastName,
      start: startDT.toJSDate(),
      end: endDT.toJSDate(),
      duration,
      type,
      room,
      notes,
      day: date,
      createdBy,
      localDay: trueDay,
      patientFee,
      therapistShare,
      role:TherapistExist.role,
      clinicShare,
    });

    const newDefAppointment = await MakeAppointment.save();
    res.status(200).json({
      newDefAppointment,
    });

}



  } catch (error) {
    next(error);
  }
}

export async function GetDailyDef(req, res, next) {
  try {
    const { day } = req.query;

    if (!day) {
      return next(new Error("لطفا روز مورد نظر خود را انتخاب کنید"), {
        statusCode: 400,
      });
    }
    const listDefAppointments = await DefAppointments.find({ day });

    res.status(201).json(listDefAppointments);
  } catch (error) {
    next(error);
  }
}

export async function GetDailyDefPatient(req, res, next) {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return next(new Error("لطفا مراجع مورد نظر خود را انتخاب کنید"), {
        statusCode: 400,
      });
    }
    const listDefAppointments = await DefAppointments.find({ patientId});

    res.status(201).json(listDefAppointments);
  } catch (error) {
    next(error);
  }
}

export async function EditDefAppointment(req, res, next) {
  try {
    const {
      therapistId,
      patientId,
      date,
      time,
      duration,
      type,
      room,
      notes,
      patientFee,
      _id,
    } = req.body;

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
    const endDT = startDT.plus({ minutes: duration });

    const createdBy = req.user.id;
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
if(type=="break"||type=="lunch"){
   for (let OneAppointment of TherapistAppointments) {
      const otherStart = OneAppointment.start;
      const otherEnd = OneAppointment.end;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    }

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
 const result = await DefAppointments.findByIdAndUpdate(_id, {
      therapistName: TherapistExist.firstName + " " + TherapistExist.lastName,
      therapistId,
      patientId,
      patientName: PatientExist.firstName + " " + PatientExist.lastName,
      start: startDT.toJSDate(),
      end: endDT.toJSDate(),
      duration,
      type,
      room,
      notes,
      day: date,
      createdBy: createdBy,
      localDay: trueDay,
      patientFee:0,
      therapistShare:0,
      clinicShare:0,
      role:TherapistExist.role,
    });

    res.status(201).json(result);
}else{
 const PatientAppointments = await DefAppointments.find(
      { patientId, day: date, _id: { $ne: _id } },
      "start end"
    );

    for (let OneAppointment of PatientAppointments) {
      const otherStart = OneAppointment.start;
      const otherEnd = OneAppointment.end;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    }

    const TherapistAppointments = await DefAppointments.find(
      { therapistId, day: date, _id: { $ne: _id } },
      "start end"
    );

    for (let OneAppointment of TherapistAppointments) {
      const otherStart = OneAppointment.start;
      const otherEnd = OneAppointment.end;
      ConflictRole(startDT, endDT, otherStart, otherEnd);
    }

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
    const result = await DefAppointments.findByIdAndUpdate(_id, {
      therapistName: TherapistExist.firstName + " " + TherapistExist.lastName,
      therapistId,
      patientId,
      patientName: PatientExist.firstName + " " + PatientExist.lastName,
      start: startDT.toJSDate(),
      end: endDT.toJSDate(),
      duration,
      type,
      room,
      notes,
      day: date,
      createdBy: createdBy,
      localDay: trueDay,
      patientFee,
      therapistShare,
      clinicShare,
      role:TherapistExist.role,
    });

    res.status(201).json(result);
}
   
  } catch (error) {
    next(error);
  }
}

export async function DeleteDefAppointment(req, res, next) {
  try {
    const { _id } = req.body;

    if (!_id) {
      return next(new Error("لطفا اول جلسه را انتخاب کنید"), {
        statusCode: 401,
      });
    }
    const result = await DefAppointments.findByIdAndDelete(_id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
