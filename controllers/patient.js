import Appointment from "../models/Appointment.js";
import message from "../models/message.js";
import noteBook from "../models/noteBook.js";
import patient from "../models/patient.js";
import { getActiveNotebooksOfPatientTherapists } from "../services/noteBookService.js";


export async function getPatientDetails(req,res,next){
    try {
        const { patientId } = req.params;
        if(!patientId){
            const error=new Error("شناسه مراجع مورد نیاز است!");
            error.statusCode=400;
            return next(error);
        }
        
        const patientData = await patient.findById(patientId);
        if(!patientData){
            const error=new Error("مراجع پیدا نشد!");
            error.statusCode=404;
            return next(error);
        }
        
        res.status(200).json(patientData);
    } catch (error) {
        next(error);
    }
}

export async function showAppointments(req,res,next){
    try {
         const patientId=req.user.id 
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
         const patientId=req.user.id 
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

export async function getTherapistsExercises(req,res,next){
    try {
        const patientId = req.user.id;
        if(!patientId){
            const error=new Error("لطفا اول وارد شوید!")
            error.statusCode=403
            return next(error)
        }

        const notebooks = await getActiveNotebooksOfPatientTherapists(patientId);
        res.status(200).json({
            message: "دفترچه تمرینات درمانگران",
            notebooks
        })
    } catch (error) {
        next(error)
    }
}

export async function GetNotebook(req,res,next) {
    try {
        const{therapistId}=req.query
        const patientId=req.user.id
        const ActiveNoteBook=await noteBook.find({
            patientId,
            therapistId,
            isActive:true
        })
        if(ActiveNoteBook.length>0){
            res.status(200).json(ActiveNoteBook[-1])
        }
        else{
            res.status(200).json({
                message:"این درمانگر هیچ برکه ی تمرین فعال برای شما ندارد"
            })
        }
    } catch (error) {
        
    }
    
}
