// api/visitors.js
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI; // موجود في Vercel
let client;
let cachedDb;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  if (!client) {
    client = new MongoClient(uri);
  }

  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }

const db = client.db("sample_mflix");
const collection = db.collection("visitors");
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    // دعم CORS البسيط
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "POST") {
    try {
      const db = await connectToDatabase();
      const collection = db.collection("visitors");

      const {
        date,
        timeIn,
        name,
        mobile,
        org,
        dept,
        reason,
        appt,
        notes,
      } = req.body;

      if (!name || !mobile) {
        return res
          .status(400)
          .json({ message: "الاسم ورقم الجوال حقول إلزامية" });
      }

      const doc = {
        date,
        timeIn,
        name,
        mobile,
        org,
        dept,
        reason,
        appt,
        notes,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(doc);

      return res
        .status(201)
        .json({ message: "تم حفظ الزائر", id: result.insertedId });
    } catch (err) {
      console.error("MongoDB error:", err);
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  }

  if (req.method === "GET") {
    try {
      const db = await connectToDatabase();
      const collection = db.collection("visitors");
      const visitors = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json(visitors);
    } catch (err) {
      console.error("MongoDB error:", err);
      return res.status(500).json({ message: "خطأ في الخادم" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
};
