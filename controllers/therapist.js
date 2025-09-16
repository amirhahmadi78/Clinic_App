// import patient from "../models/patient.js";
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

