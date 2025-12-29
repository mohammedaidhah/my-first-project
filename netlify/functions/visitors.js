const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  // دعم OPTIONS لـCORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  });
  
  try {
    await client.connect();
    const db = client.db('app');  // ✅ اسم DB الصحيح من URI الخاص بك
    const collection = db.collection('visitors');

    if (event.httpMethod === 'GET') {
      const visitors = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(visitors)
      };
    } 
    
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const result = await collection.insertOne({ 
        ...data, 
        createdAt: new Date().toISOString()
      });
      return {
        statusCode: 201,
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true, id: result.insertedId })
      };
    }

    return { 
      statusCode: 405, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  } catch (error) {
    console.error('MongoDB Error:', error);
    return { 
      statusCode: 500, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'فشل في الاتصال بقاعدة البيانات', 
        details: error.message 
      })
    };
  } finally {
    await client.close();
  }
};
