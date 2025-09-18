import mongoose from "mongoose";

const Schema=mongoose.Schema

const PatientSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
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
    ],
    introducedBy: { type: mongoose.Schema.Types.ObjectId, ref: "therapist" }
}
,
{
    timestamps:true,
     toJSON: {
    transform(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
    
})

export default mongoose.model("patient",PatientSchema)