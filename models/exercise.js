import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ExerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },     
  description: { type: String },   
  category: { type: String, enum: ["speech", "occupational", "physical"], required: true },             
  type: { type: String, enum: ["video", "audio", "image", "text"], required: true },
  fileUrl: { type: String },                    
  createdBy: { type: Schema.Types.ObjectId, ref: "therapist" },
  createdAt: { type: Date, default: Date.now }
});

const exercise = mongoose.model("exercise", ExerciseSchema);
export default exercise;
