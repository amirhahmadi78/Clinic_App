
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
import { DeleteAtChangeStatus } from "../services/appointment.js";
import salary from "../models/salary.js";




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
    const userId = req.user.id 
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

        if (status_clinic=="canceled"||status_clinic=="scheduled"){
      await DeleteAtChangeStatus(appointmentId)
      
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
        status_clinic === "bimeh") &&
      OneAppointment.status_therapist === "completed"
    ) {
      const isFinancial = await financial.findOne({
        appointmentId: appointmentId,
      });
      if (isFinancial) {
      isFinancial.payment=status_clinic
      const updateFinance=await isFinancial.save()
      const updateAppoint=await OneAppointment.save()
      res.status(201).json({
          message: "وضعیت پرداخت تغییر کرد",
          updateFinance,
          updateAppoint
        });
      } else {
        const payment = status_clinic;
        const [resultFinancial, updatedAppointment] = await Promise.all([
          addFinancial(appointmentId, userId, payment),
         await OneAppointment.save(),
        ]);

        res.status(201).json({
          message: "وضعیت ویزیت تغییر و تراکنش مالی ثبت گردید",
          resultFinancial,
          updatedAppointment,
        });
      }
    }
    if((status_clinic === "completed-notpaid" ||
        status_clinic === "completed-paid" ||
        status_clinic === "bimeh") &&
      OneAppointment.status_therapist == "absect"||OneAppointment.status_therapist=="scheduled"){
        const resault=await OneAppointment.save()
         res.status(201).json({
          message: "وضعیت ویزیت تغییر کرد",
         resault
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

    res.status(201).json(RequestsList);
  } catch (error) {
    next(error);
  }
}

export async function GetAllFinancial(req, res, next) {
  try {
    const { startDay, endDay, payment } = req.query;
    if (!startDay || !endDay) {
    const response = await FindAllFinancial({});
    res.status(200).json(response);
    }else{
       let query = { localDay_visit: { $gte: startDay, $lte: endDay } };
    if (payment) {
      query.payment = { $in: payment };
    }
    const response = await FindAllFinancial(query);
    res.status(200).json(response);
    }

   
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



export async function DeleteTherapist(req,res,next) {
  try {
    const id=req.body.id


    const resault=await therapist.findByIdAndDelete(id)
    if(!resault){
      return next( new Error())
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
    
        const { firstName,lastName, phone, paymentType ,discountPercent,address,workDays,introducedBy} = req.body;
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
          discountPercent,
          address,
          phone,
          workDays,
    
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
    
       const { OldPatient,firstName,lastName, phone, paymentType ,discountPercent,address,introducedBy,workDays} = req.body;
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
    const id=req.body.id


    const resault=await patient.findByIdAndDelete(id)
    if(!resault){
      return next(new Error())
    }
    res.status(201).json({
      message:"مراجع با موفقیت حذف شد"
    })
  } catch (error) {
    next(error)
    
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




export async function GetUnprocessedAppointments(req, res, next) {
  try {
    const appointments1 = await appointment.find({
      $and: [
        { status_clinic: { $in: ["canceled", "scheduled"] } },
        { status_therapist: "completed" }
      ]
    });

    const appointments2 = await appointment.find({
      $and: [
        { status_clinic: { $in: ["completed-notpaid", "completed-paid", "bimeh"] } },
        { status_therapist: { $in: ["absent", "scheduled"] } }
      ]
    });

    const AllAppointments = [...appointments1, ...appointments2];

    res.status(200).json(AllAppointments);

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


