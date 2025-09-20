// import patient from "../models/patient.js";
import { DateTime } from "luxon";
import Appointment from "../models/Appointment.js";
import financial from "../models/financial.js";
import therapist from "../models/therapist.js";
import { addFinancial,dailyFinancialOfTherapist,monthFinancialOfTherapist } from "../services/financialservice.js";

export async function ShowPatients(req, res, next) {
  try {
    const therapistId = req.userId || req.params.therapistId;

    const OneTherapist = await therapist
      .findById(therapistId)
      .populate("patients");
    if (!OneTherapist) {
      return res.status(404).json({ message: "درمانگر  پیدا نشد" });
    }

    const patients = OneTherapist.patients;
    res.status(200).json({
      patients,
    });
  } catch (error) {
    console.log(error);
    error.statusCode = 500;
    next(error);
  }
}

export async function therapistChangeStatusAndMakefinance(req, res, next) {
  try {
    const userId = req.userId || "68cbcac51a2aa06e0e151dd4"; //felan;
    const { appointmentId, status_therapist } = req.body;
    if (!status_therapist || !appointmentId) {
      const error = new Error("مقادیر وارد شده نادرست است");
      error.statusCode = 404;
      return next(error);
    }
    const OneAppointment = await Appointment.findById(appointmentId);
    if (!OneAppointment) {
      const error = new Error("ویزیت مورد نظر پیدا نشد");
      error.statusCode = 404;
      return next(error);
    }

    OneAppointment.status_therapist = status_therapist;

    if (
      (OneAppointment.status_clinic === "completed-notpaid" ||
        OneAppointment.status_clinic === "completed-paid" ||
        OneAppointment.status_clinic === "bimeh") &&
      status_therapist === "completed"
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
        const [resultFinancial, updatedAppointment] = await Promise.all([
          addFinancial(appointmentId, userId),
          OneAppointment.save(),
        ]);

        res.status(201),json({
          message:"وضعیت ویزیت تغییر و تراکنش مالی ثبت گردید",
          resultFinancial,
          updatedAppointment
        })
      }
    } else {
      const updateAppointment = await OneAppointment.save();
      res.status(201).json({
        message: "وضعیت ویزیت بروز رسانی شد",
        updateAppointment,
      });
    
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

export async function GetdailyTherapistIncome(req,res,next){
  try {
    const{localDay}=req.query
    const therapistId=req.userId||"68cbcb0a1a2aa06e0e151dd8" //felan
    if (!localDay||!therapistId){
      const error = new Error("تاریخ یا تراپیست انتخاب نشده است");
      error.statusCode = 400;
      return next(error);
    }
    const response=await dailyFinancialOfTherapist(therapistId,localDay)
    res.status(200).json({
      response
    })
  } catch (error) {
    next(error)
  }
}

export async function GetmonthTherapistIncome(req,res,next){
  try {
    const{therapistId,startDay,endDay}=req.query
    
    if (!endDay||!startDay||!therapistId){
      const error = new Error("تاریخ یا تراپیست انتخاب نشده است");
      error.statusCode = 400;
      return next(error);
    }
    const response=await monthFinancialOfTherapist(therapistId,startDay,endDay)
    res.status(200).json({
      response
    })
  } catch (error) {
    next(error)
  }
}