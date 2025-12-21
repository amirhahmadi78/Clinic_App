import mongoose from "mongoose";

const Schema = mongoose.Schema;

const insurancePaymentTransactionSchema = new Schema(
  {
    insuranceContract: {
      type: Schema.Types.ObjectId,
      ref: "InsuranceContract",
      required: true,
    },
    amount: { type: Number, required: true }, // Total amount received for this payment
    date: { type: Date, required: true }, // Date payment was received
    reference: { type: String }, // Payment reference number
    description: { type: String },
    coveredAppointments: [
      {
        appointmentId: {
          type: Schema.Types.ObjectId,
          ref: "appointment",
          required: true,
        },
        insuranceShare: { type: Number, required: true }, // The insurance share for this specific appointment within this payment
      },
    ],
    status: {
      type: String,
      enum: ["recorded", "pending_verification", "rejected"],
      default: "recorded",
    },
  },
  { timestamps: true }
);

export default mongoose.model("InsurancePaymentTransaction", insurancePaymentTransactionSchema);

