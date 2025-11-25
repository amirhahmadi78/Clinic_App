
import mongoose from "mongoose";




const Schema = mongoose.Schema;


const transactionsSchema = new Schema(
  {
    amount:{type:Number,
        required:true,
        min: 0
    },
   patientId:{type:mongoose.Schema.Types.ObjectId,
    ref:"patient",
    required:true
   },
   for:{
    type:String,
    required:true,
    enum:["wallet","appointment"]
   }
   ,
   appointmentId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"appointment"
   },
   type:{type:String,
    required:true,
    enum:["induce","reduce"]
   },
   description:{
    type:String,
    required:true
   }
  },
  {
    timestamps: true
  
  }
);

export default mongoose.model("transaction", transactionsSchema);
