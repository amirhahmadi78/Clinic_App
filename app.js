import express from "express";
import mongoose from "mongoose";
import authRoute from "./routes/auth.js";
import therapistRoute from "./routes/therapist.js"
import adminRoute from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 8642;
const DB_URI = "mongodb://localhost:27017/clinic_app";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((error, req, res, next) => {
  console.error(error); 
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
  next()
});


app.use(authRoute);
app.use(therapistRoute)
app.use(adminRoute)

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
