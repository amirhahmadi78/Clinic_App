// utils/checkTherapistLeave.js

/**
 * بررسی می‌کند که آیا درمانگر در زمان مشخصی مرخصی دارد یا نه
 * @param {String} therapistId - آیدی درمانگر
 * @param {String} appointmentTime - زمان اپوینت به فرمت HH:mm
 * @param {Array} dailyLeaves - لیست مرخصی‌های همان روز
 * @returns {Object} - نتیجه بررسی
 */


export function checkTherapistLeave(therapistId, appointmentTime, dailyLeaves) {
    // فقط مرخصی‌های تایید شده همین درمانگر

    console.log("leaves",dailyLeaves);
    
    const therapistLeaves = dailyLeaves.filter(leave => 
        leave.therapist == therapistId || leave.user._id == therapistId
    );

    if (therapistLeaves.length === 0) {
        return {
            hasLeave: false,
            message: null,
            leaveDetails: null
        };
    }

    // تبدیل زمان اپوینت به دقیقه
   

    for (const leave of therapistLeaves) {
        if (leave.type === 'daily') {
            // اگر مرخصی روزانه هست، تمام روز مرخص است
            return {
                hasLeave: true,
                message: `درمانگر در این زمان مرخصی روزانه دارد - دلیل: ${leave.reason}`,
                leaveDetails: leave
            };
        } else if (leave.type === 'hourly') {
             const appointmentMinutes = timeToMinutes(appointmentTime.startTime);
            // بررسی مرخصی ساعتی
            const leaveStartMinutes = timeToMinutes(leave.startTime);
            const leaveEndMinutes = timeToMinutes(leave.endTime);
            
            // بررسی تداخل زمانی
            if (appointmentMinutes >= leaveStartMinutes && 
                appointmentMinutes < leaveEndMinutes) {
                return {
                    hasLeave: true,
                    message: `درمانگر در ساعت ${appointmentTime} مرخصی ساعتی دارد (${leave.startTime} تا ${leave.endTime}) - دلیل: ${leave.reason}`,
                    leaveDetails: leave
                };
            }
        }
    }

    return {
        hasLeave: false,
        message: null,
        leaveDetails: null
    };
}

/**
 * تبدیل زمان به دقیقه
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    console.log("timeSTR",timeStr);
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
}

  