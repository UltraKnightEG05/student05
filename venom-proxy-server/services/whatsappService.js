const venom = require('venom-bot');
const fs = require('fs-extra');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isInitializing = false;
    this.qrCode = null;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.lastActivity = Date.now();
    this.statusCheckInterval = null;
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⏳ الواتساب قيد التهيئة بالفعل...');
      return { success: false, message: 'جاري التهيئة بالفعل...' };
    }

    if (this.isConnected && this.client) {
      console.log('✅ الواتساب متصل بالفعل');
      return { success: true, message: 'الواتساب متصل بالفعل', alreadyConnected: true };
    }

    this.isInitializing = true;
    this.stopStatusCheck();

    try {
      console.log('🚀 بدء تهيئة الواتساب...');
      
      // تنظيف الاتصال السابق إن وجد
      await this.cleanup();
      
      this.client = await venom.create(
        process.env.WHATSAPP_SESSION_NAME || 'attendance-system-proxy',
        (base64Qr, asciiQR, attempts, urlCode) => {
          console.log(`📱 QR Code جديد - المحاولة: ${attempts}`);
          console.log('🔗 URL Code:', urlCode);
          console.log('\n' + asciiQR + '\n');
          this.qrCode = base64Qr;
          
          if (attempts >= 5) {
            console.log('⚠️ تم الوصول للحد الأقصى من محاولات QR Code');
          }
          
          console.log('\n📋 خطوات المسح:');
          console.log('1. افتح واتساب على هاتفك');
          console.log('2. اذهب إلى: الإعدادات > الأجهزة المرتبطة');
          console.log('3. اضغط على "ربط جهاز"');
          console.log('4. امسح QR Code أعلاه');
          console.log('5. انتظر رسالة التأكيد\n');
        },
        (statusSession, session) => {
          console.log(`📊 تغيير حالة الجلسة: ${statusSession}`);
          console.log(`📱 اسم الجلسة: ${session}`);
          
          switch (statusSession) {
            case 'isLogged':
            case 'qrReadSuccess':
            case 'chatsAvailable':
              this.isConnected = true;
              this.isInitializing = false;
              this.connectionRetries = 0;
              this.lastActivity = Date.now();
              console.log('✅ تم الاتصال بالواتساب بنجاح!');
              this.startStatusCheck();
              break;
            case 'notLogged':
              this.isConnected = false;
              console.log('❌ لم يتم تسجيل الدخول');
              break;
            case 'browserClose':
              this.isConnected = false;
              console.log('🔒 تم إغلاق المتصفح');
              this.handleDisconnection();
              break;
            case 'qrReadFail':
              console.log('❌ فشل في مسح QR Code');
              break;
            case 'autocloseCalled':
              console.log('🔄 تم استدعاء الإغلاق التلقائي');
              this.handleDisconnection();
              break;
            case 'desconnectedMobile':
              console.log('📱 انقطع الاتصال من الهاتف');
              this.handleDisconnection();
              break;
            default:
              console.log(`ℹ️ حالة غير معروفة: ${statusSession}`);
          }
        },
        {
          folderNameToken: process.env.TOKENS_PATH || './tokens',
          mkdirFolderToken: '',
          headless: process.env.WHATSAPP_HEADLESS === 'true',
          devtools: process.env.WHATSAPP_DEBUG === 'true',
          useChrome: true,
          debug: process.env.WHATSAPP_DEBUG === 'true',
          logQR: true,
          puppeteerOptions: {
            headless: process.env.WHATSAPP_HEADLESS === 'true' ? 'new' : false,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--single-process',
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-field-trial-config',
              '--disable-back-forward-cache',
              '--disable-features=TranslateUI',
              '--disable-ipc-flooding-protection',
              '--memory-pressure-off',
              '--max_old_space_size=4096',
              '--disable-extensions',
              '--disable-plugins',
              '--disable-default-apps',
              '--disable-background-networking',
              '--disable-sync',
              '--disable-translate',
              '--hide-scrollbars',
              '--disable-notifications'
            ],
            executablePath: process.env.CHROME_PATH,
            defaultViewport: null,
            ignoreHTTPSErrors: true,
            slowMo: 0,
            timeout: 120000
          },
          autoClose: parseInt(process.env.WHATSAPP_AUTO_CLOSE) || 0,
          createPathFileToken: true,
          waitForLogin: true,
          disableSpins: process.env.WHATSAPP_DISABLE_SPINS === 'true',
          disableWelcome: process.env.WHATSAPP_DISABLE_WELCOME === 'true',
          timeout: 120000,
          logQR: false,
          browserWS: '',
          addProxy: [],
          browserArgs: []
        }
      );
      
      if (this.client) {
        this.setupEventHandlers();
        
        // انتظار حتى يتم الاتصال
        const timeout = 120000; // دقيقتان
        const startTime = Date.now();
        
        while (!this.isConnected && (Date.now() - startTime) < timeout && this.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (this.isConnected) {
          console.log('🎉 تم تهيئة الواتساب بنجاح!');
          this.startStatusCheck();
          return { success: true, message: 'تم تهيئة الواتساب بنجاح!' };
        } else {
          this.isInitializing = false;
          return { success: false, message: 'انتهت المهلة الزمنية للاتصال. يرجى المحاولة مرة أخرى.' };
        }
      }
      
      this.isInitializing = false;
      return { success: false, message: 'فشل في إنشاء جلسة الواتساب' };
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة الواتساب:', error);
      this.isInitializing = false;
      this.isConnected = false;
      
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        console.log(`🔄 إعادة المحاولة ${this.connectionRetries}/${this.maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.initialize();
      }
      
      return { 
        success: false, 
        message: `خطأ في تهيئة الواتساب: ${error.message}` 
      };
    }
  }

  setupEventHandlers() {
    if (!this.client) return;

    try {
      this.client.onMessage(async (message) => {
        this.lastActivity = Date.now();
        console.log('📨 رسالة واردة:', message.from);
      });

      this.client.onStateChange((state) => {
        console.log('🔄 تغيير حالة الاتصال:', state);
        this.lastActivity = Date.now();
        
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
          console.log('⚠️ تعارض في الاتصال، محاولة إعادة الاتصال...');
          this.handleDisconnection();
        } else if (state === 'CONNECTED') {
          this.isConnected = true;
          this.connectionRetries = 0;
        }
      });

      this.client.onStreamChange((state) => {
        console.log('📡 تغيير حالة البث:', state);
        this.lastActivity = Date.now();
        
        if (state === 'DISCONNECTED') {
          console.log('📡 انقطع البث، محاولة إعادة الاتصال...');
          this.handleDisconnection();
        }
      });

    } catch (error) {
      console.error('❌ خطأ في إعداد معالجات الأحداث:', error);
    }
  }

  startStatusCheck() {
    this.stopStatusCheck();
    
    this.statusCheckInterval = setInterval(async () => {
      try {
        if (!this.client) {
          this.isConnected = false;
          return;
        }

        const state = await this.client.getConnectionState();
        const isActive = state === 'CONNECTED' || state === 'OPENING' || state === 'OPEN';
        
        if (!isActive) {
          console.log('⚠️ الاتصال غير نشط:', state);
          this.handleDisconnection();
          return;
        }

        try {
          await this.client.getHostDevice();
          this.lastActivity = Date.now();
        } catch (error) {
          console.log('❌ فشل فحص صحة الجلسة:', error.message);
          this.handleDisconnection();
        }

      } catch (error) {
        console.error('❌ خطأ في فحص حالة الاتصال:', error);
        this.handleDisconnection();
      }
    }, 30000); // كل 30 ثانية
  }

  stopStatusCheck() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  handleDisconnection() {
    console.log('🔄 معالجة انقطاع الاتصال...');
    this.isConnected = false;
    this.stopStatusCheck();
    
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++;
      console.log(`🔄 محاولة إعادة الاتصال ${this.connectionRetries}/${this.maxRetries}...`);
      
      setTimeout(() => {
        this.initialize();
      }, 10000);
    } else {
      console.log('❌ فشل في إعادة الاتصال بعد عدة محاولات');
    }
  }

  async sendMessage(phoneNumber, message, messageType = 'custom') {
    if (!this.isConnected || !this.client) {
      throw new Error('الواتساب غير متصل. يرجى التهيئة أولاً.');
    }

    try {
      const state = await this.client.getConnectionState();
      if (state !== 'CONNECTED') {
        throw new Error('الاتصال غير مستقر. يرجى إعادة التهيئة.');
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`📤 إرسال رسالة إلى ${formattedNumber}`);
      
      const result = await this.client.sendText(formattedNumber, message);
      console.log('✅ تم إرسال الرسالة بنجاح:', result.id);
      
      this.lastActivity = Date.now();
      
      // انتظار قصير بين الرسائل
      await new Promise(resolve => setTimeout(resolve, parseInt(process.env.MESSAGE_DELAY) || 3000));
      
      return {
        success: true,
        messageId: result.id,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      
      let errorMessage = error.message;
      
      if (error.message.includes('number not exists')) {
        errorMessage = `الرقم ${phoneNumber} غير مسجل في الواتساب`;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'تم تجاوز حد الإرسال، يرجى المحاولة لاحقاً';
      } else if (error.message.includes('blocked')) {
        errorMessage = 'تم حظر الحساب مؤقتاً';
      } else if (error.message.includes('Session closed')) {
        errorMessage = 'انقطع الاتصال بالواتساب';
        this.handleDisconnection();
      }
      
      throw new Error(errorMessage);
    }
  }

  async testMessage(phoneNumber, message = null) {
    try {
      const testMsg = message || `🧪 رسالة اختبار من نظام إدارة الحضور

هذه رسالة اختبار للتأكد من عمل النظام.

الوقت: ${new Date().toLocaleString('en-GB')}

📚 نظام إدارة الحضور`;
      
      console.log(`🧪 اختبار إرسال رسالة إلى: ${phoneNumber}`);
      const result = await this.sendMessage(phoneNumber, testMsg, 'test');
      
      return {
        success: true,
        message: 'تم إرسال رسالة الاختبار بنجاح',
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ فشل اختبار الرسالة:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBulkMessages(messages) {
    const results = [];
    let successCount = 0;
    let failedCount = 0;
    
    console.log(`📤 بدء إرسال ${messages.length} رسالة...`);
    
    for (const msg of messages) {
      try {
        const result = await this.sendMessage(msg.phoneNumber, msg.message, msg.messageType || 'bulk');
        results.push({
          phoneNumber: msg.phoneNumber,
          success: true,
          messageId: result.messageId,
          timestamp: result.timestamp
        });
        successCount++;
        console.log(`✅ تم إرسال الرسالة ${successCount}/${messages.length}`);
      } catch (error) {
        results.push({
          phoneNumber: msg.phoneNumber,
          success: false,
          error: error.message
        });
        failedCount++;
        console.error(`❌ فشل إرسال الرسالة ${successCount + failedCount}/${messages.length}:`, error.message);
      }
    }
    
    console.log(`📊 ملخص الإرسال: ${successCount} نجح، ${failedCount} فشل`);
    return results;
  }

  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('رقم الهاتف مطلوب');
    }
    
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length < 10) {
      throw new Error('رقم الهاتف قصير جداً');
    }
    
    // دعم الأرقام المصرية والسعودية
    if (cleaned.startsWith('20')) {
      if (!cleaned.match(/^20[0-9]{9,10}$/)) {
        throw new Error('رقم الهاتف المصري غير صحيح');
      }
    } else if (cleaned.startsWith('966')) {
      if (!cleaned.match(/^966[5][0-9]{8}$/)) {
        throw new Error('رقم الهاتف السعودي غير صحيح');
      }
    } else {
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      
      if (cleaned.startsWith('5') && cleaned.length === 9) {
        cleaned = '966' + cleaned;
      } else if (cleaned.startsWith('1') && cleaned.length >= 9) {
        cleaned = '20' + cleaned;
      } else {
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
          cleaned = '20' + cleaned;
        } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
          cleaned = '966' + cleaned;
        } else {
          console.warn('⚠️ تنسيق رقم غير معروف، سيتم المحاولة كما هو:', cleaned);
        }
      }
    }
    
    return cleaned + '@c.us';
  }

  async cleanup() {
    try {
      this.stopStatusCheck();
      
      if (this.client) {
        console.log('🧹 تنظيف الاتصال السابق...');
        try {
          await this.client.close();
        } catch (error) {
          console.log('⚠️ خطأ في إغلاق الاتصال السابق:', error.message);
        }
        this.client = null;
      }
      
      this.isConnected = false;
      this.isInitializing = false;
      this.connectionRetries = 0;
      this.qrCode = null;
      
    } catch (error) {
      console.error('❌ خطأ في تنظيف الاتصال:', error);
    }
  }

  async disconnect() {
    console.log('🔌 قطع اتصال الواتساب...');
    await this.cleanup();
    console.log('✅ تم قطع الاتصال بنجاح');
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected && this.client !== null,
      qrCode: this.qrCode,
      lastActivity: this.lastActivity,
      retries: this.connectionRetries
    };
  }

  async validateConnection() {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const state = await this.client.getConnectionState();
      const isValid = state === 'CONNECTED';
      
      if (!isValid) {
        console.log('⚠️ الاتصال غير صالح:', state);
        this.handleDisconnection();
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ خطأ في التحقق من صحة الاتصال:', error);
      this.handleDisconnection();
      return false;
    }
  }
}

module.exports = WhatsAppService;