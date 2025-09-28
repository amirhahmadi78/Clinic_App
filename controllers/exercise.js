

import exercise from "../models/exercise.js";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/arvanS3.js";

import { v4 as uuidv4 } from "uuid";





export const uploadExercise = async (req, res,next) => {
  try {
  if (!req.file) {
      const error = new Error("فایلی انتخاب نشده");
      error.statusCode = 400;
      throw error;
    }
    const fileKey = `exercises/${uuidv4()}-${req.file.originalname}`;
    // console.log("bucket name:", process.env.ARVAN_BUCKET_NAME);
    
    // آماده‌سازی دستور آپلود
    const uploadParams = {
      Bucket: process.env.ARVAN_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ACL: "public-read",
      ContentType: req.file.mimetype,
    };

    // اجرای آپلود
    await s3Client.send(new PutObjectCommand(uploadParams));

    // ساختن لینک فایل
    const fileUrl = `https://${process.env.ARVAN_BUCKET_NAME||"exercise"}.s3.ir-thr-at1.arvanstorage.ir/${fileKey}`;

    // ذخیره توی دیتابیس
    const newExercise = new exercise({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      fileUrl: fileUrl,
      createdBy: req.body.createdBy, // id درمانگر
    });

    await newExercise.save();

    res.json({ message: "تمرین با موفقیت آپلود شد", exercise: newExercise });
  } catch (error) {
    next(error);
  }
};

// // گرفتن لیست تمرین‌ها
export const getExercises = async (req, res, next) => {
  try {
    const exercises = await exercise.find().sort({ createdAt: -1 });
    if (!exercises) {
      const error = new Error("تمرینی یافت نشد");
      error.statusCode = 404;
      throw error;
    }
    res.json(exercises);
  } catch (err) {
    next(err);
  }
  
};
