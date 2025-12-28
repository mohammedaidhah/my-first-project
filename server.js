const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // مجلد HTML/CSS/JS

// اتصال MongoDB
mongoose.connect('mongodb://localhost:27017/gostation', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB متصل بنجاح');
}).catch(err => {
  console.error('❌ خطأ MongoDB:', err);
});

// نموذج Visitor
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
}, { timestamps: true });

const Visitor = mongoose.model('Visitor', visitorSchema);

// 🔥 جميع المسارات
app.get('/api/visitors', async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/visitors', async (req, res) => {
  try {
    const visitor = new Visitor(req.body);
    await visitor.save();
    res.status(201).json(visitor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/visitors/:id', async (req, res) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم الحذف' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 🔥 ENDPOINTS الاستعادة والحذف الكامل
app.post('/api/visitors/restore', async (req, res) => {
  try {
    const { visitors, action } = req.body;
    console.log(`🔄 استعادة: ${visitors.length} سجل`);
    
    if (action === 'replace_all') {
      await Visitor.deleteMany({});
      if (visitors.length > 0) {
        await Visitor.insertMany(visitors);
      }
    }
    
    res.json({ 
      success: true, 
      count: visitors.length,
      message: `تم تحديث ${visitors.length} سجل بنجاح`
    });
  } catch (error) {
    console.error('❌ Restore error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/visitors/clear', async (req, res) => {
  try {
    await Visitor.deleteMany({});
    console.log('🗑️ تم حذف جميع البيانات');
    res.json({ success: true, message: 'تم حذف جميع البيانات بنجاح' });
  } catch (error) {
    console.error('❌ Clear error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// خدمة الملفات الثابتة
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});
