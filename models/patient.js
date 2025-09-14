import mongoose from "mongoose";

const Schema=mongoose.Schema

const PatientSchema=new Schema({
    username:{
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
    therapists: [
        {
          type: Schema.Types.ObjectId,
          ref: "therapist"
        }
    ]
}
,
{
    timestamps:true
})

export default mongoose.model("patient",PatientSchema)