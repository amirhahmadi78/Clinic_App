import exercise from "../models/exercise.js";
import noteBook from "../models/noteBook.js";
import patient from "../models/patient.js";

export const createNoteBook = async (data) => {
    try {
        // ابتدا همه notebook های قبلی این بیمار و درمانگر را غیرفعال کنیم
        await noteBook.updateMany(
            { patientId: data.patientId, therapistId: data.therapistId },
            { $set: { isActive: false } }
        );

        // سپس notebook جدید را ایجاد کنیم
        const newNoteBook = new noteBook({
            ...data,
            isActive: true
        });
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
      
        
        return await noteBook.find({ patientId, therapistId })
            .populate('exercises.exerciseId')
            .sort({ createdAt: -1 }); // جدیدترین اول
    } catch (error) {
        console.log(error);
        
        throw new Error("خطا در دریافت دفترچه تمرینات");
    }
};

export const getActiveNotebook = async (patientId, therapistId) => {
    try {
        return await noteBook.findOne({ patientId, therapistId, isActive: true })
            .populate('exercises.exerciseId');
    } catch (error) {
        throw new Error("خطا در دریافت دفترچه تمرینات فعال");
    }
};

export const getActiveNotebooksOfPatientTherapists = async (patientId) => {
    try {
        // ابتدا درمانگران بیمار را پیدا کنیم
        const patientData = await patient.findById(patientId).select('therapists');
   
        
        if (!patientData || !patientData.therapists || patientData.therapists.length === 0) {
                   
            return [];
  
            
        }

        // سپس نوت‌بوک‌های فعال هر درمانگر را پیدا کنیم
            const therapistIds = patientData.therapists.map(t => 
            typeof t === 'object' ? t._id : t
        );
        console.log(patientId);
        
        const notebooks = await noteBook.find({
            patientId,
            therapistId: { $in: therapistIds },
            isActive: true
        })
        .populate('therapistId', 'firstName lastName role')
        .populate('exercises.exerciseId');

        return notebooks;
    } catch (error) {
        throw new Error("خطا در دریافت دفترچه تمرینات درمانگران");
    }
};

export const createNewNotebook = async (patientId, therapistId, title) => {
    try {
        // ابتدا همه notebook های قبلی را غیرفعال کنیم
        await noteBook.updateMany(
            { patientId, therapistId },
            { $set: { isActive: false } }
        );

        // سپس notebook جدید ایجاد کنیم
        const newNotebook = new noteBook({
            patientId,
            therapistId,
            title: title || `نوت‌بوک ${new Date().toLocaleDateString('fa-IR')}`,
            isActive: true,
            exercises: []
        });

        return await newNotebook.save();
    } catch (error) {
        throw new Error("خطا در ایجاد نوت‌بوک جدید");
    }
};

export const updateNotebookTitle = async (notebookId, title) => {
    try {
        return await noteBook.findByIdAndUpdate(
            notebookId,
            { $set: { title } },
            { new: true }
        ).populate('exercises.exerciseId');
    } catch (error) {
        throw new Error("خطا در بروزرسانی عنوان نوت‌بوک");
    }
};

export const updateNotebookNote = async (notebookId, note) => {
    try {
        return await noteBook.findByIdAndUpdate(
            notebookId,
            { $set: { note } },
            { new: true }
        ).populate('exercises.exerciseId');
    } catch (error) {
        throw new Error("خطا در بروزرسانی یادداشت نوت‌بوک");
    }
};

export const updateExerciseNote = async (notebookId, exerciseId, note) => {
    try {
        return await noteBook.findOneAndUpdate(
            { _id: notebookId, 'exercises.exerciseId': exerciseId },
            { $set: { 'exercises.$.note': note } },
            { new: true }
        ).populate('exercises.exerciseId');
    } catch (error) {
        throw new Error("خطا در بروزرسانی یادداشت تمرین");
    }
};


