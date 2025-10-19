import Appointment from "../models/Appointment.js";
import patient from "../models/patient.js";


export async function showAppointments(req,res,next){
    try {
         const patientId="68cbce268f3612e82e6ffeb4"||req.user.id //felan
    if(!patientId){
           const error=new Error("لطفا اول وارد شوید!")
            error.statusCode=403
            return next(error) 
    }
    const {localDay}=req.body
    if (!localDay){
        const error=new Error("لطفا یک تاریخ برای دریافت برنامه جلسات درمانی انتخاب کنید!")
            error.statusCode=403
            return next(error) 
    }
    const appontments=await Appointment.find({patientId,localDay})
     if(appontments.length===0){
           const error=new Error("در تاریخ مورد نظر جلسه ی درمانی وجود ندارد!")
            error.statusCode=403
            return next(error) 
    }
    res.status(200).json({
        message:"لیست جلسات درمانی",
        appontments
    })
    } catch (error) {
        next(error)
    }
   
}


export async function showTherapists(req,res,next){
    try {
         const patientId="68cbce268f3612e82e6ffeb4"||req.user.id //felan
    if(!patientId){
           const error=new Error("لطفا اول وارد شوید!")
            error.statusCode=403
            return next(error) 
    }
    
    const thisPatient=await patient.findById(patientId).populate("therapists", "firstName lastName role") 
     if(!thisPatient.therapists||thisPatient.therapists.length===0){
           const error=new Error("درمانگری در لیست شما وجود ندارد!")
            error.statusCode=403
            return next(error) 
    }
    const therapistList=thisPatient.therapists
    res.status(200).json({
        message:"لیست درمانگران مربوط به درمانگر",
        therapistList
    })
    } catch (error) {
        next(error)
    }
}


export async function showNotPaid(req,res,next){
    try {
         const patientId="68cbce268f3612e82e6ffeb4"||req.user.id //felan
    if(!patientId){
           const error=new Error("لطفا اول وارد شوید!")
            error.statusCode=403
            return next(error) 
    }
    
    const notpaid=await Appointment.find({status_clinic:"completed-notpaid"})
     if(notpaid.length===0){
           const error=new Error("شما بدهکاری ندارید!")
            error.statusCode=404
            return next(error) 
    }
    let Total=0
    for (const One of notpaid){
        Total +=One.patientFee
    }
    res.status(200).json({
        message:"لیست ویزیت های پرداخت نشده و مجموع بدهکاری",
        notpaid,
        Total
    })
    } catch (error) {
        next(error)
    }
}
