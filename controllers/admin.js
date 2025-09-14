// import admin from "../models/admin.js";
// import patient from "../models/patient.js";
import therapist from "../models/therapist.js";

export async function findTherapists(req,res,next){
    try {
      
    const query = {};
        if (req.query.role) query.role = req.query.role;
        if (req.query.skills) query.skills = req.query.skills;

        const therapistsList = await therapist.find(query);
        if(!therapistsList || therapistsList.length === 0){
             res.status(404).json({
            message:"درمانگر با مشخصات مورد نظر یافت نشد"
        })
        }
       
    
     res.status(200).json({
            therapistsList
        })
    } catch (error) {
        next(error)
    }
    
}