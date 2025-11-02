import mongoose from "mongoose";
const Schema=mongoose.Schema
const financialSchema = new Schema({
    appointmentId:{
         type:Schema.Types.ObjectId,
    ref: "appointment",
    required: true,
    unique:true
    },
    therapistName:{
      type:String,
      required:true
    },
    patientName:{
       type:String,
      required:true
    }
    ,
  therapistId: {
    type: Schema.Types.ObjectId,
    ref: "therapist",
    required: true,
    index: true,
  },
  patientId: { type: Schema.Types.ObjectId, ref: "patient", required: true },
   patientFee: { type: Number, required: true },        
  clinicShare: { type: Number, required: true },      
  therapistShare: { type: Number, required: true },  
  localDay_visit:{type:String , required:true},
  payment:{type:String,required:true},
  status: { 
    type: String
  },
  userId:{
     type: Schema.Types.ObjectId, ref: "admin", required: true
  } 
},{
    timestamps:true
});

export default mongoose.model("financial",financialSchema)
