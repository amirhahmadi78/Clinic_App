
import { createNoteBook,updateNoteBook,addExerciseToNoteBook,removeExerciseFromNoteBook,deleteNoteBook,getNoteBookofPatientBytherapistId} from "../services/noteBookService.js";

export const createNoteBookController = async (req, res,next) => {
    try {
        const{ patientId, therapistId }= req.body;
        if (!patientId || !therapistId) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        let query={ patientId, therapistId};
        const noteBook = await createNoteBook(query);
        res.status(201).json(noteBook);
    } catch (error) {
        next(error);
    }
};

export const AddExercise=async (req, res,next) => {
    try {
        const { noteBookId, exerciseId,note } = req.body;
        if (!noteBookId || !exerciseId) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        if(!note){
            note="";
        }
        const result = await addExerciseToNoteBook(noteBookId, exerciseId,note);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const removeExercise=async (req, res,next) => {
    try {
        const { noteBookId, exerciseId } = req.body;
        if (!noteBookId || !exerciseId) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const result = await removeExerciseFromNoteBook(noteBookId, exerciseId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


export const UpdateNoteBook=async (req, res,next) => {
    try {
        const { noteBookId, exercises } = req.body;
        if (!noteBookId || !exercises) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const result = await updateNoteBook(noteBookId, exercises);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const deleteNoteBookController = async (req, res,next) => {
    try {
        const { Id } = req.body;
        if (!Id) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const result = await deleteNoteBook(Id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


export const getNoteBookofPatientBytherapistIdController=async (req, res,next) => {

    try {
        const { patientId, therapistId } = req.params;
        if (!patientId || !therapistId) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const result = await getNoteBookofPatientBytherapistId(patientId, therapistId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
