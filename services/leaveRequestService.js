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



export async function TodayLeaves(date){
    try {
       
        const targetDate=new Date(date)
        
        const gi=await LeaveRequest.find()
     
       
        
            const dayLeaves = await LeaveRequest.find({
              status: { $in: ['approved'] }, // مرخصی‌های تایید شده و در حال بررسی
              $or: [
                // مرخصی‌های روزانه که تاریخ انتخابی بین شروع و پایان باشد
                {
                  type: 'daily',
                  startDate: { $lte: targetDate },
                  endDate: { $gte: targetDate }
                },
                // مرخصی‌های ساعتی که تاریخ startDate برابر با تاریخ انتخابی باشد
                {
                  type: 'hourly',
                  startDate: {
                    $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
                    $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
                  }
                }
              ]
            })
            .populate({
              path: 'user',
              select: 'firstName lastName',
              // اینجا model مشخص نمی‌کنیم، چون refPath خودش مدیریت می‌کند
            })
            .sort({ createdAt: -1 });
        
            return{
              message: "مرخصی‌های تاریخ مورد نظر",
              date: date,
              leaveRequests: dayLeaves
            }
    } catch (error) {
        throw error
    }
}