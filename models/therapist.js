import { ObjectId } from "bson";
import mongoose from "mongoose";
import { ref } from "process";

const Schema=mongoose.Schema

const TherapistSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
          type:String,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:Number,
        required:true,
        unique:true
    },
    role:{
        type:String,
        enum:["SLP","OT","Psy","PT"],
        required:true
    },
    skills: {
  type: [String],
  enum: ['Mental', 'physical', 'SI-PM','SLP','Edocation','Psychologist',"LD"]
},
availableHours: [
    { day: String, startTime: String, endTime: String }],
 patients: [
    {
      type: Schema.Types.ObjectId,
      ref: "patient"
    }
  ]

    
},
{
    timestamps:true
})

export default mongoose.model("therapist" , TherapistSchema)