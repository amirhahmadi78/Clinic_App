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
     role: { type: String, default: "patient" },
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
    phone:{
        type:String,
        required:true,
        unique:true
    },
    paymentType:{type:String,
      enum:["bimeh","naghd"],
      required:true,
      default:"naghd"
    },
    discountPercent:{
      type:Number
    }
    ,
    therapists: [
        {
          type: Schema.Types.ObjectId,
          ref: "therapist"
        }
    ],
    address:{
       type:String,
        required:true
    },
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