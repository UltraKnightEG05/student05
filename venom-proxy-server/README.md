# Venom Proxy Server - خادم الواتساب الوسيط

## نظرة عامة

هذا الخادم يعمل كوسيط بين تطبيق إدارة الحضور المنشور على Render وخدمة الواتساب باستخدام venom-bot على جهازك الشخصي.

## الهيكل المعماري

```
[Frontend - Render] 
    ↓
[Backend - Render] 
    ↓ HTTP API
[Venom Proxy - جهازك الشخصي] 
    ↓ venom-bot
[WhatsApp Web]
```

## المتطلبات

- Node.js 16+ مثبت على جهازك
- Google Chrome مثبت
- اتصال إنترنت مستقر
- هاتف ذكي مع واتساب

## التثبيت والإعداد

### 1. تثبيت المكتبات
```bash
cd venom-proxy-server
npm install
```

### 2. إعداد متغيرات البيئة
```bash
cp .env.example .env
```

عدّل ملف `.env`:
```env
PORT=3002
API_SECRET_KEY=your-super-secret-api-key-here
ALLOWED_ORIGINS=http://localhost:3001,https://your-render-backend.onrender.com
WHATSAPP_SESSION_NAME=attendance-system-proxy
WHATSAPP_HEADLESS=true
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### 3. تشغيل الخادم
```bash
# للتطوير
npm run dev

# للإنتاج
npm start
```

## الاستخدام

### تهيئة الواتساب
1. شغّل الخادم
2. ستظهر QR Code في Terminal
3. امسح QR Code بهاتفك
4. انتظر رسالة التأكيد

### اختبار الاتصال
```bash
npm test
```

## API Endpoints

### GET /api/test
اختبار حالة الخادم

### POST /api/whatsapp/initialize
تهيئة اتصال الواتساب

### GET /api/whatsapp/status
فحص حالة اتصال الواتساب

### POST /api/whatsapp/test-message
إرسال رسالة اختبار
```json
{
  "phoneNumber": "966501234567",
  "message": "رسالة اختبار"
}
```

### POST /api/whatsapp/send-message
إرسال رسالة واحدة
```json
{
  "phoneNumber": "966501234567",
  "message": "نص الرسالة",
  "messageType": "custom"
}
```

### POST /api/whatsapp/send-bulk
إرسال رسائل متعددة
```json
{
  "messages": [
    {
      "phoneNumber": "966501234567",
      "message": "رسالة 1",
      "messageType": "absence"
    },
    {
      "phoneNumber": "966501234568",
      "message": "رسالة 2",
      "messageType": "performance"
    }
  ]
}
```

## الأمان

- جميع الطلبات المحمية تتطلب `X-API-Key` في headers
- CORS محدود للنطاقات المسموحة
- Rate limiting مفعل (100 طلب/دقيقة)

## استكشاف الأخطاء

### مشكلة: QR Code لا يظهر
- تأكد من تثبيت Chrome
- تحقق من مسار Chrome في `.env`

### مشكلة: انقطاع الاتصال
- تحقق من استقرار الإنترنت
- أعد تشغيل الخادم

### مشكلة: فشل إرسال الرسائل
- تحقق من صحة أرقام الهواتف
- تأكد من اتصال الواتساب

## الصيانة

### نسخ احتياطي
```bash
# نسخ احتياطي لملفات التوكن
tar -czf tokens-backup-$(date +%Y%m%d).tar.gz tokens/
```

### تنظيف الجلسة
```bash
# حذف ملفات التوكن لإعادة البدء
rm -rf tokens/
mkdir tokens
```

## المراقبة

- السجلات تُحفظ في مجلد `logs/`
- مراقبة حالة الاتصال كل 30 ثانية
- إعادة اتصال تلقائي عند الانقطاع

## الدعم

للمساعدة أو الإبلاغ عن مشاكل:
- تحقق من السجلات في Terminal
- راجع ملف `logs/` للتفاصيل
- تأكد من تحديث المكتبات