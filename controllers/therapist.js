import patient from "../models/patient.js";
import therapist from "../models/therapist.js";


export async function ShowPatients(req,res,next) {
    try {
          const therapistId=req.userId || req.params.therapistId

    const OneTherapist=await therapist.findById(therapistId).populate('patients')
     if (!OneTherapist) {
            return res.status(404).json({ message: "درمانگر  پیدا نشد" });
        }

    const patients=OneTherapist.patients
    res.status(200).json({
        patients
    })
    } catch (error) {
        console.log(error);
        error.statusCode=500
        next(error)
        
    }
}

export async function AddPatientToTherapist(req,res,next){
    try {
         const {patientId,therapistId}=req.body

    const OneTherapist=await therapist.findById(therapistId)
    const OnePatient=await patient.findById(patientId)
     if (!OneTherapist || !OnePatient) {
            return res.status(404).json({ message: "درمانگر یا مراجع پیدا نشد" });
        }

        
        if (!OneTherapist.patients.includes(patientId)) {
            OneTherapist.patients.push(patientId);
        }
        if (!OnePatient.therapists.includes(therapistId)) {
            OnePatient.therapists.push(therapistId);
        }

        await Promise.all([OneTherapist.save(), OnePatient.save()]);

  
    res.status(200).json({
        message:"مراجع به لیست مراجعان درمانگر اضافه شد",
        therapist:OneTherapist
    })
   
    } catch (error) {
        error.statusCode=500
        next(error)
    }
   
}