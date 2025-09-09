import express from "express";
import mongoose from "mongoose";
import auth from "./routes/auth.js"


const app=express()
const PORT = process.env.PORT || 8642;
const DB_URI = "mongodb://localhost:27017/clinic_app";


app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,PUT,PATCH')
    res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization')
    next()
})
app.use(express.json());     
app.use(express.urlencoded({ extended: true }));

// app.use("/",(req,res,next)=>{
//     res.send( "Hello from clinic app")
// })
app.use(auth)

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(" Connected to MongoDB");

    
    app.listen(PORT, () => {
      console.log(` Server is running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error(" Database connection failed:", err.message);
    process.exit(1)
  }
};
connectDB()
