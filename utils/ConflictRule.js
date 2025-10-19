import { DateTime } from "luxon";

export function ConflictRole(start,end,otherStart,otherEnd){
   if (!(otherStart instanceof DateTime)) {
    otherStart = DateTime.fromJSDate(otherStart, { zone: "Asia/Tehran" });
  }
  if (!(otherEnd instanceof DateTime)) {
    otherEnd = DateTime.fromJSDate(otherEnd, { zone: "Asia/Tehran" });
  }
 
  if (start < otherEnd && end > otherStart) {
    const error = new Error("تایم درمانگر در زمان مورد نظر خالی نمی باشد");
    error.statusCode = 409;
    throw error;
}
}