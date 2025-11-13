import mongoose from "mongoose";

const Schema = mongoose.Schema;

const salarySchema = new Schema(
  {
    type: { type: String, enum: ["payment", "refund"], default:"payment",required: true },
    payBy: {
      userId: {
        type: Schema.Types.ObjectId,
        refpath: "BYModel",
        required: true,
      },
      fullName: { type: String, required: true },
    },
    BYModel: {
      type: String,
      required: true,
      enum: ["therapist", "admin"],
    },
    payAt: {
      userId: {
        type: Schema.Types.ObjectId,
        refpath: "ATModel",
        required: true,
      },
      fullName: { type: String, required: true },
    },
    payDate:{
      type:String,
      required:true
    },
    ATModel: {
      type: String,
      required: true,
      enum: ["therapist", "admin"],
    },
    YYYYMM: {
      type: String,
      required: true,
    },
    fee: {
      type: Number,
      required: true,
    },
    payment: {
      type: String,
      enum: ["cash", "sheba", "cart", "satna", "havale"],
    },
    coderahgiri: {
      type: Number,
      required: true,
    },
    note: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("salary", salarySchema);
