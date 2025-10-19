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


const AdminSchema=new Schema({
    modeluser: { type: String, default: "admin" },
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
        type:String,
        required:true,
        unique:true
    },
    role:{
        type:String,
        enum:["internalManager","admin","secretary"],
        required:true
    },
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


export default mongoose.model("admin",AdminSchema)