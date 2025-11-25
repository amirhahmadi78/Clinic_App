
import Transaction from "../models/transaction.js";

class TransactionService {
  
  // 📥 واریز به کیف پول (افزایش موجودی)
  async walletDeposit(patientId, amount, description = "واریز به کیف پول") {
    try {
      const transaction = await Transaction.create({
        patientId,
        amount,
        for: "wallet",
        type: "induce",
        description: description || `واریز به کیف پول - ${this.formatAmount(amount)} تومان`
      });
      
      return {
        success: true,
        transaction,
        message: "واریز با موفقیت انجام شد"
      };
    } catch (error) {
      throw new Error(`خطا در واریز: ${error.message}`);
    }
  }

  // 📤 برداشت از کیف پول (کاهش موجودی)
  async walletWithdraw(patientId, amount, description = "برداشت از کیف پول") {
    try {
      // چک کردن موجودی کافی
      const balance = await this.calculateBalance(patientId);
      if (balance < amount) {
        return {
          success: false,
          message: "موجودی کیف پول کافی نیست"
        };
      }

      const transaction = await Transaction.create({
        patientId,
        amount,
        for: "wallet",
        type: "reduce",
        description: description || `برداشت از کیف پول - ${this.formatAmount(amount)} تومان`
      });

      return {
        success: true,
        transaction,
        message: "برداشت با موفقیت انجام شد"
      };
    } catch (error) {
      throw new Error(`خطا در برداشت: ${error.message}`);
    }
  }

  // 💳 پرداخت جلسه درمان (کاهش موجودی)
  async appointmentPayment(patientId, amount, appointmentId, description) {
    try {
      // چک کردن موجودی کافی
      const balance = await this.calculateBalance(patientId);
      if (balance < amount) {
        return {
          success: false,
          message: "موجودی کیف پول برای پرداخت جلسه کافی نیست"
        };
      }

      const transaction = await Transaction.create({
        patientId,
        amount,
        for: "appointment",
        appointmentId,
        type: "reduce",
        description: description || `پرداخت جلسه درمان - ${this.formatAmount(amount)} تومان`
      });

      return {
        success: true,
        transaction,
        message: "پرداخت جلسه با موفقیت انجام شد"
      };
    } catch (error) {
      throw new Error(`خطا در پرداخت جلسه: ${error.message}`);
    }
  }

  // ↩️ کنسل کردن پرداخت جلسه (بازگشت پول - افزایش موجودی)
  async appointmentCancel(patientId, amount, appointmentId, description) {
    try {
      const transaction = await Transaction.create({
        patientId,
        amount,
        for: "appointment",
        appointmentId,
        type: "induce",
        description: description || `بازپرداخت کنسل شده جلسه - ${this.formatAmount(amount)} تومان`
      });

      return {
        success: true,
        transaction,
        message: "بازپرداخت با موفقیت انجام شد"
      };
    } catch (error) {
      throw new Error(`خطا در بازپرداخت: ${error.message}`);
    }
  }

  // 💰 محاسبه موجودی فعلی
  async calculateBalance(patientId) {
    try {
      const transactions = await Transaction.find({ 
        patientId
      });

      return transactions.reduce((balance, txn) => {
        if (txn.type === "induce") {
          return balance + txn.amount;
        } else {
          return balance - txn.amount;
        }
      }, 0);
    } catch (error) {
      throw new Error(`خطا در محاسبه موجودی: ${error.message}`);
    }
  }

  // 📊 گرفتن موجودی و اطلاعات
  async getWalletInfo(patientId) {
    try {
      const balance = await this.calculateBalance(patientId);
      const lastTransactions = await this.getTransactionHistory(patientId, 1, 5);
      
      return {
        balance,
        lastTransactions: lastTransactions.transactions,
        currency: "تومان"
      };
    } catch (error) {
      throw new Error(`خطا در دریافت اطلاعات کیف پول: ${error.message}`);
    }
  }

  // 📜 تاریخچه تراکنش‌ها
  async getTransactionHistory(patientId, page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      
      // ساخت کوئری
      const query = { patientId };
      if (filters.type) query.type = filters.type;
      if (filters.for) query.for = filters.for;
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('appointmentId')
        .lean();

      const total = await Transaction.countDocuments(query);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`خطا در دریافت تاریخچه: ${error.message}`);
    }
  }

  // 🔍 گرفتن تراکنش‌های یک نوبت خاص
  async getAppointmentTransactions(appointmentId) {
    try {
      const transactions = await Transaction.find({ 
        appointmentId,
        for: "appointment"
      }).sort({ createdAt: -1 });

      return transactions;
    } catch (error) {
      throw new Error(`خطا در دریافت تراکنش‌های نوبت: ${error.message}`);
    }
  }

  // ✅ چک کردن موجودی کافی
  async hasSufficientBalance(patientId, amount) {
    const balance = await this.calculateBalance(patientId);
    return balance >= amount;
  }

  // 🎯 فرمت مبلغ
  formatAmount(amount) {
    return new Intl.NumberFormat('fa-IR').format(amount);
  }
}

export default new TransactionService();