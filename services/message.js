import message from "../models/message.js";
export const addMessage = async (data) => {
  try {
    
    const newMessage = new message(data);
    await newMessage.save();
    return {
      message: "پیام با موفقیت بارسال شد",
      newMessage,
    };
  } catch (error) {
    throw error;
  }
};

export const getMessages = async (userId) => {
  try {
    const messagesSend = await message.find({
      sender: userId,
    }).populate("sender receiver", "firstName lastName ");
    const messagesReceive = await message.find({ receiver: userId }).populate("sender receiver", "firstName lastName ");
    return {
      message: "پیام ها با موفقیت بارگذاری شدند",
      messages: [messagesSend, messagesReceive],
    };
  } catch (error) {
    throw error;
  }
};


export const markMessagesAsRead = async (messageId) => {
    try {
        await message.updateOne(
            { _id: messageId },
            { $set: { read: true } }
        );
        return {
            message: "پیام ها با موفقیت خوانده شدند",
        };
    } catch (error) {
        throw error;
    }
};

export const responseToMessage = async (messageId, responseContent) => {
    try {
        const updatedMessage = await message.updateOne(
            { _id: messageId },
            { $set: { response: responseContent } }
        );
        if (!updatedMessage) {
            const error = new Error("پیام یافت نشد");
            error.statusCode = 404;
            throw error;
        }
        return {
            message: "پاسخ به پیام با موفقیت ثبت شد"
        };
    } catch (error) {
        throw error;
    }
};
