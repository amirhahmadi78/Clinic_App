import Appointment from "../models/Appointment.js";
import { DateTime } from "luxon";
import { ConflictRole } from "../utils/ConflictRule.js";
import therapist from "../models/therapist.js";
import patient from "../models/patient.js";
import financial from "../models/financial.js";
import moment from "moment-jalaali";
import { checkTherapistAvailability } from "../utils/Available-check.js";
import transaction from "../models/transaction.js";
import priceCache from "../utils/priceCache.js";
import ServicePrice from "../models/ServicePrice.js";
import message from "../models/message.js";
import { log } from "console";


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
      role
    } = req.body;


console.log(req.body);

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

if(type=="break"||type=="lunch"){

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
      patientFee:0,
      therapistShare:0,
      clinicShare:0,
      role,
      status_clinic:"break"
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


}else{
   




    
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
      role,
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

}





   
  } catch (error) {
    next(error);
  }
}

export async function deleteAppointment(req, res, next) {
  try {
    const { appointmentId } = req.body;
    
    // پیدا کردن نوبت برای validation
    const targetAppointment = await Appointment.findById(appointmentId);
    if (!targetAppointment) {
      const error = new Error("ویزیت مورد نظر وجود ندارد");
      error.statusCode = 404;
      return next(error);
    }

    let refundMessage = "";
    
    // چک کردن آیا تراکنش کیف پول برای این نوبت وجود داره
    const walletTransaction = await transaction.findOne({
      appointmentId: appointmentId,
      for: "appointment",
      type: "reduce" // فقط تراکنش‌های پرداخت
    });

    // اگر با کیف پول پرداخت شده بود، بازپرداخت کن
    if (walletTransaction) {
      let patientForRefund = await patient.findById(walletTransaction.patientId);
      
      if (patientForRefund) {
        // بازپرداخت به کیف پول
        patientForRefund.wallet += walletTransaction.amount;
        await patientForRefund.save();
        
        // ایجاد تراکنش بازپرداخت
        await transaction.create({
          patientId: walletTransaction.patientId,
          amount: walletTransaction.amount,
          for: "appointment",
          appointmentId: appointmentId,
          type: "induce",
          description: `بازپرداخت بابت کنسلی جلسه - ${walletTransaction.amount} تومان`
        });

        refundMessage = ` و مبلغ ${walletTransaction.amount} تومان به کیف پول بیمار بازگردانده شد`;
        
        // حذف تراکنش اصلی پرداخت (اختیاری - بهتره نگهش داری برای تاریخچه)
        // await walletTransaction.deleteOne();
      }
    }

    // حذف نوبت
    const deletedAppointment = await Appointment.findByIdAndDelete(appointmentId);

    res.status(200).json({
      message: "ویزیت مورد نظر با موفقیت حذف شد" + refundMessage,
      deletedAppointment,
      refund: {
        wasRefunded: !!walletTransaction,
        amount: walletTransaction?.amount || 0
      }
    });

  } catch (error) {
    console.error("Error in deleteAppointment:", error);
    
    
    const customError = new Error("خطا در حذف ویزیت");
    customError.statusCode = 500;
    next(customError);
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


    const appointments = await Appointment.find({
      $or: [
        { therapistId: req.user.id },
        { "groupSession.therapists.therapistId": req.user.id }
      ],
      localDay,
    })
      .populate("groupSession.patients", "firstName lastName")
      .sort({ start: 1 });
    // if (appointments.length == 0) {
    //   const error = new Error("برنامه ی درمانگر در این تاریخ خالی می باشد");
    //   error.statusCode = 201;
    //   return next(error);
    // }
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
      role
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
if(type=="break"||type=="lunch"){
   therapistToday.forEach((item) => {
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
const result = await Appointment.findByIdAndUpdate(appointmentId, {
      patientName: Truepatient.firstName + " " + Truepatient.lastName,
      therapistName: Truetherapist.firstName + " " + Truetherapist.lastName,
      therapistId,
      patientId,
      type,
      room,
      notes,
      patientFee:0,
      start: startDT,
      end: endDT,
      createdBy,
      duration,
      therapistShare:0,
      clinicShare:0,
      role,
      status_clinic:"break"
    });

    res.status(201).json({ result });


}else{
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
      role
    });

    res.status(201).json({ result });
}

   
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

      const serviceSkill=item.role
      const serviceType=appointmentData.type
      const duration=appointmentData.duration
      const TherapistExist=await therapist.findById(appointmentData.therapistId)
      if (!TherapistExist){
        return next(new Error("درمانگر"+appointmentData.therapistName+"  وجود ندارد"))
      }
      const PatientExist=await patient.findById(appointmentData.patientId)
           if (!PatientExist){
        return next(new Error("مراجع" +appointmentData.patientName+ "وجود ندارد"))
      }
      let basePrice=null
       basePrice=priceCache.getPrice(serviceSkill,serviceType,duration)
     
       
       if(!basePrice){
         basePrice = await ServicePrice.getPrice(
              serviceType,
              serviceSkill,
              duration,
              
            );

       }

       let patientFee
       let therapistShare
       let clinicShare
       if(appointmentData.patientFee==null||!appointmentData.patientFee){
         if(appointmentData.type=="break"||appointmentData.type=="lunch"){
   
            
               patientFee=0
        therapistShare=0
        clinicShare=0
          }else{
 patientFee=basePrice
        if(PatientExist.introducedBy==TherapistExist._id){
          therapistShare=Math.round(basePrice*TherapistExist.percentIntroduced/100)
        }else{
          therapistShare=Math.round(basePrice*TherapistExist.percentDefault/100)
        }
        
        clinicShare=patientFee-therapistShare
          }
       
       }else{

         
             patientFee=appointmentData.patientFee
        therapistShare=appointmentData.therapistShare
        clinicShare=appointmentData.clinicShare
          


  
       }
       
      delete appointmentData.patientFee;
      delete appointmentData.therapistShare;
      delete appointmentData.clinicShare
      const result = new Appointment({
        ...appointmentData,
        patientFee:patientFee,
        therapistShare:therapistShare,
        clinicShare:clinicShare,
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

export async function AddGroup(req, res, next) {
  try {
    const {
      groupSession,
      start,
      duration,
      title,
      room,
      notes,
      patientFee,
      category,
      description,
     
    } = req.body;

    console.log(req.body);
    
    
    const startDT = DateTime.fromISO(start, { zone: "Asia/Tehran" });
    const endDT = startDT.plus({ minutes: duration });
    const localDay = startDT.toFormat("yyyy-MM-dd");
    const createdBy = req.user.Id;

    // بررسی تداخل برای تمام بیماران
    for (const patientId of groupSession.patients) {
      const apps = await Appointment.find({
        patientId: patientId,
        localDay: localDay
      });
      
      for (const app of apps) {
        try {
          ConflictRole(startDT, endDT, app.start, app.end);
        } catch (error) {
         
          const patientName = app.patientName
          
          return res.status(402).json({
            success: false,
            message: ` مراجع ${patientName} در زمان مورد نظر کلاس دیگری دارد`
          });
        }
      }
    }

    // بررسی تداخل برای تمام درمانگران
    for (const therapistId of groupSession.therapists) {
      const apps = await Appointment.find({
        therapistId: therapistId.therapistId,
        localDay: localDay
      });
      
      for (const app of apps) {
        try {
          ConflictRole(startDT, endDT, app.start, app.end);
        } catch (error) {
        
          const therapistName = app.therapistName
          
          return res.status(402).json({
            success: false,
            message: ` درمانگر ${therapistName} در زمان مورد نظر کلاس دیگری دارد`
          });
        }
      }
    }
    let finalPatientFee = patientFee;
    if (!finalPatientFee && groupSession?.onePatientFee) {
      finalPatientFee = groupSession.onePatientFee * newPatients.length;
    }

let therapistShare=0
groupSession.therapists.map(t=>therapistShare+=t.therapistShare)
const clinicShare=finalPatientFee-therapistShare
    // اگر به اینجا رسیدیم یعنی هیچ تداخلی نیست
    const NewGroup = await Appointment.create({
      sessionType: "group",
      start: startDT,
      end: endDT,
      duration,
      localDay,
      type: "session",
      status_clinic: "scheduled",
      role: "therapist",
      description: category,
      room,
      createdBy,
      groupSession,
      patientFee,
      notes,
      clinicShare,
      therapistShare
    });
console.log(NewGroup);

    const MakedGroup = await NewGroup.save();

    res.status(200).json({
      success: true,
      message: "کلاس گروهی با موفقیت ثبت شد!",
      MakedGroup
    });

  } catch (error) {
    next(error);
  }
}

const checkGroupConflicts = async (startDT, endDT, localDay, patients, therapists, excludeAppointmentId = null) => {
  const conflicts = {
    patients: [],
    therapists: []
  };

  // فیلتر برای حذف appointment فعلی از بررسی تداخل
  const filter = { localDay };
  if (excludeAppointmentId) {
    filter._id = { $ne: excludeAppointmentId };
  }

  // بررسی تداخل برای بیماران
  for (const patientId of patients) {
    const patientApps = await Appointment.find({
      ...filter,
      $or: [
        { patientId: patientId },
        { 'groupSession.patients': patientId }
      ]
    });

    for (const app of patientApps) {
      const appStart = DateTime.fromJSDate(app.start);
      const appEnd = DateTime.fromJSDate(app.end);
      
      // بررسی تداخل زمانی
      if (
        (startDT < appEnd && endDT > appStart) ||
        (appStart < endDT && appEnd > startDT)
      ) {
 
        const patientName = app.patientName
        
        conflicts.patients.push({
          patientId,
          patientName,
          conflictAppointment: {
            id: app._id,
            title: app.title || app.patientName || 'جلسه درمانی',
            time: `${moment(app.start).format('HH:mm')}-${moment(app.end).format('HH:mm')}`,
            therapistName: app.therapistName || 'درمانگر'
          }
        });
        break; // نیازی به ادامه چک کردن جلسات دیگر این بیمار نیست
      }
    }
  }

  // بررسی تداخل برای درمانگران
  for (const therapistId of therapists) {
    const therapistApps = await Appointment.find({
      ...filter,
      $or: [
        { therapistId: therapistId },
        { 'groupSession.therapists': {therapistId} }
      ]
    });

    for (const app of therapistApps) {
      const appStart = DateTime.fromJSDate(app.start);
      const appEnd = DateTime.fromJSDate(app.end);
      
      // بررسی تداخل زمانی
      if (
        (startDT < appEnd && endDT > appStart) ||
        (appStart < endDT && appEnd > startDT)
      ) {

        const therapistName =app.therapistName
        
        conflicts.therapists.push({
          therapistId,
          therapistName,
          conflictAppointment: {
            id: app._id,
            title: app.title || app.patientName || 'جلسه درمانی',
            time: `${moment(app.start).format('HH:mm')}-${moment(app.end).format('HH:mm')}`,
            patientName: app.patientName || 'مراجع'
          }
        });
        break; // نیازی به ادامه چک کردن جلسات دیگر این درمانگر نیست
      }
    }
  }

  return conflicts;
};

export async function updateGroup(req, res, next) {
  try {
   
    
    const { groupId } = req.params;
    const {
      groupSession,
      start,
      duration,
      title,
      room,
      notes,
      patientFee,
      category,
      description,
      status_clinic,
      status_therapist
    } = req.body.payload;

    
console.log(groupSession);


    // 1. پیدا کردن جلسه گروهی موجود
    const existingGroup = await Appointment.findById(groupId);
    
    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: "کلاس گروهی یافت نشد"
      });
    }

    if (existingGroup.sessionType !== "group") {
      return res.status(400).json({
        success: false,
        message: "این جلسه یک کلاس گروهی نیست"
      });
    }

    // 2. تبدیل تاریخ‌ها
    const startDT = start ? DateTime.fromISO(start, { zone: "Asia/Tehran" }) : DateTime.fromJSDate(existingGroup.start);
    const endDT = startDT.plus({ minutes: duration || existingGroup.duration });
    const localDay = startDT.toFormat("yyyy-MM-dd");

    // 3. اگر درمانگران یا بیماران تغییر کرده‌اند، بررسی تداخل
    const newPatients = groupSession?.patients || existingGroup.groupSession.patients;
    const newTherapists = groupSession?.therapists.map(t=> t.therapistId) || existingGroup.groupSession.therapists.map(t=> t.therapistId);

    // بررسی تداخل (به جز خود این جلسه)
    const conflicts = await checkGroupConflicts(
      startDT,
      endDT,
      localDay,
      newPatients,
      newTherapists,
      groupId // حذف این جلسه از بررسی تداخل
    );

    // 4. اگر تداخل وجود دارد، خطا برگردان
    if (conflicts.patients.length > 0 || conflicts.therapists.length > 0) {
      let errorMessage = "تداخل زمانی:\n";
      
      if (conflicts.patients.length > 0) {
        errorMessage += "تداخل بیماران:\n";
        conflicts.patients.forEach(conflict => {
          errorMessage += `• بیمار ${conflict.patientName} با جلسه ${conflict.conflictAppointment.title} (${conflict.conflictAppointment.time})\n`;
        });
      }
      
      if (conflicts.therapists.length > 0) {
        errorMessage += "\nتداخل درمانگران:\n";
        conflicts.therapists.forEach(conflict => {
          errorMessage += `• درمانگر ${conflict.therapistName} با جلسه ${conflict.conflictAppointment.title} (${conflict.conflictAppointment.time})\n`;
        });
      }

      return res.status(402).json({
        success: false,
        message: errorMessage.trim(),
        conflicts
      });
    }

    // 5. محاسبه هزینه جدید (اگر تغییر کرده)
    let finalPatientFee = patientFee;
    if (!finalPatientFee && groupSession?.onePatientFee) {
      finalPatientFee = groupSession.onePatientFee * newPatients.length;
    }
const createdBy = req.user.Id;
let therapistShare=0
groupSession.therapists.map(t=>therapistShare+=t.therapistShare)
const clinicShare=finalPatientFee-therapistShare
    // 6. آپدیت جلسه گروهی
    const updatedGroup = {
      sessionType: "group",
      start: startDT,
      end: endDT,
      duration,
      localDay,
      type: "session",
      status_clinic: "scheduled",
      role: "therapist",
      description: category,
      room,
      createdBy,
      groupSession,
      patientFee,
      notes,
      clinicShare ,
      therapistShare
    }
  
 const result=await Appointment.findByIdAndUpdate(groupId,updatedGroup)
 await result.save()
    res.status(200).json({
      success: true,
      message: "کلاس گروهی با موفقیت ویرایش شد",
      updatedGroup:{...updatedGroup,_id:groupId}
    });

  } catch (error) {
    console.error("Error updating group session:", error);
    next(error);
  }
}



export async function payOneOfGroup(req,res,next){
  try {
    const {id,patientId,note,payment}=req.body

    let ExistApp=await Appointment.findById(id)
let lastPaids=[]
    if(ExistApp.Paids.length>0){
      lastPaids=ExistApp.Paids.filter(item=>item.id!=patientId)
    }

    lastPaids.push({
      id:patientId,
      note,
      payment
    })
    if(lastPaids.length==ExistApp.groupSession.patients.length){
      ExistApp.status_clinic="completed-paid"
    }

    ExistApp.Paids=lastPaids
    const result=await ExistApp.save()
    res.status(200).json({
      success:true
      ,result})

  } catch (error) {
    next(error)
  }
}

export async function UnpayOneOfGroup(req,res,next){
  try {
    const {id,patientId,}=req.body

    let ExistApp=await Appointment.findById(id)
     let NewPAIds=ExistApp.Paids.filter(item=>item.id!=patientId)


 
  
      ExistApp.status_clinic="completed-notpaid"
    

    ExistApp.Paids=NewPAIds
    const result=await ExistApp.save()
    res.status(200).json({
      success:true
      ,result})

  } catch (error) {
    next(error)
  }
}

// AppointmentSearch.js
export async function AppointmentSearch(req, res, next) {
  try {
    const payload = req.query;
    const { page = 1, limit = 20 } = payload;
    const query = {};
    console.log("pppp",payload);
    
    // جستجوی متن برای نام مراجع و درمانگر
    if (payload.patientName) {
      query.patientName = { $regex: payload.patientName, $options: 'i' };
    }

    if (payload.therapistName) {
      query.therapistName = { $regex: payload.therapistName, $options: 'i' };
    }

    // جستجوی بازه تاریخ
    if (payload.startDate && payload.endDate) {
      payload.startDate = payload.startDate.trim();
      payload.endDate = payload.endDate.trim();
      query.localDay = {
        $gte: payload.startDate,
        $lte: payload.endDate
      };
    } else if (payload.startDate) {
      query.localDay = { $gte: payload.startDate.trim() };
    } else if (payload.endDate) {
      query.localDay = { $lte: payload.endDate.trim() };
    }
if(payload.insuranceType){
  query.insuranceName=payload.insuranceType
}
    // سایر فیلترها
    if (payload.status_clinic) {
      query.status_clinic = payload.status_clinic;
    } else {
      // اگر کاربر فیلتری انتخاب نکرده، فقط جلسات مالی را نمایش بده
      query.status_clinic = { $in: ["completed-notpaid", "completed-paid", "bimeh"] };
    }
    if (payload.payment) query.payment = payload.payment;
    if (payload.type) query.type = payload.type;
    if (payload.sessionType) query.sessionType = payload.sessionType;
    if (payload.room) query.room = payload.room;

    // جستجوی بازه مبلغ
    if (payload.minAmount || payload.maxAmount) {
      query.patientFee = {};
      if (payload.minAmount) query.patientFee.$gte = Number(payload.minAmount);
      if (payload.maxAmount) query.patientFee.$lte = Number(payload.maxAmount);
    }

    // محاسبه آمار کلی
// بخش aggregate را به این صورت اصلاح کنید:
const stats = await Appointment.aggregate([
  { $match: query },
  {
    $group: {
      _id: null,
      totalAmount: { $sum: "$patientFee" },
      totalClinicShare: { $sum: "$clinicShare" },
      totalTherapistShare: { $sum: "$therapistShare" },
      totalIncome: {
        $sum: {
          $cond: [
            { 
              $in: [
                "$status_clinic", 
                ["completed-notpaid", "completed-paid", "bimeh"]
              ] 
            },
            "$patientFee",
            0
          ]
        }
      },
      paidAmount: {
        $sum: {
          $cond: [
            { 
              $in: [
                "$status_clinic", 
                ["completed-paid"]
              ] 
            },
            "$patientFee",
            0
          ]
        }
      },
      totalBimeh: {
        $sum: {
          $cond: [{ $eq: ["$status_clinic", "bimeh"] }, "$patientFee", 0]
        }
      },
      totalNot: {
        $sum: {
          $cond: [{ $eq: ["$status_clinic", "completed-notpaid"] }, "$patientFee", 0]
        }
      },
      count: { $sum: 1 }
    }
  }
]);

    // اعمال پیجینیشن
    const skip = (page - 1) * limit;
    const AppList = await Appointment.find(query)
      .populate('patientId', 'bimehKind paymentType')
      .sort({ localDay: -1 })
      .skip(skip)
      .limit(limit);

    // آمار پیجینیشن
    const totalRecords = stats[0]?.count || 0;
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const Amar = stats;
    const pagination = {
      currentPage: parseInt(page),
      totalPages,
      totalRecords,
      hasNextPage,
      hasPrevPage,
      limit: parseInt(limit)
    };

    res.status(200).json({AppList, Amar, pagination});

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ 
      message: "خطا در جستجوی اطلاعات",
      error: error.message 
    });
  }
}