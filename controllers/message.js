import { checkUserType } from "../middlewares/checkUserType.js";
import { addMessage , getMessages, markMessagesAsRead ,responseToMessage} from "../services/message.js";

export const createMessage=async(req,res,next)=>{
    try{
        const { sender, receiver, content } = req.body;
        if (!sender || !receiver || !content) {
            const error = new Error("فیلدهای ارسالی ناقص هستند");
            error.statusCode = 400;
            return next(error);
        }
        const senderModel=await checkUserType(sender);
        const receiverModel=await checkUserType(receiver);
        const response = await addMessage({ sender, receiver, content, senderModel, receiverModel});
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
}

export const fetchMessages = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            const error = new Error("شناسه کاربر ارسال نشده است");
            error.statusCode = 400;
            return next(error);
        }
        const response = await getMessages(userId);
        res.status(200).json(response);
    }catch(error){
        next(error);
    }
}

export const markAsRead = async (req, res, next) => {
    try {
        const messageId = req.params.messageId;
        if (!messageId) {
            const error = new Error("شناسه پیام ارسال نشده است");
            error.statusCode = 400;
            return next(error);
        }
        const response = await markMessagesAsRead(messageId);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};


export const respondToMessage = async (req, res, next) => {
    try {
        const messageId = req.params.messageId;
        const { responseContent } = req.body;
        if (!messageId || !responseContent) {
            const error = new Error("شناسه پیام یا محتوی پاسخ ارسال نشده است");
            error.statusCode = 400;
            return next(error);
        }
        const response = await responseToMessage(messageId, responseContent);
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};