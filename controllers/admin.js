
import patient from "../models/patient.js";
import bcrypt from "bcrypt";

import therapist from "../models/therapist.js";

import appointment from "../models/Appointment.js";
import financial from "../models/financial.js";


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
    const { firstName,lastName, phone, percentDefault, role, skills } = req.query;
    let query = {};
    if (role) {
      query.role = role;
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
          console.log(error);
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
        //   console.log(error);
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



export async function DeleteTherapist(req,res,next) {
  try {
    const id=req.body.id
console.log(id);

    const resault=await therapist.findByIdAndDelete(id)
    if(!resault){
      return new Error()
    }
    res.status(201).json({
      message:"درمانگر با موفقیت حذف شد"
    })
  } catch (error) {
    next(error)
    
  }
  
}

export async function MakePatient(req,res,next) {
  try {
    
        const { firstName,lastName, phone, paymentType ,discountPercent,address,introducedBy} = req.body;
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
          console.log(error);
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
          discountPercent,
          address,
          phone,
          // introducedBy,
        });

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
    
       const { OldPatient,firstName,lastName, phone, paymentType ,discountPercent,address,introducedBy} = req.body;
    const username=phone

      const IsTherapist=await patient.findById(OldPatient._id)
      if(!IsTherapist){
        const error = new Error("مراجع وجود ندارد");
          error.statusCode = 409;
          return next(error);
      }
    const UpdateResault= await patient.findByIdAndUpdate(OldPatient._id,{
        modeluser:"therapist",
          username,
          firstName,
          lastName,
          paymentType,
          // introducedBy,
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
        //   console.log(error);
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
    const id=req.body.id


    const resault=await patient.findByIdAndDelete(id)
    if(!resault){
      return new Error()
    }
    res.status(201).json({
      message:"مراجع با موفقیت حذف شد"
    })
  } catch (error) {
    next(error)
    
  }
  
}


export default async function TherapistAtDay(req,res,next){
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
    console.log(req.body);
  const {therapistId,patientId}=req.body

  
if (patientId==1){
  const OneTherapist=await therapist.findById(therapistId).populate("patients")
  if (!OneTherapist){
    return next(new Error("درمانگر یافت نشد",{
      statusCode:404
    }))
  }
  console.log(OneTherapist);
  
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