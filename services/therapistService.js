import therapist from "../models/therapist.js";


export async function FindTherapist(query){
    try {
        const therapistsList = await therapist.find(query);
    if (!therapistsList || therapistsList.length === 0) {
      const error = new Error("درمانگر با مشخصات مورد نظر یافت نشد");
      error.statusCode = 404;
      throw (error);
    }
    return {
        message:"لیست تراپیست های مورد نظر شما:",
        therapistsList

    }
    } catch (error) {
        throw error
    }
}