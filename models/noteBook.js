import mongoose from "mongoose";

const Schema = mongoose.Schema;

const PatientExerciseSchema = new mongoose.Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "patient", required: true },
  therapistId: { type: Schema.Types.ObjectId, ref: "therapist" , required: true },
  title: { type: String, required: true, default: function() {
    return `نوت‌بوک ${new Date().toLocaleDateString('fa-IR')}`;
  }},
  note: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  assignedAt: { type: Date, default: Date.now },

  exercises: [
    {
      exerciseId: { type: Schema.Types.ObjectId, ref: "Exercise", required: true },
      note: { type: String, default: "" }
    }
  ]
},
{ timestamps: true });

// ایندکس برای بهبود عملکرد جستجو
PatientExerciseSchema.index({ patientId: 1, therapistId: 1, isActive: -1 });

export default mongoose.model("noteBook", PatientExerciseSchema);

