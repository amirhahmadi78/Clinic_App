// utils/priceCache.js
import ServicePrice from '../models/ServicePrice.js';

class PriceCache {
  constructor() {
    this.cache = new Map();
  }

  async loadAllPrices() {
    
    
    const prices = await ServicePrice.getAllPrices();
    
    this.cache.clear();
    
    // ساختار: "SLP_session_45" -> 200000
    prices.forEach(price => {
      const key = this._generateKey(
        price.serviceSkill,
        price.serviceType,
        price.duration,
        price.therapistId
      );
      this.cache.set(key, price.basePrice);
    });
    
 
    return prices.length;
  }

  getPrice(serviceSkill, serviceType, duration, therapistId = null) {
    // اول قیمت مخصوص درمانگر
    if (therapistId) {
      const therapistKey = this._generateKey(serviceSkill, serviceType, duration, therapistId);
      if (this.cache.has(therapistKey)) {
        return this.cache.get(therapistKey);
      }
    }
    
    // بعد قیمت عمومی
    const generalKey = this._generateKey(serviceSkill, serviceType, duration, null);
    return this.cache.get(generalKey) || null;
  }

  // آپدیت کش بعد از تغییر
  async updateCache(serviceSkill, serviceType, duration, newPrice, therapistId = null) {
    const key = this._generateKey(serviceSkill, serviceType, duration, therapistId);
    this.cache.set(key, newPrice);
    console.log(`✏️ کش آپدیت شد: ${key} -> ${newPrice}`);
  }

  // حذف از کش
  removeFromCache(serviceSkill, serviceType, duration, therapistId = null) {
    const key = this._generateKey(serviceSkill, serviceType, duration, therapistId);
    this.cache.delete(key);
  }

  _generateKey(serviceSkill, serviceType, duration, therapistId) {
    return `${serviceSkill}_${serviceType}_${duration}_${therapistId || 'general'}`;
  }

  // فقط برای دیباگ
  getCacheStats() {
    return {
      totalItems: this.cache.size,
      sampleKeys: Array.from(this.cache.keys()).slice(0, 5)
    };
  }
}

// Singleton
const priceCache = new PriceCache();

export default priceCache;