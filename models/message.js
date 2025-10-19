import mongoose from "mongoose";
const Schema=mongoose.Schema
const MessageSchema=new Schema({
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel"
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["therapist", "admin"]
    },
    receiver: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "receiverModel"
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ["therapist", "admin"]
    },
    content: {
      type: String,
      required: true
    },
    response: {
        type: String,
        default: null
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);
export default mongoose.model("message", MessageSchema);