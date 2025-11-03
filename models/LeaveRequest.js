
import mongoose from "mongoose"
const Schema = mongoose.Schema;
const LeaveRequestSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "userType",
  },
  userType: {
    type: String,
    required: true,
    enum: ["therapist", "admin"], 
  },

  startDay:{ type: String },
  endDay:{ type: String },
  startDate: { type: String},
 
  endDate: { type: String },
  localDay:{type: String},
  text: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
},{timestamps:true});

export default mongoose.model("LeaveRequest", LeaveRequestSchema);
