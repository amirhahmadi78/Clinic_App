

import exercise from "../models/exercise.js"

import {PutObjectCommand } from "@aws-sdk/client-s3";
import S3Client from "../config/arvanS3.js";

import { v4 as uuidv4 } from "uuid";





export const uploadExercise = async (req, res,next) => {
  try {
    console.log("oomad");
    
  if (!req.file) {
     console.log("file dasht");
      const error = new Error("فایلی انتخاب نشده");
      error.statusCode = 400;
      throw error;
    }
    const fileKey = `exercises/${uuidv4()}-${req.file.originalname}`;
    const fileKey2 = `exercise/exercises/${uuidv4()}-${req.file.originalname}`;
    
    // آماده‌سازی دستور آپلود
    const uploadParams = {
      Bucket: process.env.ARVAN_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ACL: "public-read",
      ContentType: req.file.mimetype,
    };
    
 console.log("raft vase upload");
    // اجرای آپلود
    const response=await S3Client.send(new PutObjectCommand(uploadParams));

 console.log(" upload shod");
    // ساختن لینک فایل
    const fileUrl = `https://${process.env.ARVAN_BUCKET_NAME||"exercise"}.s3.ir-thr-at1.arvanstorage.ir/${fileKey2}`;

    // ذخیره توی دیتابیس
    const newExercise = new exercise({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      fileUrl: fileUrl,
      therapist: req.user.id, // id درمانگر
    });
    
 console.log("raft vase mongodb");
    await newExercise.save();
console.log("tama bah bah");
    res.json({ message: "تمرین با موفقیت آپلود شد", exercise: newExercise });
  } catch (error) {
    next(error);
  }
};





export const getExercises = async (req, res, next) => {
  try {
    const exercises = await exercise.find().sort({ createdAt: -1 });
    if (!exercises) {
      const error = new Error("تمرینی یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    res.json({
      message: "لیست تمرینات درمانگر",
      exercises,
    });
  } catch (err) {
    next(err);
  }
  
};
