import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PatientExerciseSchema = new mongoose.Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "patient", required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: "therapist" },
  assignedAt: { type: Date, default: Date.now },
  exercises: [
    {
      exerciseId: { type: Schema.Types.ObjectId, ref: "exercise", required: true },
      note: { type: String }
    }
  ]
});
const noteBook = mongoose.model("noteBook", PatientExerciseSchema);
export default noteBook;
