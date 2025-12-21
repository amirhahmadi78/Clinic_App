import mongoose from "mongoose";

const Schema = mongoose.Schema;

const insuranceContractSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
    contractDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "pending", "expired"],
      default: "active",
    },
    coverage: [{ type: String }], // Array of services covered
    discountRate: { type: Number, min: 0, max: 100, default: 0 },
    lastPaymentDate: { type: Date }, // Date of last payment received from this insurance
    totalPaidAmount: { type: Number, default: 0 }, // Total amount ever paid by this insurance
    totalDebtAmount: { type: Number, default: 0 }, // Total debt owed by insurance (calculated from services)
    currentBalance: { type: Number, default: 0 }, // currentBalance = totalPaidAmount - totalDebtAmount
  },
  { timestamps: true }
);

export default mongoose.model("InsuranceContract", insuranceContractSchema);

