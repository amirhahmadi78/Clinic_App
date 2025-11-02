import { ObjectId } from "bson";
import mongoose from "mongoose";
import { type } from "os";
import { ref } from "process";
import { start } from "repl";

const Schema = mongoose.Schema;
const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },   
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date },
  userAgent: String,
  ip: String,
});


const def_Appointment = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "patient", required: true },
  patientName:{type:String},
  start: { type: Date, required: true }, 
  day:{type:String,required:true},
  end: { type: Date ,required:true}, 
  duration: { type: Number, required:true }, 
  note: String, 
  room: String,
  expiresAt:{type:Date} 
});

const workDaySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: [
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ],
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  defaultAppointments: [def_Appointment],
});



const TherapistSchema = new Schema(
  {
    modeluser: { type: String, default: "therapist" },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    workDays:{type:[workDaySchema],
      required:true
    },
    percentDefault: { type: Number, default: 50 },    
  percentIntroduced: { type: Number, default: 60 },
    role: {
      type: String,
      enum: ["SLP", "OT", "PSY", "PT","therapist"],
      default:"therapist"
    },
    skills: {
      type: [String],
      enum: [
        "mental",
        "physical",
        "SI-PM",
        "SLP",
        "education",
        "psychologist",
        "LD",
        "massage",
      ],
    },
    availableHours: [{ day: String, startTime: String, endTime: String }],
    patients: [
      {
        type: Schema.Types.ObjectId,
        ref: "patient",
      },
      
    ],
     refreshTokens:{
   type: [RefreshTokenSchema]
},
isActive:{
  type:Boolean,
  default:true
}
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

export default mongoose.model("therapist", TherapistSchema);
