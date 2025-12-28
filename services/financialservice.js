import Appointment from "../models/Appointment.js";
import therapist from "../models/therapist.js";
import patient from "../models/patient.js";
import financial from "../models/financial.js";
import message from "../models/message.js";

export async function addFinancial(appointmentId, userId, payment) {
  try {
    const OneAppointment = await Appointment.findById(appointmentId);
    if (!OneAppointment) {
      const error = new Error("ویزیت مورد نظر یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    const { therapistId, patientId, patientFee, localDay } = OneAppointment;

    const OneTherapist = await therapist.findById(therapistId);
    if (!OneTherapist) {
      const error = new Error("درمانگر مورد نظر یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    const { percentDefault, percentIntroduced } = OneTherapist;
    const OnePatient = await patient.findById(patientId);
    if (!OnePatient) {
      const error = new Error("مراجع مورد نظر یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    const { introducedBy } = OnePatient;
    let percent = percentDefault;
    if (introducedBy && introducedBy.toString() == therapistId.toString()) {
      percent = percentIntroduced;
    } else {
      percent = percentDefault;
    }
    const patientName = OnePatient.firstName + " " + OnePatient.lastName;
    const therapistName = OneTherapist.firstName + " " + OneTherapist.lastName;
    const therapistShare = (patientFee * percent) / 100;
    const clinicShare = patientFee - therapistShare;
    const newFinancial = new financial({
      patientName,
      therapistName,
      appointmentId,
      therapistId,
      patientId,
      patientFee,
      clinicShare,
      therapistShare,
      payment,
      localDay_visit: localDay,
      userId: userId || "68cbcac51a2aa06e0e151dd4", // fellan
    });

    const savedFinancial = await newFinancial.save();
    return {
      message: "ویزیت با موفقیت انجام شد و عملیات امور مالی نیز ثبت شد",
      savedFinancial,
    };
  } catch (error) {
    throw error;
  }
}

export async function dailyFinancialOfTherapist(therapistId, localDay) {
  try {
    localDay = localDay.trim();
    let reports = [];
    let therapistIncome = 0;
    let clinicIncome = 0;
    const appointments = await Appointment.find({ therapistId, localDay });
    if (appointments.length === 0) {
      const error = new Error("درمانگر در روز مورد نظر ویزیت  ندارد");
      error.statusCode = 404;
      throw error;
    }
    for (const OneAppoint of appointments) {
      const Onereport = await financial
        .findOne({ appointmentId: OneAppoint._id })
        .populate([
          { path: "patientId", select: "firstName lastName" },
          {
            path: "appointmentId",
            select: "duration status_clinic status_therapist",
          },
        ])
        .select({
          appointmentId: 1,
          patientFee: 1,
          therapistShare: 1,
          clinicShare: 1,
        });
      if (Onereport) {
        therapistIncome += Onereport.therapistShare;
        clinicIncome += Onereport.clinicShare;
        reports.push(Onereport);
      }
    }
    if (reports.length === 0) {
      const error = new Error(
        "درمانگر در روز مورد نظر ویزیت ثبت شده نداشته است"
      );
      error.statusCode = 404;
      throw error;
    }
    return {
      message: "تراکنش های مالی درمانگر در روز مورد نظر به شرح زیر است",
      reports,
      therapistIncome,
      clinicIncome,
    };
  } catch (error) {
    throw error;
  }
}

export async function monthFinancialOfTherapist(therapistId, startDay, endDay) {
  try {
    startDay = startDay.trim();
    endDay = endDay.trim();
    if (!therapistId || !startDay || !endDay) {
      const error = new Error("تاریخ شروع، پایان یا درمانگر انتخاب نشده است");
      error.statusCode = 400;
      throw error;
    }

    let TotalFinancial = 0;
    let therapistIncome = 0;
    let clinicIncome = 0;
    const appointments = await Appointment.find({
      therapistId,
      localDay: {
        $gte: startDay,
        $lte: endDay,
        
      },
      status_clinic :{
    $in: ["completed-notpaid", "completed-paid", "bimeh"],
  }
    });
    if (appointments.length === 0) {
      return {
        message: "فاقد جلسه ی درمانی در بازه ی مورد نظر می باشد",
        therapistIncome: 0,
        clinicIncome: 0,
        TotalFinancial: 0,
        reports: 0,
      };
    }

   
      for (const Onereport of appointments) {
        therapistIncome += Onereport.therapistShare;
        clinicIncome += Onereport.clinicShare;
        TotalFinancial += Onereport.patientFee;
      }

      return {
        message: "تراکنش های مالی درمانگر در بازه مورد نظر به شرح زیر است",
        therapistIncome,
        clinicIncome,
        TotalFinancial,
        reports:appointments,
      };
    
  } catch (error) {
    throw error;
  }
}

export async function FindAllFinancial(query, page = 1, limit = 20) {
  // فیلترهای پایه
  query.status_clinic = {
    $in: ["completed-notpaid", "completed-paid", "bimeh"],
  };
console.log("injas");

  // شمارش کل رکوردها برای آمار
  const totalRecords = await Appointment.countDocuments(query);

  // محاسبه آمار کلی با aggregation (بهینه‌تر از حلقه)
  const statsResult = await Appointment.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$patientFee" },
        totalClinicShare: { $sum: "$clinicShare" },
        totalTherapistShare: { $sum: "$therapistShare" },
        totalBimeh: {
          $sum: {
            $cond: {
              if: { $eq: ["$status_clinic", "bimeh"] },
              then: "$patientFee",
              else: 0
            }
          }
        },
        totalNot: {
          $sum: {
            $cond: {
              if: { $eq: ["$status_clinic", "completed-notpaid"] },
              then: "$patientFee",
              else: 0
            }
          }
        },
        totalIncome: {
          $sum: {
            $cond: [
              { $or: [
                { $eq: ["$status_clinic", "completed-paid"] },
                { $eq: ["$status_clinic", "completed-notpaid"] },
                { $eq: ["$status_clinic", "bimeh"] }
              ] },
              "$patientFee",
              0
            ]
          }
        }
      }
    }
  ]);

  const stats = statsResult[0] || {
    totalAmount: 0,
    totalClinicShare: 0,
    totalTherapistShare: 0,
    totalBimeh: 0,
    totalNot: 0,
    totalIncome: 0
  };

  // اعمال پیجینیشن با MongoDB skip و limit
  const skip = (page - 1) * limit;
  const financials = await Appointment.find(query)
    .sort({ start: -1 })
    .skip(skip)
    .limit(limit);

  // آمار پیجینیشن
  const totalPages = Math.ceil(totalRecords / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    AppList: financials,
    Amar: [{
      count: totalRecords,
      totalAmount: stats.totalAmount,
      totalClinicShare: stats.totalClinicShare,
      totalTherapistShare: stats.totalTherapistShare,
      totalBimeh: stats.totalBimeh,
      totalNot: stats.totalNot,
      totalIncome: stats.totalIncome,
      paidAmount: stats.totalAmount - stats.totalNot
    }],
    pagination: {
      currentPage: page,
      totalPages,
      totalRecords,
      hasNextPage,
      hasPrevPage,
      limit
    }
  };
}

export async function FindPatientFinance(query) {
  try {
    let TotalFinancial = 0;
    let TotalNotComplete = 0;
    let TotalComplete = 0;
    let Totalbimeh = 0;
    let TotalClinicShare = 0;
    let TotalTherapistShare = 0;
query.status_clinic ={
    $in: ["completed-notpaid", "completed-paid", "bimeh"],
  }
    const financialList = await Appointment
      .find(query)
  
    if (financialList.length === 0) {
      return {
        message: "داده های مورد نظر شما",
        TotalFinancial: 0,
        TotalComplete: 0,
        TotalNotComplete: 0,
        TotalTherapistShare,
        TotalClinicShare: 0,
        Totalbimeh: 0,
        TotalApointment: 0,

        financialList: [],
      };
    }
    for (const Onefinancial of financialList) {
      TotalFinancial += Onefinancial.patientFee;
      TotalClinicShare += Onefinancial.clinicShare;
      TotalTherapistShare += Onefinancial.therapistShare;
      if (Onefinancial.status_clinic === "completed-notpaid") {
        TotalNotComplete += Onefinancial.patientFee;
      }
      if (Onefinancial.status_clinic === "completed-paid") {
        TotalComplete += Onefinancial.patientFee;
      }
      if (Onefinancial.status_clinic === "bimeh") {
        Totalbimeh += Onefinancial.patientFee;
      }
    }
    return {
      message: "داده های مورد نظر شما",
      TotalFinancial,
      TotalComplete,
      TotalNotComplete,
      TotalTherapistShare,
      TotalClinicShare,
      Totalbimeh,
      TotalApointment: financialList.length,

      financialList,
    };
  } catch (error) {
    throw error;
  }
}
