const { MongoClient } = require('mongodb');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();

    cachedClient = client;
    cachedDb = db;

    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('messages').createIndex({ timestamp: -1 });
    await db.collection('messages').createIndex({ roomId: 1 });

    return { client, db };
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

async function getUsersCollection() {
  const { db } = await connectToDatabase();
  return db.collection('users');
}

async function getMessagesCollection() {
  const { db } = await connectToDatabase();
  return db.collection('messages');
}

module.exports = {
  connectToDatabase,
  getUsersCollection,
  getMessagesCollection,
};
