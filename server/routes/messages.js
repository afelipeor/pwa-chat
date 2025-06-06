const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateRequest } = require('../lib/auth');
const { getMessagesCollection, connectToDatabase } = require('../lib/mongodb');
const { sendNotificationToAll } = require('../lib/notifications');

const router = express.Router();

// Get messages (with optional conversation filter)
router.get('/', async (req, res) => {
  const user = authenticateRequest(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { conversationId } = req.query;

  try {
    const messages = await getMessagesCollection();
    let query = {};

    // If conversationId is provided, filter by it
    if (conversationId) {
      query.conversationId = new ObjectId(conversationId);

      // Verify user is part of this conversation
      const { db } = await connectToDatabase();
      const conversation = await db.collection('conversations').findOne({
        _id: new ObjectId(conversationId),
        participants: new ObjectId(user.userId),
      });

      if (!conversation) {
        return res
          .status(403)
          .json({ message: 'Access denied to this conversation' });
      }
    }

    const result = await messages.find(query).sort({ timestamp: 1 }).toArray();

    const formattedMessages = result.map((msg) => ({
      id: msg._id.toString(),
      text: msg.text,
      username: msg.username,
      userId: msg.userId.toString(),
      timestamp: msg.timestamp.toISOString(),
      conversationId: msg.conversationId?.toString(),
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/send', async (req, res) => {
  const user = authenticateRequest(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { text, conversationId } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Message text is required' });
  }

  if (!conversationId) {
    return res.status(400).json({ message: 'Conversation ID is required' });
  }

  try {
    const { db } = await connectToDatabase();

    // Verify conversation exists and user is a participant
    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(user.userId),
    });

    if (!conversation) {
      return res
        .status(403)
        .json({ message: 'Access denied to this conversation' });
    }

    // Insert message
    const messages = await getMessagesCollection();
    const message = {
      text: text.trim(),
      username: user.username,
      userId: new ObjectId(user.userId),
      conversationId: new ObjectId(conversationId),
      timestamp: new Date(),
    };

    const result = await messages.insertOne(message);

    // Update conversation's last activity
    await db
      .collection('conversations')
      .updateOne(
        { _id: new ObjectId(conversationId) },
        { $set: { updatedAt: new Date() } }
      );

    // Send push notifications to other participants
    try {
      await sendNotificationToAll(
        `${user.username}: ${text.trim()}`,
        user.userId
      );
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the message send if notifications fail
    }

    // Return the created message
    const createdMessage = {
      id: result.insertedId.toString(),
      text: message.text,
      username: message.username,
      userId: message.userId.toString(),
      conversationId: message.conversationId.toString(),
      timestamp: message.timestamp.toISOString(),
    };

    res.status(201).json(createdMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
