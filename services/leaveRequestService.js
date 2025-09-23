import LeaveRequest from "../models/LeaveRequest.js";

export async function serviceDailyLeaveRequest(userId,startDay,endDay,text,userType) {
    try {
        if(!startDay||!endDay){
            const error=new Error("لطفا تاریخ شروع و پایان مرخصی را وارد کنید")
        }
       const newLeaveRequest=new LeaveRequest({
        user:userId,
        userType,
        startDay,
        endDay,
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




export async function GetRequests(query){
    try {
  

    const requests=await LeaveRequest.find(query)
       

    if (requests.length===0){
        const error=new Error("درخواست مرخصی یافت نشد")
        error.statusCode=404
      throw error
    }

    return {
        message:"در خواست های مرخصی در این لیست هستند",
        requests
    }
    } catch (error) {
        throw error
    }
}