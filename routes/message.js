import { fetchMessages,createMessage ,markAsRead,respondToMessage} from "../controllers/message.js";

import express from "express";
const router = express.Router();

router.post("/messages/create", createMessage);
router.get("/messages/:userId", fetchMessages);
router.patch("/messages/mark-as-read/:messageId", markAsRead);
router.patch("/messages/respond/:messageId", respondToMessage);

export default router;
