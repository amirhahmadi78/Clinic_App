import mongoose from "mongoose";

const Schema = mongoose.Schema;

const appointmentSchema = new Schema(
  {
    start: { type: Date, required: true, index: true }, // UTC Date
    end: { type: Date, required: true, index: true }, // UTC Date
    duration: { type: Number, required: true }, // minutes, computed (end-start)
    type: {
      type: String,
      enum: ["session", "assessment", "break", "online", "lunch"],
      default: "session",
    },
    patientFee: {
      type: Number,
      required: true,
    },
    status_clinic: {
      type: String,
      enum: [
        "scheduled",
        "completed-notpaid",
        "completed-paid",
        "canceled",
        "bimeh",
        "absent",
        "break",
      ],
      default: "scheduled",
    },
    role: {
      type: String,
      enum: ["SLP", "OT", "PSY", "PT", "therapist"],
      required: true,
    },
    status_therapist: {
      type: String,
      enum: ["scheduled", "completed", "absent"],
      default: "scheduled",
    },
    room: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "admin" }, //felan
    localDay: { type: String, index: true },
    report: { type: String },
    clinicShare: { type: Number, required: true },
    therapistShare: { type: Number, required: true },
    paidAt: { type: String },
    pay_details: { type: String },
    payment: {
      type: String,
      enum: ["card", "transfer", "cash", "wallet", "0","bimeh"],
      default: "0",
    },
  
    insuranceContract: {
      type: Schema.Types.ObjectId,
      ref: "InsuranceContract",
      default: null,
    },
    insuranceShare: { type: Number, default: 0 },
    bimeh: {
      type: Boolean,
      default: false,
    }
    ,
    sessionType: {
      type: String,
      enum: ["individual", "group"],
      default: "individual",
      required: true,
    },

    therapistId: {
      type: Schema.Types.ObjectId,
      ref: "therapist",

      required: function () {
        return this.sessionType === "individual";
      },
    },

    patientId: {
      type: Schema.Types.ObjectId,
      ref: "patient",
      required: function () {
        return this.sessionType === "individual";
      },
    },

    therapistName: {
      type: String,
      required: function () {
        return this.sessionType === "individual";
      },
    },

    patientName: {
      type: String,
      required: function () {
        return this.sessionType === "individual";
      },
    },

    groupSession: {
      therapists:
         [
    {
      therapistId: {
        type: Schema.Types.ObjectId,
        ref: "therapist",
        required: function () {
          return this.sessionType === "group";
        }
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      therapistShare:{
        type: Number,
        required: function () {
          return this.sessionType === "group";
        }
      }
    }
  ],
      
      patients: [
        {
          type: Schema.Types.ObjectId,
          ref: "patient",
          required: function () {
            return this.sessionType === "group";
          },
        },
      ],
      onePatientFee: {
        type: Number,
        required: function () {
          return this.sessionType === "group";
        },
      },
    },
    description: {
      type: String,
      required: function () {
        return this.sessionType === "group";
      },
    },
    Paids: [
      {
        id: { type: Schema.Types.ObjectId },
        payment: {
          type: String,
          enum: ["card", "transfer", "cash"],
          default:"card"
        },
        note:{type:String}
      },
    ],
  },

  { timestamps: true }
);





export default mongoose.model("appointment", appointmentSchema);
