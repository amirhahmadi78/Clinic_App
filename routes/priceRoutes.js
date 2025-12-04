// routes/priceRoutes.js
import express from 'express';
import{ListAll,
ListPartial,
UpdatePrice,
DeletePrice,
RefreshList,}from "../controllers/priceController.js"

const router = express.Router();

router.post('/defaults/save',UpdatePrice );

router.get('/defaults/',ListAll );

router.get('/defaults/get',ListPartial);

router.delete('/defaults/:priceId',DeletePrice);

router.post('/defaults/refresh-cache',RefreshList );

export default router;