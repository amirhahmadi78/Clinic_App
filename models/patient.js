import mongoose from "mongoose";


const Schema = mongoose.Schema;

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date },
  userAgent: String,
  ip: String,
});

const def_Appointment = new mongoose.Schema({
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "therapist",
    required: true,
  },
  therapistName: { type: String },
  start: { type: Date, required: true },
  day: { type: String, required: true },
  end: { type: Date, required: true },
  duration: { type: Number, required: true },
  note: String,
  room: String,
  expiresAt: { type: Date },
});

const workDaySchema = new mongoose.Schema({
 day: {
    type: String,
    enum: [
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ],
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  defaultAppointments: [def_Appointment],
});

const PatientSchema = new Schema(
  {
    modeluser: { type: String, default: "patient" },
    role: { type: String, default: "patient" },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    paymentType: {
      type: String,
      enum: ["bimeh", "naghd"],
      required: true,
      default: "naghd",
    },
    bimehKind:{
      type:String,
      required: function () {
        return this.paymentType === "bimeh";
      }
    },
    discountPercent: {
      type: Number,
    },
    therapists: [
      {
        type: Schema.Types.ObjectId,
        ref: "therapist",
      },
    ],
    address: {
      type: String,
      required: true,
    },
    workDays: {
      type: [workDaySchema],
    },
    introducedBy: { type: mongoose.Schema.Types.ObjectId, ref: "therapist" },
    refreshTokens: {
      type: [RefreshTokenSchema],
    },
    wallet:{
      type:Number,
      required:true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

export default mongoose.model("patient", PatientSchema);
