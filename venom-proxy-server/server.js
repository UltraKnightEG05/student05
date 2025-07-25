const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const WhatsAppService = require('./services/whatsappService');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🚀 بدء تشغيل خادم Venom Proxy...');
console.log('📍 المنفذ:', PORT);
console.log('🌍 البيئة:', process.env.NODE_ENV || 'development');

// إنشاء المجلدات المطلوبة
const requiredDirs = ['./tokens', './logs'];
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 تم إنشاء المجلد: ${dir}`);
  }
});

// إعدادات الأمان
app.use(helmet());

// إعدادات CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 دقيقة
  max: 100, // 100 طلب في الدقيقة
  message: 'تم تجاوز الحد المسموح من الطلبات'
});
app.use(limiter);

// Middleware للتحقق من API Key
const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  const expectedKey = process.env.API_SECRET_KEY;
  
  if (!expectedKey) {
    console.warn('⚠️ لم يتم تعيين API_SECRET_KEY في متغيرات البيئة');
    return next(); // السماح في حالة عدم تعيين المفتاح (للتطوير)
  }
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ 
      success: false, 
      message: 'غير مصرح بالوصول - مفتاح API غير صحيح' 
    });
  }
  
  next();
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إنشاء خدمة الواتساب
const whatsappService = new WhatsAppService();

// Middleware للتسجيل
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes

// اختبار الاتصال
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Venom Proxy Server يعمل بشكل صحيح',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// تهيئة الواتساب
app.post('/api/whatsapp/initialize', authenticateAPI, async (req, res) => {
  try {
    console.log('🚀 طلب تهيئة الواتساب...');
    
    const result = await whatsappService.initialize();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        alreadyConnected: result.alreadyConnected || false
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message || 'فشل في تهيئة الواتساب'
      });
    }
  } catch (error) {
    console.error('❌ خطأ في تهيئة الواتساب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تهيئة الواتساب: ' + error.message
    });
  }
});

// فحص حالة الاتصال
app.get('/api/whatsapp/status', (req, res) => {
  const status = whatsappService.getConnectionStatus();
  res.json({
    success: true,
    data: {
      connected: status.connected,
      qrCode: status.qrCode,
      timestamp: new Date().toISOString()
    }
  });
});

// إرسال رسالة اختبار
app.post('/api/whatsapp/test-message', authenticateAPI, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف مطلوب'
      });
    }
    
    const result = await whatsappService.testMessage(phoneNumber, message);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار الرسالة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال الرسالة: ' + error.message
    });
  }
});

// إرسال رسالة واحدة
app.post('/api/whatsapp/send-message', authenticateAPI, async (req, res) => {
  try {
    const { phoneNumber, message, messageType = 'custom' } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف والرسالة مطلوبان'
      });
    }
    
    const result = await whatsappService.sendMessage(phoneNumber, message, messageType);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'تم إرسال الرسالة بنجاح',
        messageId: result.messageId,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('❌ خطأ في إرسال الرسالة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال الرسالة: ' + error.message
    });
  }
});

// إرسال رسائل متعددة
app.post('/api/whatsapp/send-bulk', authenticateAPI, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'قائمة الرسائل مطلوبة'
      });
    }
    
    const results = await whatsappService.sendBulkMessages(messages);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    res.json({
      success: true,
      message: `تم إرسال ${successCount} رسالة بنجاح، فشل ${failedCount}`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount
      }
    });
  } catch (error) {
    console.error('❌ خطأ في إرسال الرسائل المتعددة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرسال الرسائل: ' + error.message
    });
  }
});

// قطع الاتصال
app.post('/api/whatsapp/disconnect', authenticateAPI, async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({
      success: true,
      message: 'تم قطع الاتصال بنجاح'
    });
  } catch (error) {
    console.error('❌ خطأ في قطع الاتصال:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في قطع الاتصال: ' + error.message
    });
  }
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error('❌ خطأ في الخادم:', err);
  res.status(500).json({
    success: false,
    message: 'خطأ داخلي في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// معالجة المسارات غير الموجودة
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود',
    path: req.originalUrl
  });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log('\n🎉 تم تشغيل Venom Proxy Server بنجاح!');
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`🔗 يمكن الوصول للخادم على: http://localhost:${PORT}`);
  console.log(`🔑 API Endpoint: http://localhost:${PORT}/api`);
  console.log('\n📋 للاختبار:');
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   POST http://localhost:${PORT}/api/whatsapp/initialize`);
  console.log('\n⚠️  تذكر: أضف X-API-Key في headers للطلبات المحمية');
  
  // تهيئة الواتساب تلقائياً عند بدء التشغيل
  setTimeout(() => {
    console.log('\n🔄 بدء تهيئة الواتساب التلقائية...');
    whatsappService.initialize().then(result => {
      if (result.success) {
        console.log('✅ تم تهيئة الواتساب تلقائياً');
      } else {
        console.log('⚠️ فشل في التهيئة التلقائية - يمكن التهيئة يدوياً لاحقاً');
      }
    });
  }, 3000);
});

// معالجة الإغلاق الآمن
process.on('SIGINT', async () => {
  console.log('\n🛑 إيقاف الخادم...');
  await whatsappService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 إيقاف الخادم...');
  await whatsappService.disconnect();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ خطأ غير معالج:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise مرفوض غير معالج:', reason);
});