
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import authRoute from "./routes/auth.js";
import therapistRoute from "./routes/therapist.js"
import adminRoute from './routes/admin.js';
import appointmentRoute from './routes/Appointment.js'
import financialRoute from "./routes/financial.js";
import patientRoute from "./routes/patient.js"
import messageRoute from "./routes/message.js";
import exerciseRoute from "./routes/exercise.js"
import noteBookRoute from "./routes/noteBook.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 8642;
const DB_URI = process.env.MONGO_URI||"mongodb://localhost:27017/clinic_app";


// اگر فرانت روی دامنه/پورت دیگر است:
app.use(cors({
  origin: "http://194.180.11.197",// یا دامنه فرانت
  credentials: true,
}));




app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());





import { csrfGuard } from "./middlewares/auth.js";
app.use(csrfGuard);

app.use(authRoute);
app.use(therapistRoute)
app.use(adminRoute)
app.use(appointmentRoute)
app.use(financialRoute)
app.use(patientRoute);
app.use(messageRoute);
app.use(exerciseRoute);
app.use(noteBookRoute)

app.use((error, req, res, next) => {
  console.error(error); 
  const status = error.statusCode || 500;
  const message = error.message;
  
  res.status(status).json({ message });
  
});

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(" Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(` Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(" Database connection failed:", err.message);
    process.exit(1);
  }
};
connectDB();

