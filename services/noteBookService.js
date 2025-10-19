import exercise from "../models/exercise.js";
import noteBook from "../models/noteBook.js";

export const createNoteBook = async (data) => {
    try {
         const newNoteBook = new noteBook(data);
    return await newNoteBook.save();
    } catch (error) {
        throw new Error("خطا در ساخت دفترچه تمرینات");
    }
   
};


export const updateNoteBook = async (noteBookId, exercises) => {
    try {
        return await noteBook.findOneAndUpdate(
            { _id: noteBookId },
            { $set: { exercises } },
            { new: true }
        );
    } catch (error) {
        throw new Error("خطا در به روز رسانی دفترچه تمرینات");
    }
};

export const addExerciseToNoteBook = async (noteBookId, exerciseId,note) => {
    try {
        const isExercise=await exercise.findById(exerciseId);
        if(!isExercise){
            throw new Error("تمرین یافت نشد");
        }
        const isNoteBook=await noteBook.findById(noteBookId);
        if(!isNoteBook){
            throw new Error("دفترچه تمرینات یافت نشد");
        }
        return await noteBook.findOneAndUpdate(
            { _id: noteBookId },
            { $push: { exercises: { exerciseId, note } } },
            { new: true }
        );
    } catch (error) {
        throw new Error("خطا در افزودن تمرین به دفترچه تمرینات");
    }
};

export const removeExerciseFromNoteBook = async (noteBookId, exerciseId) => {
    try {
        return await noteBook.findOneAndUpdate(
            { _id: noteBookId },
            { $pull: { exercises: { exerciseId } } },
            { new: true }
        );
    } catch (error) {
        throw new Error("خطا در حذف تمرین از دفترچه تمرینات");
    }
};


export const deleteNoteBook = async (Id) => {
    try {
        return await noteBook.findOneAndDelete({ _id:Id });
    } catch (error) {
        throw new Error("خطا در حذف دفترچه تمرینات");
    }
};

export const getNoteBookofPatientBytherapistId = async (patientId, therapistId) => {
    try {
        return await noteBook.find({ patientId, therapistId });
    } catch (error) {
        throw new Error("خطا در دریافت دفترچه تمرینات");
    }
};


