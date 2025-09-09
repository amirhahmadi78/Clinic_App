import  AdminSchema from '../models/admin.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function PostSignUp(req,res,next){
    try {
         const {username,name,phone,email,password}=req.body
    const hashedPassword=await bcrypt.hash(password,12)
    const newAdmin=new AdminSchema({
        username
        ,password:hashedPassword
        ,name
        ,email
        ,phone
        
    })
    await newAdmin.save()
    res.status(200).json(newAdmin)
    } catch (error) {
        console.log(error);
        res.status(401).send(error)
    }
   
}

export async function PostLogin(req,res,next){
    try {
           const {username,password}=req.body

           const OneAdmin=await AdminSchema.findOne({username})
           if (OneAdmin){
            const ComparePass=await bcrypt.compare(password,OneAdmin.password)
            if (ComparePass===true){
            const token=jwt.sign({email:OneAdmin.email,AdminId:OneAdmin._id},"amirmamad",{expiresIn:"1h"})
            res.status(200).send({
                AdminId:OneAdmin._id,
                token:token
            })
           }
           }else return Error({
            message:"mistake"
           })
           

    } catch (error) {
         console.log(error);
        res.status(401).send(error)
    }
 

}