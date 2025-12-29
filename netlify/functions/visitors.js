const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('visitors_db'); // غيّر اسم الـDB إذا مختلف
    const collection = db.collection('visitors');

    if (event.httpMethod === 'GET') {
      const visitors = await collection.find({}).toArray();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitors)
      };
    } 
    
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const result = await collection.insertOne({ ...data, createdAt: new Date() });
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, id: result.insertedId })
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  } finally {
    await client.close();
  }
};
