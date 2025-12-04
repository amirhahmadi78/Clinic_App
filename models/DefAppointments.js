import mongoose from "mongoose";

const Schema = mongoose.Schema;

const defappointmentSchema = new Schema(
  {
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: "therapist",
      required: true,
      index: true,
    },
    therapistName:{type:String,
      required:true
    },
    patientId: { type: Schema.Types.ObjectId, ref: "patient", required: true },
    patientName:{type:String,required:true},
    start: { type: Date, required: true, index: true }, // UTC Date
    end: { type: Date, required: true, index: true }, // UTC Date
    duration: { type: Number, required: true }, // minutes, computed (end-start)
    type: {
      type: String,
      enum: ["session", "assessment", "lunch", "online","break"],
      default: "session",
    },
    patientFee:{
      type:Number
    },
    day:{
      type:String,
      required:true
    }
    ,
    status_clinic: {
      type: String,
      enum: ["scheduled","completed-notpaid", "completed-paid", "canceled", "bimeh","absent","break"],
      default: "scheduled",
    },
         role: {
      type: String,
      enum: ["SLP", "OT", "PSY", "PT","therapist"],
      required:true
    },
    status_therapist:{
      type:String,
        enum: ["scheduled","completed", "absent"],
      default: "scheduled"
    }
    ,
    room: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "admin" },//felan
    localDay: { type: String, index: true },
    report:{type: String },
      clinicShare: { type: Number, required: true },      
  therapistShare: { type: Number, required: true }, 
  paidAt: { type: Date },
  pay_details:{type:String}
  },
  { timestamps: true }
);



export default mongoose.model("defappointment",defappointmentSchema)