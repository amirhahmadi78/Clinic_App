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
    role:{
        type:String,
        enum:["internalManager","admin","secretary"],
        required:true
    },

    
})