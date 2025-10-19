import { ObjectId } from "bson";
import mongoose from "mongoose";
import { type } from "os";
import { ref } from "process";

const Schema = mongoose.Schema;
const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },   
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date },
  userAgent: String,
  ip: String,
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
      required: true,
      unique: true,
    },
    phone: {
      type: Number,
      required: true,
      unique: true,
    },
    percentDefault: { type: Number, default: 50 },    
  percentIntroduced: { type: Number, default: 60 },
    role: {
      type: String,
      enum: ["SLP", "OT", "PSY", "PT","therapist"],
      required: true,
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
