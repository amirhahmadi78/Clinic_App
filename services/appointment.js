import financial from "../models/financial.js";

export async function DeleteAtChangeStatus(appointmentId){
    const isExist=await financial.findOneAndDelete({appointmentId:appointmentId})

    
      
        

}