const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateRequest } = require('../lib/auth');
const { getMessagesCollection } = require('../lib/mongodb');
const { sendNotificationToAll } = require('../lib/notifications');
const { toPublicMessage } = require('../models/Message');

const router = express.Router();

// Get messages
router.get('/', async (req, res) => {
  const user = authenticateRequest(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const messages = await getMessagesCollection();
    const roomId = req.query.roomId || 'general';
    const limit = parseInt(req.query.limit) || 50;

    const messageList = await messages
      .find({ roomId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    const publicMessages = messageList.reverse().map(toPublicMessage);
    res.status(200).json(publicMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/send', async (req, res) => {
  const user = authenticateRequest(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { text, roomId = 'general' } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ message: 'Message text is required' });
  }

  if (text.length > 1000) {
    return res.status(400).json({ message: 'Message too long' });
  }

  try {
    const messages = await getMessagesCollection();

    const message = {
      text: text.trim(),
      username: user.username,
      userId: new ObjectId(user.userId),
      timestamp: new Date(),
      roomId,
      edited: false,
    };

    const result = await messages.insertOne(message);
    const savedMessage = await messages.findOne({ _id: result.insertedId });

    if (savedMessage) {
      await sendNotificationToAll(`${user.username}: ${text}`, user.userId);

      res.status(201).json(toPublicMessage(savedMessage));
    } else {
      res.status(500).json({ message: 'Failed to save message' });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
