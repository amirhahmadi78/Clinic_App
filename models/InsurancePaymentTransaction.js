import mongoose from "mongoose";

const Schema = mongoose.Schema;

const insurancePaymentTransactionSchema = new Schema(
  {
    insuranceContract: {
      type: Schema.Types.ObjectId,
      ref: "InsuranceContract",
      required: true,
    },
    amount: { type: Number, required: true }, // Amount received for this payment
    date: { type: Date, required: true }, // Date payment was received
    reference: { type: String }, // Payment reference number
    description: { type: String },
    paymentType: {
      type: String,
      enum: ["partial", "full", "advance"],
      default: "partial",
    },
    status: {
      type: String,
      enum: ["recorded", "pending_verification", "rejected"],
      default: "recorded",
    },
  },
  { timestamps: true }
);

export default mongoose.model("InsurancePaymentTransaction", insurancePaymentTransactionSchema);

