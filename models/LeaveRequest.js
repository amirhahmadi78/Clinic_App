import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType',
  },
  userType: {
    type: String,
    required: true,
    enum: ['therapist', 'patient'],
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'therapist',
  },
  type: {
    type: String,
    enum: ['daily', 'hourly'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  startTime: {
    type: String, // HH:mm format
  },
  endTime: {
    type: String, // HH:mm format
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
