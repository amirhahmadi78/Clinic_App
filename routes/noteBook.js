import express from 'express';
 const router = express.Router();

    import {
    AddExercise,
    createNoteBookController,
    removeExercise,
    UpdateNoteBook,
    deleteNoteBookController,
    getNoteBookofPatientBytherapistIdController,
    getActiveNotebookController,
    createNewNotebookController,
    updateNotebookTitleController,
    updateNotebookNoteController,
    updateExerciseNoteController
} from "../controllers/neteBook.js"
import { csrfGuard, requireAuth } from '../middlewares/auth.js';

router.post('/exercise/addnotebook',requireAuth,csrfGuard ,createNoteBookController);

router.put('/exercise/addexercisee',requireAuth,csrfGuard, AddExercise);

router.put('/exercise/removeexercise',requireAuth,csrfGuard, removeExercise);

router.put('/exercise/updatenotebook',requireAuth,csrfGuard, UpdateNoteBook);

router.delete('/exercise/deletenotebook',requireAuth,csrfGuard, deleteNoteBookController);

router.get('/exercise/getnotebookbytherapist/:patientId',requireAuth,csrfGuard, getNoteBookofPatientBytherapistIdController);

router.get('/exercise/getactivenotebook/:patientId',requireAuth,csrfGuard, getActiveNotebookController);

router.post('/exercise/createnewnotebook',requireAuth,csrfGuard, createNewNotebookController);

router.put('/exercise/updatenotebooktitle',requireAuth,csrfGuard, updateNotebookTitleController);

router.put('/exercise/updatenotebooknote',requireAuth,csrfGuard, updateNotebookNoteController);

router.put('/exercise/updateexercisenote',requireAuth,csrfGuard, updateExerciseNoteController);

export default router;