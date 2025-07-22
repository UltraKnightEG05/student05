# ⚡ دليل البدء السريع - Venom Proxy

## 🎯 الهدف
إعداد خادم Venom Proxy على جهازك الشخصي للعمل مع نظام إدارة الحضور المنشور على Render.

## 📋 المتطلبات السريعة
- Node.js 16+ ✅
- Google Chrome ✅
- اتصال إنترنت مستقر ✅

## ⚡ خطوات البدء السريع

### 1️⃣ تحميل وإعداد Proxy (5 دقائق)
```bash
# إنشاء مجلد جديد
mkdir venom-proxy-server
cd venom-proxy-server

# نسخ الملفات (من المشروع الرئيسي)
# أو تحميل الملفات المرفقة

# تثبيت المكتبات
npm install
```

### 2️⃣ إعداد البيئة (2 دقيقة)
```bash
# نسخ ملف الإعدادات
cp .env.example .env
```

عدّل ملف `.env` - **الحد الأدنى المطلوب**:
```env
PORT=3002
API_SECRET_KEY=your-secret-key-here-change-this
ALLOWED_ORIGINS=https://your-render-backend.onrender.com
WHATSAPP_SESSION_NAME=attendance-proxy
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### 3️⃣ تشغيل الخادم (1 دقيقة)
```bash
npm start
```

### 4️⃣ مسح QR Code (2 دقيقة)
1. ستظهر QR Code في Terminal
2. افتح واتساب → الإعدادات → الأجهزة المرتبطة → ربط جهاز
3. امسح QR Code
4. انتظر رسالة النجاح ✅

### 5️⃣ اختبار سريع (1 دقيقة)
```bash
npm test
```

## 🔗 ربط مع Render

### في Render Backend Environment Variables:
```env
VENOM_PROXY_URL=http://YOUR_PUBLIC_IP:3002/api
VENOM_PROXY_API_KEY=your-secret-key-here-change-this
```

### معرفة IP العام:
```bash
curl ifconfig.me
```

## ✅ اختبار النجاح

1. **Proxy يعمل**: `http://localhost:3002/api/test` ✅
2. **الواتساب متصل**: رسالة نجاح في Terminal ✅
3. **Render يتصل**: لا توجد أخطاء في Render logs ✅
4. **إرسال رسالة**: اختبار من النظام يعمل ✅

## 🚨 حل المشاكل السريع

### مشكلة: QR Code لا يظهر
```bash
# تحقق من Chrome
google-chrome --version

# إذا لم يكن مثبت، حمّله من:
# https://www.google.com/chrome/
```

### مشكلة: Render لا يتصل
```bash
# تحقق من Firewall
# Windows:
netsh advfirewall firewall add rule name="Venom" dir=in action=allow protocol=TCP localport=3002

# تحقق من Router Port Forwarding
# افتح 192.168.1.1 وأضف Port 3002
```

### مشكلة: فشل إرسال الرسائل
```bash
# تحقق من حالة الاتصال
curl http://localhost:3002/api/whatsapp/status

# إعادة تهيئة إذا لزم الأمر
curl -X POST http://localhost:3002/api/whatsapp/initialize \
  -H "X-API-Key: your-secret-key"
```

## 🎯 نصائح سريعة

1. **احتفظ بجهازك مشغلاً** - Proxy يحتاج للعمل المستمر
2. **استخدم UPS** - لتجنب انقطاع الكهرباء
3. **راقب السجلات** - `tail -f logs/venom-proxy.log`
4. **نسخ احتياطي للتوكن** - `tar -czf tokens-backup.tar.gz tokens/`

## 📞 دعم سريع

**مشكلة؟** تحقق من:
1. Terminal للأخطاء
2. `http://localhost:3002/api/test`
3. Render logs للاتصال
4. Router settings للـ Port Forwarding

**تواصل**: 01272774494 - Sales@GO4Host.net

---

**🎉 مبروك! نظامك جاهز للعمل!**

استغرق الإعداد: **~11 دقيقة** ⏱️  
النظام يعمل: **24/7** 🌟  
الواتساب متصل: **✅** 📱