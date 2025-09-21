import LeaveRequest from "../models/LeaveRequest.js";

export async function serviceDailyLeaveRequest(userId,startDate,endDate,text,userType) {
    try {
       const newLeaveRequest=new LeaveRequest({
        user:userId,
        userType,
        startDate,
        endDate,
        text
       })
        
       const newRequest=await newLeaveRequest.save()
       if (!newRequest){
        const error=new Error("مرخصی شما ثبت نشد!")
        error.statusCode=400
        throw error
       }
       return {
        message:"در خواست مرخصی روزانه شما با موفقیت ثبت شد",
        newRequest
       }
    } catch (error) {
        throw error
    }
    
}



export async function serviceHourlyLeaveRequest(userId,startDate,endDate,text,userType,localDay) {
    try {
       const newLeaveRequest=new LeaveRequest({
        user:userId,
        userType,
        startDate,
        endDate,
        text,
        localDay
       })
        
       const newRequest=await newLeaveRequest.save()
       if (!newRequest){
        const error=new Error("مرخصی شما ثبت نشد!")
        error.statusCode=400
        throw error
        
       }
       return {
        message:"در خواست مرخصی روزانه شما با موفقیت ثبت شد",
        newRequest
       }
    } catch (error) {
        throw error
    }
    
}