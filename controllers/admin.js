// import admin from "../models/admin.js";
import admin from "../models/admin.js";
import patient from "../models/patient.js";
import therapist from "../models/therapist.js";

export async function findTherapists(req, res, next) {
  try {
    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.skills) query.skills = req.query.skills;

    const therapistsList = await therapist.find(query);
    if (!therapistsList || therapistsList.length === 0) {
      const error = new Error("درمانگر با مشخصات مورد نظر یافت نشد");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      therapistsList,
    });
  } catch (error) {
    next(error);
  }
}

export async function AddPatientToTherapist(req, res, next) {
  try {
    const { patientId, therapistId } = req.body;

   

    const OneTherapist = await therapist.findById(therapistId);
    const OnePatient = await patient.findById(patientId);
    if (!OneTherapist || !OnePatient) {
    const error = new Error("درمانگر یا مراجع پیدا نشد");
      error.statusCode = 404;
      return next(error);
    }

    if (!OneTherapist.patients.includes(patientId)) {
      OneTherapist.patients.push(patientId);
    }
    if (!OnePatient.therapists.includes(therapistId)) {
      OnePatient.therapists.push(therapistId);
    }

    await Promise.all([OneTherapist.save(), OnePatient.save()]);

    res.status(200).json({
      message: "مراجع به لیست مراجعان درمانگر اضافه شد",
      therapist: OneTherapist,
    });
  } catch (error) {
   
    next(error);
  }
}
