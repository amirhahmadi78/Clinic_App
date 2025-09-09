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
        enum:["internalManager","admin","secretary"],
    },

    
})
export default mongoose.model("admin",AdminSchema)