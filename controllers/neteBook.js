
import { createNoteBook,updateNoteBook,addExerciseToNoteBook,removeExerciseFromNoteBook,deleteNoteBook,getNoteBookofPatientBytherapistId, getActiveNotebook, createNewNotebook, updateNotebookTitle, updateNotebookNote, updateExerciseNote} from "../services/noteBookService.js";

export const createNoteBookController = async (req, res,next) => {
    try {
        const{ patientId }= req.body;
        if (!patientId ) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const therapistId=req.user.id
        let query={ patientId, therapistId};
        const noteBook = await createNoteBook(query);
        res.status(201).json(noteBook);
    } catch (error) {
        next(error);
    }
};

export const AddExercise=async (req, res,next) => {
    try {
        console.log("boma",req.body);
        
        let { noteBookId, exerciseId,note } = req.body;
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
        const { patientId } = req.params;
        if (!patientId ) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const therapistId=req.user.id
             if (!therapistId || !patientId) {
            return res.status(400).json({
                error: 'پارامترهای therapistId و patientId الزامی هستند'
            });
        }
        const result = await getNoteBookofPatientBytherapistId(patientId, therapistId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getActiveNotebookController = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        if (!patientId) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const therapistId = req.user.id;
        const result = await getActiveNotebook(patientId, therapistId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const createNewNotebookController = async (req, res, next) => {
    try {
        const { patientId, title } = req.body;
        if (!patientId) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const therapistId = req.user.id;
        const result = await createNewNotebook(patientId, therapistId, title);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const updateNotebookTitleController = async (req, res, next) => {
    try {
        const { notebookId, title } = req.body;
        if (!notebookId || !title) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const result = await updateNotebookTitle(notebookId, title);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const updateNotebookNoteController = async (req, res, next) => {
    try {
        const { notebookId, note } = req.body;
        if (!notebookId) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const result = await updateNotebookNote(notebookId, note || "");
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const updateExerciseNoteController = async (req, res, next) => {
    try {
        const { notebookId, exerciseId, note } = req.body;
        if (!notebookId || !exerciseId) {
            const error = new Error("فیلدهای مورد نیاز را وارد کنید");
            error.statusCode = 400;
            return next(error);
        }
        const result = await updateExerciseNote(notebookId, exerciseId, note || "");
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
