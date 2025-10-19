import express from 'express';
 const router = express.Router();

    import {
    AddExercise,
    createNoteBookController,
    removeExercise,
    UpdateNoteBook,
    deleteNoteBookController,
    getNoteBookofPatientBytherapistIdController
} from "../controllers/neteBook.js"

router.post('/exercise/addnotebook', createNoteBookController);

router.put('/exercise/addexercisee', AddExercise);

router.put('/exercise/removeexercise', removeExercise);

router.put('/exercise/updatenotebook', UpdateNoteBook);

router.delete('/exercise/deletenotebook', deleteNoteBookController);

router.get('/exercise/getnotebookbytherapist/:patientId/:therapistId', getNoteBookofPatientBytherapistIdController);

export default router;