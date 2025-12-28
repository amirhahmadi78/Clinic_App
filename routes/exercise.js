import express from "express";

import { uploadExercise ,getExercises} from "../controllers/exercise.js";
import multer from "multer";
import { csrfGuard, requireAuth } from "../middlewares/auth.js";
const router = express.Router();



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post(
    "/exercise/upload",
    requireAuth,csrfGuard,
    upload.single("file"),
    uploadExercise
);

router.get("/exercise", getExercises);


export default router;