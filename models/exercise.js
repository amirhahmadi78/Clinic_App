import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'therapist',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  fileUrl: {
    type: String, // URL or path to the exercise file (e.g., video, PDF)
    required: true,
  },
  fileType: {
    type: String, // e.g., 'video', 'pdf', 'image'
    enum: ['video', 'pdf', 'image', 'document', 'other'],
    default: 'other',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });
const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema);
export default Exercise;