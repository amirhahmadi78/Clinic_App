import ServicePrice from '../models/ServicePrice.js';
import priceCache from '../utils/priceCache.js';


export const ListAll=async(req, res,next) => {
  try {
    const prices = await ServicePrice.getAllPrices();
    res.json({ success: true, prices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}






export const ListPartial= async (req, res) => {
  try {
    const { serviceSkill, serviceType, duration, therapistId } = req.query;
    
    // از کش بگیر
    const price = priceCache.getPrice(serviceSkill, serviceType, parseInt(duration), therapistId);
    
    if (!price) {
      return res.status(404).json({ 
        success: false, 
        message: 'قیمت برای این خدمت یافت نشد' 
      });
    }
    
    res.json({ 
      success: true, 
      price,
      details: { serviceSkill, serviceType, duration, therapistId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}





export const UpdatePrice=async (req, res) => {
  try {
    const { serviceSkill, serviceType, duration, basePrice, therapistId } = req.body;
    
    // آپدیت یا ایجاد در دیتابیس
    const price = await ServicePrice.upsertPrice({
      serviceSkill,
      serviceType,
      duration: parseInt(duration),
      basePrice: parseInt(basePrice),
      therapistId: therapistId || null
    });
    
    // آپدیت کش
    await priceCache.updateCache(serviceSkill, serviceType, duration, basePrice, therapistId);
    
    res.json({ 
      success: true, 
      message: 'قیمت ذخیره شد',
      price 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}




export const DeletePrice= async (req, res) => {
  try {

    
    const price = await ServicePrice.findByIdAndDelete(req.params.priceId);
    
    if (!price) {
      return res.status(404).json({ success: false, message: 'قیمت یافت نشد' });
    }
    
    // حذف از کش
    priceCache.removeFromCache(
      price.serviceSkill,
      price.serviceType,
      price.duration,
      price.therapistId
    );
    
    res.json({ success: true, message: 'قیمت حذف شد' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}






export const RefreshList=async (req, res) => {
  try {
    const count = await priceCache.loadAllPrices();
    res.json({ success: true, message: `کش رفرش شد (${count} آیتم)` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}