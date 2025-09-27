import Appointment from "../models/Appointment.js";
import therapist from "../models/therapist.js";
import patient from "../models/patient.js";
import financial from "../models/financial.js";
 
 export async function addFinancial(appointmentId,userId,payment ) {
    
 try {
   
    const OneAppointment = await Appointment.findById(appointmentId);
    if (!OneAppointment) {
      const error = new Error("ویزیت مورد نظر یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    const { therapistId, patientId, patientFee,localDay  } = OneAppointment;
    
    
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
    const therapistShare = (patientFee * percent) / 100;
    const clinicShare = patientFee - therapistShare;
    const newFinancial = new financial({
      appointmentId,
      therapistId,
      patientId,
      patientFee,
      clinicShare,
      therapistShare,
      payment,
      localDay_visit:localDay,
      userId: userId || "68cbcac51a2aa06e0e151dd4", // fellan
    });

    const savedFinancial = await newFinancial.save();
    return({message:"ویزیت با موفقیت انجام شد و عملیات امور مالی نیز ثبت شد",
        savedFinancial}
        );
  } catch (error) {
    throw error;
  }
}



export async function dailyFinancialOfTherapist(therapistId,localDay){
  try {
    localDay=localDay.trim()
     let reports=[]
  let therapistIncome=0
  let clinicIncome=0
  const appointments=await Appointment.find({therapistId,localDay})
  if (appointments.length===0){
    const error=new Error("درمانگر در روز مورد نظر ویزیت  ندارد")
    error.statusCode=404
    throw error
  }
for (const OneAppoint of appointments){
  const Onereport=await financial.findOne({appointmentId:OneAppoint._id}) .populate([
    { path: "patientId", select: "firstName lastName" },
    { path: "appointmentId", select: "duration status_clinic status_therapist" }
  ])
  .select({"appointmentId":1,"patientFee":1,"therapistShare":1,"clinicShare":1});
  if (Onereport){
    therapistIncome+=Onereport.therapistShare
    clinicIncome+=Onereport.clinicShare
    reports.push(Onereport)
  }
}
 if (reports.length===0){
    const error=new Error("درمانگر در روز مورد نظر ویزیت ثبت شده نداشته است")
    error.statusCode=404
    throw error
  }
  return ({
    message:"تراکنش های مالی درمانگر در روز مورد نظر به شرح زیر است",
    reports,
    therapistIncome,
    clinicIncome
  })
  } catch (error) {
    throw error;
    
  }
 
}


export async function monthFinancialOfTherapist(therapistId,startDay,endDay){
  try {
    startDay=startDay.trim()
    endDay=endDay.trim()
   if (!therapistId || !startDay || !endDay) {
  const error = new Error("تاریخ شروع، پایان یا درمانگر انتخاب نشده است");
  error.statusCode = 400;
  throw error;
}

  let TotalFinancial=0   
  let therapistIncome=0
  let clinicIncome=0
  const appointments = await Appointment.find({
      therapistId,
      localDay: {
        $gte: startDay,
        $lte: endDay
      }
    });
  if (appointments.length===0){
    const error=new Error("درمانگر در بازه مورد نظر ویزیت  ندارد")
    error.statusCode=404
    throw error
  }

  const reports=await financial.find({therapistId,localDay_visit:{
     $gte: startDay,
        $lte: endDay
  }}) .populate([
    { path: "patientId", select: "firstName lastName" },
    { path: "appointmentId", select: "duration status_clinic status_therapist localDay" }
  ])
  .select({"appointmentId":1,"patientFee":1,"therapistShare":1,"clinicShare":1});

  if (reports.length===0){
    const error=new Error("درمانگر در بازه مورد نظر ویزیت ثبت شده نداشته است")
    error.statusCode=404
    throw error
  }else{
    for (const Onereport of reports){
    therapistIncome+=Onereport.therapistShare
    clinicIncome+=Onereport.clinicShare
    TotalFinancial+=Onereport.patientFee
    }
 
   
  }
 
  return ({
    message:"تراکنش های مالی درمانگر در بازه مورد نظر به شرح زیر است",
    therapistIncome,
    clinicIncome,
    TotalFinancial,
    reports,
    
  })
  } catch (error) {
    throw error;
    
  }
 
}


export async function FindAllFinancial(query){
  let AllFinancial=[]
  let TotalFinancial=0
  let TotalClinic=0
  let TotalTherapist=0
  const financials=await financial.find(query)
    if (financials.length===0){
    const error=new Error("تراکنش مالی  در بازه مورد نظر وجود  ندارد")
    error.statusCode=404
    throw error
  }
  for (const OneFinancial of financials){
    AllFinancial.push(OneFinancial)
    TotalFinancial+=OneFinancial.patientFee
    TotalClinic+=OneFinancial.clinicShare
    TotalTherapist+=OneFinancial.therapistShare
  }
  return{
    AllFinancial,
    TotalFinancial,
    TotalClinic,
    TotalTherapist
  }
  }

export async function FindPatientFinance(query){
  try {
    let TotalFinancial=0
    let TotalNotComplete=0
    let TotalComplete=0
    let Totalbimeh=0
    let TotalClinicShare=0
    let TotalTherapistShare=0

    const financialList=await financial.find(query).populate({path:["appointmentId","therapistId"],
    select:["firstName","lastName","status_clinic","status_therapist"]
  })
  if (financialList.length===0){
    const error=new Error("تراکنشی با فیلتر های شما یافت نشد!")
    error.statusCode=404
    throw error
  }
  for(const Onefinancial of financialList){
    TotalFinancial+=Onefinancial.patientFee
    TotalClinicShare +=Onefinancial.clinicShare
    TotalTherapistShare+=Onefinancial.therapistShare
    if (Onefinancial.appointmentId.status_clinic==="completed-notpaid"){
      TotalNotComplete +=Onefinancial.patientFee
    }
    if (Onefinancial.appointmentId.status_clinic==="completed-paid"){
      TotalComplete +=Onefinancial.patientFee
    }
     if (Onefinancial.appointmentId.status_clinic==="bimeh"){
      Totalbimeh +=Onefinancial.patientFee
    }
  }
  return {
    message:"داده های مورد نظر شما",
    TotalFinancial,
    TotalComplete,
    TotalNotComplete,
    TotalTherapistShare,
    TotalClinicShare,
    Totalbimeh,
    TotalApointment:financialList.length,
    
    financialList
  }
  } catch (error) {
    throw error
  }
  
}