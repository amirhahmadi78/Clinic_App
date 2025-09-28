import express from "express";
import { body } from "express-validator";
import { uploadExercise ,getExercises} from "../controllers/exercise.js";
import multer from "multer";
const router = express.Router();



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post(
    "/exercise/upload",
    upload.single("file"),
    uploadExercise
);

router.get("/exercise", getExercises);


export default router;