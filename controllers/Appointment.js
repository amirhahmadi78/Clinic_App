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
        patientFee=basePrice
        if(PatientExist.introducedBy==TherapistExist._id){
          therapistShare=Math.round(basePrice*TherapistExist.percentIntroduced/100)
        }else{
          therapistShare=Math.round(basePrice*TherapistExist.percentDefault/100)
        }
        
        clinicShare=patientFee-therapistShare
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
        patientFee,
        therapistShare,
        clinicShare,
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
