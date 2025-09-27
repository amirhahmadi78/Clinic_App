import mongoose from "mongoose";
const Schema=mongoose.Schema

const AdminSchema=new Schema({
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
export default mongoose.model("admin",AdminSchema)