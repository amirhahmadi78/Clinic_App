import mongoose from "mongoose";

const Schema=mongoose.Schema

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },   
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date },
  userAgent: String,
  ip: String,
});

const PatientSchema=new Schema({
    modeluser: { type: String, default: "patient" },
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
   firstName:{
        type:String,
        required:true
    },
    lastName:{
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
    introducedBy: { type: mongoose.Schema.Types.ObjectId, ref: "therapist" },
    refreshTokens:{
   type: [RefreshTokenSchema]
}
}
,
{
    timestamps:true,
     toJSON: {
    transform(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      return ret;
    }
  }
    
})

export default mongoose.model("patient",PatientSchema)