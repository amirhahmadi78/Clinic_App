
import patient from "../models/patient.js";
import bcrypt from "bcrypt";

import therapist from "../models/therapist.js";

import appointment from "../models/Appointment.js";
import financial from "../models/financial.js";
import InsuranceContract from "../models/InsuranceContract.js";


import {
  addFinancial,
  FindAllFinancial,
  FindPatientFinance,
  monthFinancialOfTherapist,
} from "../services/financialservice.js";
import { GetRequests } from "../services/leaveRequestService.js";
import { FindTherapist } from "../services/therapistService.js";
import { GetPatients ,PatientDetails} from "../services/patientServise.js";
import LeaveRequest from "../models/LeaveRequest.js";
import moment from "moment-jalaali";
import { DeleteAtChangeStatus } from "../services/appointment.js";
import salary from "../models/salary.js";
import archiveTherapist from "../models/archiveTherapist.js";
import DefAppointments from "../models/DefAppointments.js";
import message from "../models/message.js";
import mongoose from "mongoose";
import archievePatient from "../models/archievePatient.js";
import Appointment from "../models/Appointment.js";




export async function daily(req,res,next) {
  try {
    const localDay=req.params.localDay
    if (!localDay){
      const error=new Error("لطفا تاریخ مورد نظر را وارد کنید")
      error.statusCode=400
      return next(error)
    }
    const appointments=await appointment.find({localDay})
    if (appointments.length==0){
      const error=new Error("برنامه ی ویزیتی برای تاریخ مورد نظر وجود ندارد")
      error.statusCode=404
      return next(error)
    }
    res.status(200).json({
      message:"لیست همه ی جلسات ویزیت تاریخ مورد نظر",
      appointments
    })
  } catch (error) {
    next(error)
  }
  
}


export async function findTherapists(req, res, next) {
  try {
    const { firstName,lastName, phone, percentDefault, role, skills,id } = req.query;
    let query = {};
    if (role) {
      query.role = role;
    }
     if (id) {
      query.id = id;
    }
    if (skills) {
      query.skills = { $in: skills };
    }
    if (firstName) {
      query.firstName = firstName;
    }
    if (lastName) {
      query.lastName = lastName;
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

export async function RemovePatientToTherapist(req, res, next) {
  try {
    const { patientId, therapistId } = req.body;

    const OneTherapist = await therapist.findById(therapistId);
    const OnePatient = await patient.findById(patientId);
    if (!OneTherapist || !OnePatient) {
      const error = new Error("درمانگر یا مراجع پیدا نشد");
      error.statusCode = 404;
      return next(error);
    }

    if (OneTherapist.patients.includes(patientId)) {
      OneTherapist.patients.pop(patientId);
    }
    if (OnePatient.therapists.includes(therapistId)) {
      OnePatient.therapists.pop(therapistId);
    }

    await Promise.all([OneTherapist.save(), OnePatient.save()]);

    res.status(200).json({
      message: "مراجع از لیست مراجعان درمانگر حذف شد",
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
    }).sort({ start: 1 });
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
    const userId = req.user.id 
    const { appointmentId, status_clinic,payAt,pay_details ,payment} = req.body;
    if (!status_clinic || !appointmentId) {
      const error = new Error("مقادیر وارد شده نادرست است");
      error.statusCode = 404;
      return next(error);
    }
        if (status_clinic=="completed-paid"&(!payAt || !pay_details)) {
      const error = new Error("لطفا تاریخ و جزئیات پرداخت را وارد کنید!");
      error.statusCode = 404;
      return next(error);
    }

    const OneAppointment = await appointment.findById(appointmentId);
    if (!OneAppointment) {
      const error = new Error("ویزیت مورد نظر پیدا نشد");
      error.statusCode = 404;
      return next(error);
    }
if(OneAppointment.status_clinic=="break"){
  return next(new Error("این تایم فقط برای ناهار یا استراحت می باشد و قابل پرداخت یا لغو نمیباشد!"),{
    statusCode:403
  })
}
    OneAppointment.status_clinic = status_clinic;

        if (status_clinic=="canceled"||status_clinic=="scheduled"){
      
          OneAppointment.paidAt=0
  OneAppointment.pay_details=0
  OneAppointment.payment=0
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

    if (
      (status_clinic === "completed-notpaid" ||
        status_clinic === "completed-paid" ||
        status_clinic === "bimeh")
    ){

      // اگر وضعیت به بیمه تغییر کرد، فیلدهای بیمه را پر کن
      if (status_clinic === "bimeh") {
        const patientData = await patient.findById(OneAppointment.patientId);
        if (patientData && patientData.paymentType === "bimeh" && patientData.bimehKind) {
          const insuranceContract = await InsuranceContract.findOne({ name: patientData.bimehKind });
          if (insuranceContract) {
            OneAppointment.insuranceContract = insuranceContract._id;
            OneAppointment.insuranceName = insuranceContract.name;
            OneAppointment.insuranceShare = OneAppointment.patientFee * (insuranceContract.discountRate / 100);

            // بروزرسانی بدهی بیمه - فقط سهم بیمه اضافه شود نه کل مبلغ
            insuranceContract.totalDebtAmount += OneAppointment.insuranceShare;
            insuranceContract.currentBalance = insuranceContract.totalPaidAmount - insuranceContract.totalDebtAmount;
            await insuranceContract.save();
          }
        }else{
          return next(new Error("این مراجع فاقد قرار داد بیمه می باشد!" ,{
            statusCode:403
          }))
        }
      }

       OneAppointment.paidAt=payAt
  OneAppointment.pay_details=pay_details
  OneAppointment.payment=payment
      const updateAppoint=await OneAppointment.save()
      res.status(201).json({
          message: "وضعیت پرداخت تغییر کرد",

          updateAppoint
        });
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

    // Get all leave requests first
    const leaveRequests = await LeaveRequest.find(query).sort({ createdAt: -1 });

    // Populate user data for each request based on userType
    const populatedRequests = [];
    for (const request of leaveRequests) {
      const populatedRequest = await LeaveRequest.populate(request, {
        path: 'user',
        model: request.userType === 'therapist' ? 'therapist' : 'patient',
        select: 'firstName lastName phone role skills'
      });
      populatedRequests.push(populatedRequest);
    }

    res.status(201).json({
      message: RequestsList.message,
      requests: populatedRequests
    });
  } catch (error) {
    next(error);
  }
}

export async function ApproveOrRejectLeaveRequest(req, res, next) {
  try {
    const { requestId, status, adminNotes } = req.body;

    if (!requestId || !status) {
      const error = new Error("شناسه درخواست و وضعیت الزامی هستند");
      error.statusCode = 400;
      return next(error);
    }

    if (!['approved', 'rejected'].includes(status)) {
      const error = new Error("وضعیت باید approved یا rejected باشد");
      error.statusCode = 400;
      return next(error);
    }

    const leaveRequest = await LeaveRequest.findById(requestId).populate('therapist');

    if (!leaveRequest) {
      const error = new Error("درخواست مرخصی یافت نشد");
      error.statusCode = 404;
      return next(error);
    }

    if (leaveRequest.status !== 'pending') {
      const error = new Error("این درخواست قبلاً بررسی شده است");
      error.statusCode = 400;
      return next(error);
    }

    leaveRequest.status = status;
    if (adminNotes) {
      leaveRequest.adminNotes = adminNotes;
    }

    await leaveRequest.save();

    res.status(200).json({
      message: `درخواست مرخصی با موفقیت ${status === 'approved' ? 'تایید' : 'رد'} شد`,
      leaveRequest
    });
  } catch (error) {
    next(error);
  }
}

export async function GetPendingLeaveRequestsCount(req, res, next) {
  try {
    const pendingCount = await LeaveRequest.countDocuments({ status: 'pending' });
    res.status(200).json({ pendingCount });
  } catch (error) {
    next(error);
  }
}

export async function migrateLeaveRequests(req, res, next) {
  try {
    // Find all leave requests that have therapist field but no user field
    const requestsToMigrate = await LeaveRequest.find({
      therapist: { $exists: true },
      user: { $exists: false }
    });

    let migratedCount = 0;
    for (const request of requestsToMigrate) {
      await LeaveRequest.findByIdAndUpdate(request._id, {
        user: request.therapist,
        userType: 'therapist'
      });
      migratedCount++;
    }

    res.status(200).json({
      message: `تعداد ${migratedCount} درخواست مرخصی با موفقیت بروزرسانی شد`,
      migratedCount
    });
  } catch (error) {
    next(error);
  }
}

export async function GetDayLeaveRequests(req, res, next) {
  try {
    const { date } = req.query;


    if (!date) {
      const error = new Error("تاریخ مورد نظر را وارد کنید");
      error.statusCode = 400;
      return next(error);
    }

const targetDate=new Date(date)

const gi=await LeaveRequest.find()
console.log(gi[0]?.startDate)
console.log(targetDate);

    const dayLeaves = await LeaveRequest.find({
      status: { $in: ['approved', 'pending','rejected'] }, // مرخصی‌های تایید شده و در حال بررسی
      $or: [
        // مرخصی‌های روزانه که تاریخ انتخابی بین شروع و پایان باشد
        {
          type: 'daily',
          startDate: { $lte: targetDate },
          endDate: { $gte: targetDate }
        },
        // مرخصی‌های ساعتی که تاریخ startDate برابر با تاریخ انتخابی باشد
        {
          type: 'hourly',
          startDate: {
            $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
            $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
          }
        }
      ]
    })
    .populate({
      path: 'user',
      select: 'firstName lastName phone role skills',
      // اینجا model مشخص نمی‌کنیم، چون refPath خودش مدیریت می‌کند
    })
    .sort({ createdAt: -1 });

    res.status(200).json({
      message: "مرخصی‌های تاریخ مورد نظر",
      date: date,
      leaveRequests: dayLeaves
    });
  } catch (error) {
    next(error);
  }
}

export async function GetAllFinancial(req, res, next) {
  try {
    const { startDay, endDay, payment, page = 1, limit = 20 } = req.query;

    let query = {};

    // اعمال فیلترهای تاریخ
    if (startDay || endDay) {
      query.localDay = {};
      if (startDay) query.localDay.$gte = startDay;
      if (endDay) query.localDay.$lte = endDay;
    }

    // اعمال فیلترهای پرداخت
    if (payment) {
      if (Array.isArray(payment)) {
        query.payment = { $in: payment };
      } else {
        query.payment = payment;
      }
    }

    const response = await FindAllFinancial(query, parseInt(page), parseInt(limit));
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
      query.localDay = { $gte: startDay };
    }
    if (startDay && endDay) {
      query.localDay = { $gte: startDay, $lte: endDay };
    }
    if (!startDay && endDay){
     query.localDay ={ $lte: endDay
    }}
    const list=await FindPatientFinance(query)
    res.status(201).json(list)
  } catch (error) {
    next(error)
  }
}


export async function GetPatientsList(req,res,next){
  try {
    const { firstName,lastName, phone  } = req.query;
    let query = {};
    if (firstName) {
      query.firstName ={$regex: firstName, $options: "i" };
    }

    if (lastName) {
      query.lastName ={$regex: lastName, $options: "i" };
    }

    if (phone) {
      query.phone = phone;
    }
  
    const patientList = await GetPatients(query)
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

export async function MakeTherapist(req,res,next) {
  try {
    
        const { firstName,lastName, phone, role ,skills,percentDefault,percentIntroduced,workDays} = req.body;
    const username=phone
        const existUser = await therapist.findOne({
          $or: [{ username }, {phone}],
        });
    
        if (existUser) {
    
          let message 
     
         if (existUser.phone===phone) {
            message = "شماره تلفن قبلاً ثبت شده است!"
          }     else  if (existUser.username === username) {
            message = "نام کاربری قبلاً ثبت شده است!";
            }
          
          const error = new Error(message);
          error.statusCode = 409;
      
          return next(error);
        }
        
        const password="123456"
        const hashedPassword = await bcrypt.hash(password, 12);
        const newTherapist = new therapist({
          modeluser:"therapist",
          username,
          password: hashedPassword,
          firstName,
          lastName,
          percentDefault,
          percentIntroduced,
          skills,
          phone,
          role,
          workDays
        });

        await newTherapist.save();
        res.status(200).json({
              message: "درمانگر با موفقیت ثبت نام شد!"
            });
  } catch (error) {
     if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
  
}



export async function EditTherapist(req,res,next) {
  try {
    
        const { OldTherapist,workDays,firstName,lastName, phone, role ,skills,percentDefault,percentIntroduced} = req.body;
    const username=phone

      const IsTherapist=await therapist.findById(OldTherapist._id)
      if(!IsTherapist){
        const error = new Error("درمانگر وجود ندارد");
          error.statusCode = 409;
          return next(error);
      }
    const UpdateResault= await therapist.findByIdAndUpdate(OldTherapist._id,{
        modeluser:"therapist",
          username,
          firstName,
          lastName,
          percentDefault,
          percentIntroduced,
          skills,
          phone,
          role,
          workDays
      })
      
        // const existUser = await therapist.findOne({
        //   $or: [{ username }, {phone}],
        // });
    
        // if (existUser) {
    
        //   let message 
     
        //  if (existUser.phone===phone) {
        //     message = "شماره تلفن قبلاً ثبت شده است!"
        //   }     else  if (existUser.username === username) {
        //     message = "نام کاربری قبلاً ثبت شده است!";
        //     }
          
        //   const error = new Error(message);
        //   error.statusCode = 409;
     
        //   return next(error);
        // }
        
       
       
 

    
        res.status(200).json({
              message: "درمانگر با موفقیت ویرایش شد!"
            });
  } catch (error) {
     if (!error.statusCode) {
       if (error.code === 11000) {
    
    

    res.status(400).json({
      success: false,
      message: `  شماره تلفن شما قبلاً ثبت شده است`,
    });
  } else {
    res.status(500).json({ success: false, message: "خطای سرور" });
  }
    }
    next(error);
  }
  

}



export async function ArchiveTherapist(req, res, next) {
  try {
    const { id } = req.body;

    const isTherapist = await therapist.findById(id);
    if (!isTherapist) {
      return next(new Error("درمانگر مورد نظر یافت نشد!"));
    }

    const existingArchive = await archiveTherapist.findOne({ original_id: id });
    
    if (existingArchive) {
      // فقط حذف کن - به ترتیب
      await DefAppointments.deleteMany({ therapistId: id });
      await therapist.deleteOne({ _id: id });
      
    } else {
      // آرشیو کن سپس حذف کن - به ترتیب
      const therapistData = isTherapist.toObject();
      delete therapistData._id;
      
      const newArchive = new archiveTherapist({
        ...therapistData,
        original_id: id,
        archivedAt: new Date()
      });

      await newArchive.save();      // اول آرشیو کن
      await DefAppointments.deleteMany({ therapistId: id }); // سپس حذف کن
      await therapist.deleteOne({ _id: id }); // در آخر درمانگر رو حذف کن
    }

    res.status(200).json({
      message: "عملیات با موفقیت انجام شد"
    });

  } catch (error) {
    next(error);
  }
}


export async function MakePatient(req,res,next) {
  try {
    
        const { firstName,lastName, phone, paymentType ,discountPercent,address,workDays,introducedBy,bimehKind} = req.body;
    const username=phone
        const existUser = await patient.findOne({
          $or: [{ username }, {phone}],
        });
    
        if (existUser) {
    
          let message 
     
         if (existUser.phone===phone) {
            message = "شماره تلفن قبلاً ثبت شده است!"
          }     else  if (existUser.username === username) {
            message = "نام کاربری قبلاً ثبت شده است!";
            }
          
          const error = new Error(message);
          error.statusCode = 409;

          return next(error);
        }
        
 
        const password="123456"
        const hashedPassword = await bcrypt.hash(password, 12);
        const newPatient = new patient({
          modeluser:"patient",
          username,
          password: hashedPassword,
          firstName,
          lastName,
          paymentType,
          bimehKind: paymentType === "bimeh" ? bimehKind : undefined,
          discountPercent,
          address,
          phone,
          workDays,
          wallet:0

        });
if (introducedBy) {
  newPatient.introducedBy = introducedBy;
}
        await newPatient.save();
        res.status(200).json({
              message: "درمانگر با موفقیت ثبت نام شد!"
            });
  } catch (error) {
     if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
  
}


export async function EditPatient(req,res,next) {
  try {
    console.log(req.body);
    
       const { OldPatient,firstName,lastName, phone, paymentType ,discountPercent,address,introducedBy,workDays,bimehKind} = req.body;
    const username=phone

      const IsTherapist=await patient.findById(OldPatient._id)
      if(!IsTherapist){
        const error = new Error("مراجع وجود ندارد");
          error.statusCode = 409;
          return next(error);
      }
    const UpdateResault= await patient.findByIdAndUpdate(OldPatient._id,{
        modeluser:"patient",
          username,
          firstName,
          lastName,
          paymentType,
          bimehKind: paymentType === "bimeh" ? bimehKind : undefined,
          workDays,
          discountPercent,
          phone,
          address,
      })
      
        // const existUser = await therapist.findOne({
        //   $or: [{ username }, {phone}],
        // });
    
        // if (existUser) {
    
        //   let message 
     
        //  if (existUser.phone===phone) {
        //     message = "شماره تلفن قبلاً ثبت شده است!"
        //   }     else  if (existUser.username === username) {
        //     message = "نام کاربری قبلاً ثبت شده است!";
        //     }
          
        //   const error = new Error(message);
        //   error.statusCode = 409;
      
        //   return next(error);
        // }
        
       
       
 

    
        res.status(200).json({
              message: "مراجع با موفقیت ویرایش شد!"
            });
  } catch (error) {
     if (!error.statusCode) {
       if (error.code === 11000) {
    
    

    res.status(400).json({
      success: false,
      message: `  شماره تلفن شما قبلاً ثبت شده است`,
    });
  } else {
    res.status(500).json({ success: false, message: "خطای سرور" });
  }
    }
    next(error);
  }
  

}



export async function DeletePatient(req,res,next) {
 try {
    const { id } = req.body;

    const isPatient = await patient.findById(id);
    if (!isPatient) {
      return next(new Error("مراجع مورد نظر یافت نشد!"));
    }

    const existingArchive = await archievePatient.findOne({ original_id: id });
    
    if (existingArchive) {
     
      await DefAppointments.deleteMany({ patientId: id });
      await patient.deleteOne({ _id: id });
      
    } else {
    
      const patientData = isPatient.toObject();
      delete patientData._id;
      
      const newArchive = new archievePatient({
        ...patientData,
        original_id: id,
        archivedAt: new Date()
      });
console.log("ahaau");
      await newArchive.save();  
      console.log("ahaau222");
         
      await DefAppointments.deleteMany({ patientId: id }); 
      await patient.deleteOne({ _id: id }); 
    }

    res.status(200).json({
      message: "عملیات با موفقیت انجام شد"
    });

  } catch (error) {
    next(error);
  }
  
}

export async function GetArchiveTherapists(req, res, next) {
  try {
    const ArchivedTherapistList=await archiveTherapist.find()
    res.status(200).json(ArchivedTherapistList)
  } catch (error) {
    next(error)
  }
}

export async function RestoreTherapist(req, res, next) {
  try {
    const { original_id } = req.body;
console.log(original_id);

    // 1. بررسی وجود رکورد در آرشیو
    const archivedRecord = await archiveTherapist.findOne({ original_id });
    if (!archivedRecord) {
      return next(new Error("رکورد آرشیو شده با این شناسه یافت نشد!"));
    }

    // 2. بررسی وجود درمانگر فعال با همین ID (برای جلوگیری از تداخل)
    const existingTherapist = await therapist.findById(original_id);
    if (existingTherapist) {
      return next(new Error("درمانگر با این شناسه هم‌اکنون فعال است!"));
    }

    // 3. آماده‌سازی داده‌ها برای بازگردانی
    const therapistData = archivedRecord.toObject()
    
    // حذف فیلدهای خاص آرشیو
    delete therapistData._id;
    delete therapistData.original_id;
    delete therapistData.archivedAt;
    delete therapistData.createdAt;
    delete therapistData.updatedAt;

    // 4. بازگردانی درمانگر
    const restoredTherapist = new therapist({
      ...therapistData,
      _id: original_id  // استفاده از ID اصلی
    });

    await restoredTherapist.save();

    // 5. حذف از آرشیو
    await archiveTherapist.deleteOne({ original_id });

    res.status(200).json({
      message: "درمانگر با موفقیت بازگردانی شد",
      data: {
        id: restoredTherapist._id,
        name: restoredTherapist.name,
        restoredAt: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
}



export  async function TherapistAtDay(req,res,next){
try {
  const { date } = req.query;
  const dayOfWeek = moment(date, "YYYY-MM-DD").format("dddd");


  let therapists = await therapist.find({
    "workDays.day": dayOfWeek
  });

 
  const dailyLeaves = await LeaveRequest.find({
    startDay: { $lte: date },
    endDay: { $gte: date }
  });


  const hourlyLeaves = await LeaveRequest.find({
    localDay: date
  });


  const availableTherapists = therapists.filter(t => {
    const tId = t._id.toString();

    
    if (dailyLeaves.some(l => l.user.toString() === tId)) return false;

    
    if (hourlyLeaves.some(l => l.user.toString() === tId)) return false;

    return true;
  });


  res.json(availableTherapists);

  
} catch (error) {
  next(error)
}
  

}


export  async function RelateTherapist_Patient(req,res,next){
try {

  const {therapistId,patientId}=req.body

  
if (patientId==1){
  const OneTherapist=await therapist.findById(therapistId).populate("patients")
  if (!OneTherapist){
    return next(new Error("درمانگر یافت نشد",{
      statusCode:404
    }))
  }

  
  res.status(200).json(OneTherapist)
}

if(therapistId==1){
  const OnePatient=await patient.findById(patientId).populate("therapists")
  if (!OnePatient){
     return next(new Error("مراجع یافت نشد",{
      statusCode:404
    })) 
  }
  res.status(200).json(OnePatient)
}
} catch (error) {
  next(error)
}



}


export async function AddSalary(req,res,next) {
 
  
  const{type,payAt,ATModel,YYYYMM,fee,payment,coderahgiri,note,payDate}=req.body
  if (!type|| !payAt||!ATModel|| !YYYYMM|| !fee|| !payment|| !coderahgiri||!payDate){
     return next(new Error("مقادیر وارد شده نادرست است",{
      statusCode:401
    }))
    }
    const payBy={
      
      userId:req.user.id,
      fullName:req.user.firstName+" "+req.user.lastName
    
    }
    
  const query={
    ATModel,
    type,
    payBy,
    BYModel:req.user.modeluser,
    payAt,
    YYYYMM,
    payDate,
    fee,
    payment,
    coderahgiri,
    note:note||""
  }
  try {
      const newSalary= new salary(query)

      await newSalary.save()
      res.status(201).json({newSalary,
          message:"فیش واریزی شما با موفقیت در لیست حقوق ها ثبت شد"
      })

  } catch (error) {
      next(error)
  }
} 

export async function GEtMonthSalary(req,res,next) {
  try {
    
    
    const {YYYYMM}=req.query
    if(!YYYYMM){
      return next(new Error("لطفا یک ماه را برای بررسی فبش ها انتخاب کنید",{
        statusCode:401
      }))
    }
  
    const transactions=await salary.find({YYYYMM})
      res.status(200).json({
        message:"لیست تراکنش ها",
        transactions
      })
  } catch (error) {
    next(error)
  }
  
}

export async function GEtMonthSalaryTherapist(req,res,next) {
  try {
    
    
    const {therapistId,YYYYMM}=req.query
    if(!YYYYMM||!therapistId){
      return next(new Error("یک درمانگر انتخاب کنید و یک ماه را برای بررسی فبش ها انتخاب کنید",{
        statusCode:401
      }))
    }

let monthsalary=0
    const salaries=await salary.find({YYYYMM,"payAt.userId":therapistId})
if(salaries.length>0){
  salaries.map(item=>{
    monthsalary+=item.fee
  })
}


      res.status(200).json({
        message:"لیست تراکنش ها",
        salaries,
        monthsalary
      })
  } catch (error) {
    next(error)
  }
  
}


export async function GetTherapistBalance(req, res, next) {
  // ... existing code ...
}


export async function PostChangegroupStatus(req, res, next) {
  try {
    const { appointmentId, status_clinic } = req.body;
    if (!appointmentId || !status_clinic) {
      return next(new Error("مقادیر وارد شده ناقص است", { statusCode: 400 }));
    }

    const OneApp = await appointment.findById(appointmentId);
    if (!OneApp) {
      return next(new Error("کلاس یافت نشد", { statusCode: 404 }));
    }

    OneApp.status_clinic = status_clinic;
    
    // اگر وضعیت به "scheduled" یا "canceled" تغییر کرد، پرداخت‌های قبلی را حذف می‌کنیم؟
    // فعلا طبق درخواست کاربر فقط وضعیت را تغییر می‌دهیم.
    
    const result = await OneApp.save();
    res.status(200).json({
      success: true,
      message: "وضعیت کلاس با موفقیت تغییر کرد",
      result
    });
  } catch (error) {
    next(error);
  }
}


export async function GetUnprocessedAppointments(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;

    // ایجاد aggregation pipeline برای گرفتن جلسات نامشخص با پیجینیشن
    const pipeline = [
      {
        $facet: {
          // جلسات گروه 1: درمانگر تمام کرده اما کلینیک لغو یا برنامه‌ریزی شده
          group1: [
            {
              $match: {
                $and: [
                  { status_clinic: { $in: ["canceled", "scheduled"] } },
                  { status_therapist: "completed" }
                ]
              }
            },
            {
              $addFields: { conflictType: "therapist_completed_clinic_pending" }
            }
          ],
          // جلسات گروه 2: کلینیک تمام کرده اما درمانگر غایب یا برنامه‌ریزی شده
          group2: [
            {
              $match: {
                $and: [
                  { status_clinic: { $in: ["completed-notpaid", "completed-paid", "bimeh"] } },
                  { status_therapist: { $in: ["absent", "scheduled"] } }
                ]
              }
            },
            {
              $addFields: { conflictType: "clinic_completed_therapist_pending" }
            }
          ]
        }
      },
      {
        $project: {
          allAppointments: {
            $concatArrays: ["$group1", "$group2"]
          }
        }
      },
      {
        $unwind: "$allAppointments"
      },
      {
        $replaceRoot: { newRoot: "$allAppointments" }
      },
      {
        $sort: { start: -1 }
      },
      {
        $group: {
          _id: null,
          appointments: { $push: "$$ROOT" },
          totalCount: { $sum: 1 }
        }
      }
    ];

    const result = await appointment.aggregate(pipeline);
    const data = result[0] || { appointments: [], totalCount: 0 };

    // اعمال پیجینیشن
    const skip = (page - 1) * limit;
    const paginatedAppointments = data.appointments.slice(skip, skip + limit);

    // آمار پیجینیشن
    const totalRecords = data.totalCount;
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      appointments: paginatedAppointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
}


export async function GetAvailaibleTime(req,res,next){
  try {
    const{therapistId}=req.query
    if(!therapistId){
      return next(new Error("لطفا درمانگر را انتخاب کنید",{
        statusCode:402
      }))
    }
    const Onetherapist=await therapist.findById(therapistId)
 if(!Onetherapist){
      return next(new Error("درمانگر مورد نظر یافت نشد!",{
        statusCode:402
      }))
    }

    const availableTime=Onetherapist.workDays
    res.status(200).json({availableTime})
  } catch (error) {
    next(error)
  }
}


export async function CheckPatient(req,res,next){
  try {
    const{patientId}=req.query
    if (!patientId){
      return next(new Error("لطفا اول درمانگر را انتخاب کنید",{
        statusCode:401
      }))
    }

let cancel=[]
    const All=await appointment.find({
      patientId
    })

  All.map(item=>{
  

    if (item.status_clinic=="canceled"){
      cancel.push(item)
    }
  })
    

const CancelPercent=cancel.length/All.length *100

    res.status(201).json({cancel,CancelPercent})
  } catch (error) {
    next(error)
  }
}


export async function FindOnePatient(req,res,next){
  try {
    const{patientId}=req.query
    const OnePatient =await patient.findById(patientId)
    if(!OnePatient){
      return next(new Error("مراجع مورد نظر وجود ندارد"),{
        statusCode:404
      })
    }
    res.status(200).json(OnePatient)
  } catch (error) {
    next(error)
  }
}

export async function GetArchivePatients(req,res,next){
 try {
  const archievePatients=await archievePatient.find()
  res.status(200).json(archievePatients)
 } catch (error) {
  next(error)
 }



}

export async function RestorePatient(req, res, next) {
  try {
    const { original_id } = req.body;
console.log(original_id);

    // 1. بررسی وجود رکورد در آرشیو
    const archivedRecord = await archievePatient.findOne({ original_id });
    if (!archivedRecord) {
      return next(new Error("رکورد آرشیو شده با این شناسه یافت نشد!"));
    }

    // 2. بررسی وجود درمانگر فعال با همین ID (برای جلوگیری از تداخل)
    const existingPatient = await patient.findById(original_id);
    if (existingPatient) {
      return next(new Error("مراجع با این شناسه هم‌اکنون فعال است!"));
    }

    // 3. آماده‌سازی داده‌ها برای بازگردانی
    const patientData = archivedRecord.toObject()
    
    // حذف فیلدهای خاص آرشیو
    delete patientData._id;
    delete patientData.original_id;
    delete patientData.archivedAt;
    delete patientData.createdAt;
    delete patientData.updatedAt;

    // 4. بازگردانی درمانگر
    const restoredPatient = new patient({
      ...patientData,
      _id: original_id  // استفاده از ID اصلی
    });

    await restoredPatient.save();

    // 5. حذف از آرشیو
    await archievePatient.deleteOne({ original_id });

    res.status(200).json({
      message: "درمانگر با موفقیت بازگردانی شد",
      data: {
        id: restoredPatient._id,
        name: restoredPatient.name,
        restoredAt: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
}


export async function destroyPatient(req, res, next) {
  try {

    
    const {original_id}=req.query

    
    if(!original_id){
      return next(new Error("درمانگر انتخاب نشده") ,{
        statusCode:402
      })
    }
    const Deleted=await archievePatient.deleteOne({original_id})
    res.status(201).json(Deleted)
  } catch (error) {
    next(error)
  }
}

export async function destroytherapist(req, res, next) {
    try {
    const {original_id}=req.query
    if(!original_id){
      return next(new Error("درمانگر انتخاب نشده") ,{
        statusCode:402
      })
    }
    const Deleted=await archiveTherapist.deleteOne({original_id})
    res.status(201).json(Deleted)
  } catch (error) {
    next(error)
  }
}

export async function GetAppDetails(req, res, next) {
try {

    const{appointmentId}=req.query


    const ExistApp=await Appointment.findById(appointmentId).populate("groupSession.therapists.therapistId  groupSession.patients")
    if(!ExistApp){
      next(new Error("جلسه ی مورد نظر یافت نشد",{
        statusCode:404
      })) 
    }
    res.status(200).json(ExistApp)
} catch (error) {
  next(error)
}

}



export async function GetTodayPatients(req,res,next){
 
  try {
    const {day}=req.query
   
    

   
    const patientList=await patient.find({'workDays.day':day})
    res.status(200).json({
      patientList
    })
    
  } catch (error) {
    error.message="خطا در دریافت مراجعین این تاریخ"
    next(error)
  }
}