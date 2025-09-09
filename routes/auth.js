import express from 'express'
import {PostLogin,PostSignUp} from '../controllers/auth.js'
const router=express.Router()

router.post("/signup",PostSignUp)

router.post("/login",PostLogin)

export default router