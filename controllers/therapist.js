import Appointment from "../models/Appointment.js";
import financial from "../models/financial.js";
import therapist from "../models/therapist.js";
import { addFinancial,dailyFinancialOfTherapist,monthFinancialOfTherapist } from "../services/financialservice.js";
// import {serviceDailyLeaveRequest,serviceHourlyLeaveRequest} from "../services/leaveRequestService.js" // Removed old service imports
import LeaveRequest from "../models/LeaveRequest.js";
import { DeleteAtChangeStatus } from "../services/appointment.js";
import message from "../models/message.js";
import Exercise from "../models/Exercise.js"; // Re-added Exercise import
import { log } from "console";

export async function ShowPatients(req, res, next) {
  try {
    const therapistId = req.user.id; // Get therapist ID from authenticated user
    console.log(therapistId);
    
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
    const userId = req.user.id 
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

  const newAppointmat=await OneAppointment.save()

  res.status(200).json({
    newAppointmat,
    message:"وضعیت ویزیت با موفقیت تغییر کرد"
  })
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
    const{startDay,endDay}=req.query
    
    if (!endDay||!startDay){
      const error = new Error("تاریخ یا تراپیست انتخاب نشده است");
      error.statusCode = 400;
      return next(error);
    }
    const therapistId=req.user.id
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

export async function createLeaveRequest(req, res, next) {
  try {
    const therapistId = req.user.id;
    const { type, startDate, endDate, startTime, endTime, reason } = req.body;

    if (!type || !startDate || !reason) {
      const error = new Error("لطفا تمام فیلدهای ضروری را وارد کنید.");
      error.statusCode = 400;
      return next(error);
    }

    if (type === 'hourly' && (!startTime || !endTime)) {
      const error = new Error("برای مرخصی ساعتی، زمان شروع و پایان الزامی است.");
      error.statusCode = 400;
      return next(error);
    }

    const newLeaveRequest = new LeaveRequest({
      user: therapistId,
      userType: 'therapist',
      therapist: therapistId,
      type,
      startDate,
      endDate: type === 'daily' ? endDate : startDate, // For hourly, endDate is same as startDate
      startTime: type === 'hourly' ? startTime : null,
      endTime: type === 'hourly' ? endTime : null,
      reason,
    });

    const savedLeaveRequest = await newLeaveRequest.save();

    res.status(201).json({
      message: "درخواست مرخصی با موفقیت ثبت شد.",
      leaveRequest: savedLeaveRequest,
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    error.statusCode = 500;
    next(error);
  }
}

export async function getTherapistLeaveRequests(req, res, next) {
  try {
    const therapistId = req.user.id;

    const leaveRequests = await LeaveRequest.find({ therapist: therapistId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "لیست درخواست‌های مرخصی درمانگر",
      leaveRequests,
    });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    error.statusCode = 500;
    next(error);
  }
}

export async function deleteLeaveRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const therapistId = req.user.id;

    // فقط درخواست‌هایی که در انتظار هستند قابل حذف هستند
    const deletedRequest = await LeaveRequest.findOneAndDelete({ 
      _id: requestId, 
      therapist: therapistId,
      status: 'pending' 
    });

    if (!deletedRequest) {
      const error = new Error("درخواست یافت نشد یا شما اجازه حذف آن را ندارید (فقط درخواست‌های در انتظار قابل حذف هستند).");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      message: "درخواست مرخصی با موفقیت حذف شد.",
      deletedRequest,
    });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    error.statusCode = 500;
    next(error);
  }
}

// Exercise Controllers
export async function uploadExercise(req, res, next) {
  try {
    const therapistId = req.user.id;
    const { title, description, fileUrl, fileType } = req.body;

    if (!title || !fileUrl) {
      const error = new Error("عنوان و آدرس فایل تمرین الزامی است.");
      error.statusCode = 400;
      return next(error);
    }

    const newExercise = new Exercise({
      therapist: therapistId,
      title,
      description,
      fileUrl,
      fileType,
    });

    const savedExercise = await newExercise.save();

    res.status(201).json({
      message: "تمرین با موفقیت آپلود شد.",
      exercise: savedExercise,
    });
  } catch (error) {
    console.error("Error uploading exercise:", error);
    error.statusCode = 500;
    next(error);
  }
}

export async function getTherapistExercises(req, res, next) {
  try {
    const therapistId = req.user.id;

    const exercises = await Exercise.find({ therapist: therapistId })
      .sort({ uploadedAt: -1 });

    res.status(200).json({
      message: "لیست تمرینات درمانگر",
      exercises,
    });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    error.statusCode = 500;
    next(error);
  }
}

export async function updateExercise(req, res, next) {
  try {
    const { exerciseId } = req.params;
    const therapistId = req.user.id;
    const { title, description, fileUrl, fileType } = req.body;

    const updatedExercise = await Exercise.findOneAndUpdate(
      { _id: exerciseId, therapist: therapistId },
      { title, description, fileUrl, fileType },
      { new: true, runValidators: true }
    );

    if (!updatedExercise) {
      const error = new Error("تمرین یافت نشد یا شما اجازه ویرایش آن را ندارید.");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      message: "تمرین با موفقیت به روز شد.",
      exercise: updatedExercise,
    });
  } catch (error) {
    console.error("Error updating exercise:", error);
    error.statusCode = 500;
    next(error);
  }
}

export async function deleteExercise(req, res, next) {
  try {
    const { exerciseId } = req.params;
    const therapistId = req.user.id;

    const deletedExercise = await Exercise.findOneAndDelete({ _id: exerciseId, therapist: therapistId });

    if (!deletedExercise) {
      const error = new Error("تمرین یافت نشد یا شما اجازه حذف آن را ندارید.");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      message: "تمرین با موفقیت حذف شد.",
      exercise: deletedExercise,
    });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    error.statusCode = 500;
    next(error);
  }
}
