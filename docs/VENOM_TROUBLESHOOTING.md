# 🔧 دليل حل مشاكل Venom-Bot

## 🚨 المشاكل الشائعة وحلولها

### 1. مشكلة إعادة التشغيل المستمر (nodemon)

**الأعراض:**
```
[nodemon] restarting due to changes...
[nodemon] restarting due to changes...
```

**الحل:**
```bash
# أوقف nodemon
Ctrl+C

# استخدم npm start بدلاً من npm run dev
npm start

# أو أضف .nodemonignore
echo "tokens/" >> .nodemonignore
echo "logs/" >> .nodemonignore
echo "*.log" >> .nodemonignore
```

### 2. مشكلة Puppeteer Headless Warning

**الأعراض:**
```
Warning: The usage of "headless: true" is deprecated
```

**الحل:**
- تم تحديث الكود لاستخدام `headless: 'new'`
- تحديث إعدادات .env

### 3. مشكلة عدم ظهور QR Code

**الأعراض:**
- الخادم يعمل لكن لا يظهر QR Code
- يتوقف عند "initWhatsapp"

**الحلول:**

#### الحل 1: تشغيل بدون headless
```env
# في .env
WHATSAPP_HEADLESS=false
```

#### الحل 2: تنظيف وإعادة التثبيت
```bash
# تشغيل سكريبت الإصلاح
node scripts/fix-venom.js

# إعادة التثبيت
npm install

# تشغيل اختبار Chrome
node scripts/test-chrome.js
```

#### الحل 3: استخدام إصدار أقدم من venom-bot
```bash
npm uninstall venom-bot
npm install venom-bot@4.0.0
```

### 4. مشكلة Chrome Path

**الأعراض:**
```
Could not find expected browser
```

**الحل:**
```bash
# البحث عن Chrome
where chrome
# أو
dir "C:\Program Files\Google\Chrome\Application\chrome.exe"

# تحديث .env
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### 5. مشكلة الصلاحيات (Linux/Mac)

**الحل:**
```bash
# إعطاء صلاحيات للمجلدات
chmod 755 tokens/
chmod 755 logs/

# تشغيل مع sudo إذا لزم الأمر
sudo npm start
```

## 🛠️ خطوات الإصلاح المتقدمة

### الخطوة 1: تنظيف كامل
```bash
# حذف جميع الملفات المؤقتة
rm -rf node_modules/
rm -rf tokens/
rm -rf logs/
rm package-lock.json

# إعادة إنشاء المجلدات
mkdir tokens
mkdir logs
```

### الخطوة 2: إعادة التثبيت
```bash
# تثبيت نظيف
npm cache clean --force
npm install
```

### الخطوة 3: اختبار Chrome
```bash
# تشغيل اختبار Chrome
node scripts/test-chrome.js
```

### الخطوة 4: تشغيل تدريجي
```bash
# تشغيل بدون headless أولاً
# في .env: WHATSAPP_HEADLESS=false
npm start

# إذا عمل، غيّر إلى headless
# في .env: WHATSAPP_HEADLESS=true
```

## 🔍 تشخيص المشاكل

### فحص النظام:
```bash
# فحص Node.js
node --version

# فحص npm
npm --version

# فحص Chrome
google-chrome --version
```

### فحص الشبكة:
```bash
# اختبار الاتصال
ping google.com

# فحص المنافذ
netstat -an | findstr :3002
```

### فحص الملفات:
```bash
# التحقق من وجود الملفات
ls -la tokens/
ls -la logs/

# فحص الصلاحيات
ls -la .env
```

## 📞 الدعم الفني

### إذا استمرت المشاكل:

1. **جمع معلومات التشخيص:**
```bash
node --version
npm --version
google-chrome --version
echo $CHROME_PATH
```

2. **إرسال السجلات:**
```bash
# حفظ السجلات
npm start > debug.log 2>&1
```

3. **تجربة البدائل:**
- استخدام Chromium بدلاً من Chrome
- تشغيل على منفذ مختلف
- استخدام إصدار أقدم من venom-bot

## ✅ قائمة التحقق النهائية

- [ ] Node.js 16+ مثبت
- [ ] Chrome مثبت ويعمل
- [ ] مسار Chrome صحيح في .env
- [ ] المجلدات tokens و logs موجودة
- [ ] الصلاحيات صحيحة
- [ ] لا توجد عمليات Chrome أخرى تعمل
- [ ] اتصال إنترنت مستقر
- [ ] Firewall يسمح بالمنفذ 3002

## 🎯 نصائح للنجاح

1. **ابدأ بسيط**: استخدم headless=false أولاً
2. **اختبر تدريجياً**: تأكد من كل خطوة
3. **راقب السجلات**: تابع الرسائل في Terminal
4. **كن صبوراً**: قد يستغرق الاتصال دقيقتين
5. **احتفظ بنسخ احتياطية**: للتوكن والإعدادات

---

**تذكر**: venom-bot يحتاج وقت للاتصال، لا تتعجل وانتظر ظهور QR Code! 🕐✨