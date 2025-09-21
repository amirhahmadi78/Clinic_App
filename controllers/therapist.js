// import patient from "../models/patient.js";
import { DateTime } from "luxon";
import Appointment from "../models/Appointment.js";
import financial from "../models/financial.js";
import therapist from "../models/therapist.js";
import { addFinancial,dailyFinancialOfTherapist,monthFinancialOfTherapist } from "../services/financialservice.js";
import {serviceDailyLeaveRequest,serviceHourlyLeaveRequest} from "../services/leaveRequestService.js"
import LeaveRequest from "../models/LeaveRequest.js";
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

export async function writeReport(req,res,next){
  try {
    const {appointmentId,report}=req.body
    if(!appointmentId || !report){
       const error = new Error("ویزیت انتخاب نشده یا گزارشی وارد نکرده اید!");
      error.statusCode = 400;
      return next(error);
    }
    const OneAppointment=await Appointment.findById(appointmentId)
    if(!OneAppointment){
       const error = new Error("ویزیت مورد نظر یافت نشد!");
      error.statusCode = 404;
      return next(error);
    }
    // if(req.userId!==OneAppointment.therapistId){
    //    const error = new Error("خطای دسترسی ! فقط درمانگر مربوطه اجازه ایجاد گزارش را دارد");
    //   error.statusCode = 403;
    //   return next(error);
    // } felan
    OneAppointment.report=report
    const newAppointmat=await OneAppointment.save()
    res.status(201).json({
      message:"گزارش با موفقیت ثبت شد",
      newAppointmat
    })


  } catch (error) {
    next(error)
  }
}

export async function postDailyLeaveRequest(req,res,next){
  try {
     const{userId,startDate,endDate,text}=req.body
        // if (userId!==req.user.id){
        //     const error=new Error("خطای دسترسی! در خواست مرخصی با با مشخصات یوزر مطابقت ندارد")
        //     error.statusCode=403
        //     return next(error) 
        // } felan
        if(!userId||!startDate,!endDate,!text){
            const error=new Error("لطفا مقادیر ورودی را وارد نمایید")
            error.statusCode=400
            return next(error) 
        }
        const userType="therapist" //felan req.user.role
        const LeaveRequestReport=await serviceDailyLeaveRequest(userId,startDate,endDate,text,userType)
        res.status(201).json(LeaveRequestReport)
  } catch (error) {
    next(error)
  }
}

export async function postHourlyLeaveRequest(req,res,next){
  try {
     const{userId,startDate,endDate,localDay,text}=req.body
        // if (userId!==req.user.id){
        //     const error=new Error("خطای دسترسی! در خواست مرخصی با با مشخصات یوزر مطابقت ندارد")
        //     error.statusCode=403
        //     return next(error) 
        // } felan
        if(!userId||!startDate,!endDate,!text,!localDay){
            const error=new Error("لطفا مقادیر ورودی را وارد نمایید")
            error.statusCode=400
            return next(error) 
        }
        const userType="therapist" //felan req.user.role
        const LeaveRequestReport=await serviceHourlyLeaveRequest(userId,startDate,endDate,text,userType,localDay)
        res.status(201).json(LeaveRequestReport)
  } catch (error) {
    next(error)
  }
}

export async function ShowRequests(req,res,next) {
  try {
    const therapistId="68cbcb0a1a2aa06e0e151dd8"||req.user.id //fellan
     if(!therapistId){
            const error=new Error("لطفا برای دریافت نتیجه ی درخواست وارد حساب کاربری خود شوید")
            error.statusCode=403
            return next(error) 
        }
    const requests=await LeaveRequest.find({user:therapistId})
     if(!requests){
            const error=new Error("درخواستی وجود ندارد")
            error.statusCode=404
            return next(error) 
        }
        res.status(200).json({
          message:"لیست درخواست ها",
          requests
        })
  } catch (error) {
    next(error)
  }
  
}