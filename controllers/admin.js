// import admin from "../models/admin.js";
import e from "express";
import admin from "../models/admin.js";
import appointment from "../models/Appointment.js";
import financial from "../models/financial.js";
import patient from "../models/patient.js";
import therapist from "../models/therapist.js";
import {
  addFinancial,
  FindAllFinancial,
  FindPatientFinance,
  monthFinancialOfTherapist,
} from "../services/financialservice.js";
import { GetRequests } from "../services/leaveRequestService.js";
import { FindTherapist } from "../services/therapistService.js";
import { GetPatients ,PatientDetails} from "../services/patientServise.js";

export async function findTherapists(req, res, next) {
  try {
    const { name, phone, percentDefault, role, skills } = req.query;
    let query = {};
    if (role) {
      query.role = role;
    }
    if (skills) {
      query.skills = { $in: skills };
    }
    if (name) {
      query.name = name;
    }
    if (phone) {
      query.phone = phone;
    }
    if (percentDefault) query.percentDefault;
    const TherapistList = await FindTherapist(query);

    res.status(200).json(TherapistList);
  } catch (error) {
    next(error);
  }
}

export async function AddPatientToTherapist(req, res, next) {
  try {
    const { patientId, therapistId } = req.body;

    const OneTherapist = await therapist.findById(therapistId);
    const OnePatient = await patient.findById(patientId);
    if (!OneTherapist || !OnePatient) {
      const error = new Error("درمانگر یا مراجع پیدا نشد");
      error.statusCode = 404;
      return next(error);
    }

    if (!OneTherapist.patients.includes(patientId)) {
      OneTherapist.patients.push(patientId);
    }
    if (!OnePatient.therapists.includes(therapistId)) {
      OnePatient.therapists.push(therapistId);
    }

    await Promise.all([OneTherapist.save(), OnePatient.save()]);

    res.status(200).json({
      message: "مراجع به لیست مراجعان درمانگر اضافه شد",
      therapist: OneTherapist,
    });
  } catch (error) {
    next(error);
  }
}

export async function DailyScheduleOfTherapist(req, res, next) {
  try {
    const { therapistId, date } = req.query;

    if (!therapistId || !date) {
      const error = new Error("مشخصات درمانگر و تاریخ الزامی هستند");
      error.statusCode = 400;
      return next(error);
    }
    const dt = DateTime.fromISO(date, { zone: "Asia/Tehran" });
    const localDay = dt.toFormat("yyyy-MM-dd");

    const appointments = await appointment.find({
      therapistId,
      localDay,
    });
    if (appointments.length == 0) {
      const error = new Error("برنامه ی درمانگر در این تاریخ خالی می باشد");
      error.statusCode = 404;
      return next(error);
    }
    res.status(200).json({ appointments });
  } catch (err) {
    next(err);
  }
}

export async function adminChangeStatusAndMakefinance(req, res, next) {
  try {
    const userId = req.userId || "68cbcac51a2aa06e0e151dd4"; //felan;
    const { appointmentId, status_clinic } = req.body;
    if (!status_clinic || !appointmentId) {
      const error = new Error("مقادیر وارد شده نادرست است");
      error.statusCode = 404;
      return next(error);
    }
    const OneAppointment = await appointment.findById(appointmentId);
    if (!OneAppointment) {
      const error = new Error("ویزیت مورد نظر پیدا نشد");
      error.statusCode = 404;
      return next(error);
    }

    OneAppointment.status_clinic = status_clinic;

    if (
      (status_clinic === "completed-notpaid" ||
        status_clinic === "completed-paid" ||
        status_clinic === "bimeh") &&
      OneAppointment.status_therapist === "completed"
    ) {
      const isFinancial = await financial.findOne({
        appointmentId: appointmentId,
      });
      if (isFinancial) {
        const error = new Error(
          "امور مالی مربوط به ویزیت مورد نظر ثبت شده می باشد"
        );
        error.statusCode = 404;
        return next(error);
      } else {
        const payment = status_clinic;
        const [resultFinancial, updatedAppointment] = await Promise.all([
          addFinancial(appointmentId, userId, payment),
          OneAppointment.save(),
        ]);

        res.status(201).json({
          message: "وضعیت ویزیت تغییر و تراکنش مالی ثبت گردید",
          resultFinancial,
          updatedAppointment,
        });
      }
    } else {
      const updateAppointment = await OneAppointment.save();
      res.status(201).json({
        message: "وضعیت ویزیت بروز رسانی شد",
        updateAppointment,
      });
      console.log("just Updated: ", updateAppointment);
      if (!updateAppointment) {
        const error = new Error("بروز رسانی وضعیت ویزیت انجام نشد");
        error.statusCode = 402;
        return next(error);
      }
    }
  } catch (error) {
    next(error);
  }
}

export async function GetFindLeaveRequests(req, res, next) {
  try {
    const { user, userType, startDay, endDay, status, localDay, daySearch } =
      req.query;

    let query = {};

    if (user) {
      query.user = user;
    }
    if (status) {
      query.status = status;
    }
    if (userType) {
      query.userType = userType;
    }
    if (daySearch) {
      query.$or = [
        { startDay: { $lte: daySearch }, endDay: { $gte: daySearch } },
        { localDay: daySearch },
      ];
    } else {
      if (startDay) query.startDay = { $lte: startDay };
      if (endDay) query.endDay = { $gte: endDay };
      if (localDay) query.localDay = localDay;
    }

    const RequestsList = await GetRequests(query);

    res.status(201).json(RequestsList);
  } catch (error) {
    next(error);
  }
}

export async function GetAllFinancial(req, res, next) {
  try {
    const { startDay, endDay, payment } = req.query;
    if (!startDay || !endDay) {
      const error = new Error("لطفا بازه ی زمانی مورد نظر را وارد کنید");
      error.statusCode = 400;
      return next(error);
    }

    let query = { localDay_visit: { $gte: startDay, $lte: endDay } };
    if (payment) {
      query.payment = { $in: payment };
    }
    const response = await FindAllFinancial(query);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function GetmonthTherapistIncome(req, res, next) {
  try {
    const { therapistId, startDay, endDay } = req.query;

    if (!endDay || !startDay || !therapistId) {
      const error = new Error("تاریخ یا تراپیست انتخاب نشده است");
      error.statusCode = 400;
      return next(error);
    }
    const response = await monthFinancialOfTherapist(
      therapistId,
      startDay,
      endDay
    );
    res.status(200).json({
      response,
    });
  } catch (error) {
    next(error);
  }
}

export async function GetPatientFinance(req, res, next) {
  try {
    let query = {};
    const { patientId, startDay, endDay } = req.query;
    if (!patientId) {
      const error = new Error("لطفا مراجع مورد نظر را انتخاب کنید");
      error.statusCode = 400;
      return next(error);
    }
    query.patientId = patientId;
    if (startDay && !endDay) {
      query.localDay_visit = { $gte: startDay };
    }
    if (startDay && endDay) {
      query.localDay_visit = { $gte: startDay, $lte: endDay };
    }
    if (!startDay && endDay){
     query.localDay_visit ={ $lte: endDay
    }}
    const list=await FindPatientFinance(query)
    res.status(201).json(list)
  } catch (error) {
    next(error)
  }
}


export async function GetPatientsList(req,res,next){
  try {
    const { name, phone  } = req.query;
    let query = {};
    if (name) {
      query.name ={$regex: name, $options: "i" };
    }

    if (phone) {
      query.phone = phone;
    }
    const patientList = await GetPatients(query);
    res.status(200).json(patientList);
    
  } catch (error) {
    next(error)
  }
}

export async function GetPatientDetails(req,res,next){
  try {
    const { patientId } = req.params;
    if(!patientId){
      const error = new Error("لطفا مراجع مورد نظر را انتخاب کنید");
      error.statusCode = 400;
      return next(error);
    }
    const patientDetails = await PatientDetails(patientId);
    const list=await FindPatientFinance({patientId:patientId})
    res.status(200).json({patientDetails,list});
  } catch (error) {
    next(error);
  }
}