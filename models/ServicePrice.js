import mongoose from "mongoose";

const servicePriceSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    required: true,
    enum: ["session", "assessment", "online", "consultation", "workshop"]
  },
  serviceSkill: {
    type: String,
    required: true,
    enum: ["SLP", "OT", "PSY", "PT", "COU", "NUT"]
  },
  duration: {
    type: Number,
    required: true,
    enum: [15, 30, 40, 45, 60, 90, 120]
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  // اگه بخوای قیمت مخصوص درمانگر داشته باشی
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    default: null
  },
  // تاریخ ایجاد/آپدیت خود timestamps داره
}, {
  timestamps: true
});

// ⚠️ IMPORTANT: ایندکس unique برای جلوگیری از duplicate
servicePriceSchema.index({ 
  serviceType: 1, 
  serviceSkill: 1, 
  duration: 1,
  therapistId: 1 
}, { 
  unique: true,
  partialFilterExpression: { therapistId: { $eq: null } } // برای قیمت‌های عمومی
});

// متد استاتیک برای آپدیت یا ایجاد
servicePriceSchema.statics.upsertPrice = async function(data) {
  const { serviceType, serviceSkill, duration, basePrice, therapistId = null } = data;
  
  // پیدا کن اگه وجود داره
  const existing = await this.findOne({
    serviceType,
    serviceSkill,
    duration,
    therapistId
  });
  
  if (existing) {
    // آپدیت کن
    existing.basePrice = basePrice;
    return await existing.save();
  } else {
    // ایجاد کن
    return await this.create(data);
  }
};

// متد برای گرفتن همه قیمت‌ها
servicePriceSchema.statics.getAllPrices = async function() {
  return this.find({}).sort({ serviceSkill: 1, serviceType: 1, duration: 1 });
};

// متد برای گرفتن قیمت خاص
servicePriceSchema.statics.getPrice = async function(serviceType, serviceSkill, duration, therapistId = null) {
  const query = { serviceType, serviceSkill, duration };
  
  // اول قیمت مخصوص درمانگر
  if (therapistId) {
    const therapistPrice = await this.findOne({ ...query, therapistId });
    if (therapistPrice) return therapistPrice.basePrice;
  }
  
  // بعد قیمت عمومی
  const generalPrice = await this.findOne({ ...query, therapistId: null });
  return generalPrice?.basePrice || null;
};

const ServicePrice = mongoose.model('ServicePrice', servicePriceSchema);

export default ServicePrice;