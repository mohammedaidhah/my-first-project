const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // زيادة حد الحجم للاستعادة
app.use(express.static('public'));

// ✅ اتصال MongoDB محسّن
mongoose.connect('mongodb://localhost:27017/gostation', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB متصل بنجاح');
}).catch(err => {
  console.error('❌ خطأ MongoDB:', err);
});

// ✅ Schema محسّن مع _id
const visitorSchema = new mongoose.Schema({
  date: String,
  timeIn: String,
  name: String,
  mobile: String,
  org: String,
  dept: String,
  reason: String,
  appt: String,
  notes: String
}, { 
  timestamps: true,
  _id: false // للسماح بـ _id مخصص من localStorage
});

const Visitor = mongoose.model('Visitor', visitorSchema);

// 🔥 1. جلب البيانات (مع fallback)
app.get('/api/visitors', async (req, res) => {
  try {
    console.log('📥 طلب جلب البيانات...');
    const visitors = await Visitor.find().sort({ createdAt: -1 }).lean();
    console.log(`✅ تم جلب ${visitors.length} سجل من MongoDB`);
    res.json(visitors);
  } catch (error) {
    console.error('❌ خطأ جلب البيانات:', error);
    res.status(500).json({ message: error.message });
  }
});

// 🔥 2. إضافة زائر جديد
app.post('/api/visitors', async (req, res) => {
  try {
    console.log('➕ إضافة زائر جديد:', req.body.name);
    const visitor = new Visitor(req.body);
    await visitor.save();
    console.log('✅ تم حفظ الزائر في MongoDB');
    res.status(201).json(visitor);
  } catch (error) {
    console.error('❌ خطأ الحفظ:', error);
    res.status(400).json({ message: error.message });
  }
});

// 🔥 3. حذف زائر
app.delete('/api/visitors/:id', async (req, res) => {
  try {
    console.log('🗑️ حذف:', req.params.id);
    const result = await Visitor.findByIdAndDelete(req.params.id);
    if (result) {
      console.log('✅ تم الحذف');
      res.json({ message: 'تم الحذف' });
    } else {
      res.status(404).json({ message: 'لم يتم العثور على السجل' });
    }
  } catch (error) {
    console.error('❌ خطأ الحذف:', error);
    res.status(500).json({ message: error.message });
  }
});

// 🔥 4. استعادة النسخة الاحتياطية (الأهم!)
app.post('/api/visitors/restore', async (req, res) => {
  try {
    const { visitors, action } = req.body;
    console.log(`🔄 استعادة: ${visitors.length} سجل (${action})`);
    
    if (action === 'replace_all') {
      // حذف القديم
      const deleteResult = await Visitor.deleteMany({});
      console.log(`🗑️ تم حذف ${deleteResult.deletedCount} سجل قديم`);
      
      // إضافة الجديد
      if (visitors.length > 0) {
        const insertResult = await Visitor.insertMany(visitors, { ordered: false });
        console.log(`✅ تم إضافة ${insertResult.length} سجل جديد`);
      }
    }
    
    res.json({ 
      success: true, 
      count: visitors.length,
      deleted: deleteResult?.deletedCount || 0,
      message: `تم تحديث ${visitors.length} سجل بنجاح في MongoDB`
    });
  } catch (error) {
    console.error('❌ خطأ الاستعادة:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔥 5. حذف كامل
app.delete('/api/visitors/clear', async (req, res) => {
  try {
    const result = await Visitor.deleteMany({});
    console.log(`🗑️ تم حذف ${result.deletedCount} سجل`);
    res.json({ success: true, count: result.deletedCount, message: 'تم حذف جميع البيانات' });
  } catch (error) {
    console.error('❌ خطأ الحذف الكامل:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
  console.log(`📊 MongoDB database: gostation`);
});
