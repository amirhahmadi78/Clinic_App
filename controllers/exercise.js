

import exercise from "../models/exercise.js"

import parsPackService from "../services/ParsPackService.js";

import { v4 as uuidv4 } from "uuid";





export const uploadExercise = async (req, res,next) => {
  try {
  
    
  if (!req.file) {
     console.log("file dasht");
      const error = new Error("فایلی انتخاب نشده");
      error.statusCode = 400;
      throw error;
    }
    
    const fileKey = `exercises/${uuidv4()}-${req.file.originalname}`;
    
    // اجرای آپلود در پارس‌پک
    await parsPackService.uploadObject(
      process.env.PARSPACK_BUCKET_NAME,
      fileKey,
      req.file.buffer,
      req.file.mimetype
    );

   // ساختن لینک فایل (با فرض ساختار دامنه پارس‌پک)
    const fileUrl = `https://${process.env.PARSPACK_BUCKET_NAME}.parspack.net/${fileKey}`;

    // ذخیره توی دیتابیس
    const newExercise = new exercise({
      title: req.body.title,
      description: req.body.description,
      fileType: req.body.fileType,
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



