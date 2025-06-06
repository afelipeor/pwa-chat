const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateRequest } = require('../lib/auth');
const { connectToDatabase } = require('../lib/mongodb');

const router = express.Router();

// Get all conversations for the current user
router.get('/', async (req, res) => {
  const user = authenticateRequest(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { db } = await connectToDatabase();

    // Find conversations where user is a participant
    const conversations = await db
      .collection('conversations')
      .aggregate([
        {
          $match: {
            participants: new ObjectId(user.userId),
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'participants',
            foreignField: '_id',
            as: 'participantDetails',
          },
        },
        {
          $lookup: {
            from: 'messages',
            let: { conversationId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$conversationId', '$$conversationId'],
                  },
                },
              },
              {
                $sort: { timestamp: -1 },
              },
              {
                $limit: 1,
              },
            ],
            as: 'lastMessage',
          },
        },
        {
          $addFields: {
            lastMessage: { $arrayElemAt: ['$lastMessage', 0] },
            unreadCount: 0, // We'll implement this later
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ])
      .toArray();

    // Format conversations for frontend
    const formattedConversations = conversations.map((conv) => ({
      id: conv._id.toString(),
      participants: conv.participantDetails.map((p) => ({
        id: p._id.toString(),
        username: p.username,
        email: p.email,
        isOnline: p.isOnline || false,
        lastSeen: p.lastSeen?.toISOString() || new Date().toISOString(),
      })),
      lastMessage: conv.lastMessage
        ? {
            text: conv.lastMessage.text,
            timestamp: conv.lastMessage.timestamp.toISOString(),
            username: conv.lastMessage.username,
          }
        : null,
      unreadCount: conv.unreadCount || 0,
      updatedAt: conv.updatedAt.toISOString(),
    }));

    res.json(formattedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new conversation
router.post('/', async (req, res) => {
  const user = authenticateRequest(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { participantId } = req.body;

  if (!participantId) {
    return res.status(400).json({ message: 'Participant ID is required' });
  }

  try {
    const { db } = await connectToDatabase();

    // Check if conversation already exists
    const existingConversation = await db.collection('conversations').findOne({
      participants: {
        $all: [new ObjectId(user.userId), new ObjectId(participantId)],
        $size: 2,
      },
    });

    if (existingConversation) {
      return res.json({
        id: existingConversation._id.toString(),
        message: 'Conversation already exists',
      });
    }

    // Verify participant exists
    const participant = await db.collection('users').findOne({
      _id: new ObjectId(participantId),
    });

    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new conversation
    const conversation = {
      participants: [new ObjectId(user.userId), new ObjectId(participantId)],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('conversations').insertOne(conversation);

    res.status(201).json({
      id: result.insertedId.toString(),
      message: 'Conversation created',
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific conversation
router.get('/:id', async (req, res) => {
  const user = authenticateRequest(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    const { db } = await connectToDatabase();

    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(id),
      participants: new ObjectId(user.userId),
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Get participant details
    const participants = await db
      .collection('users')
      .find(
        {
          _id: { $in: conversation.participants },
        },
        {
          projection: { password: 0, pushSubscription: 0 },
        }
      )
      .toArray();

    const formattedConversation = {
      id: conversation._id.toString(),
      participants: participants.map((p) => ({
        id: p._id.toString(),
        username: p.username,
        email: p.email,
        isOnline: p.isOnline || false,
        lastSeen: p.lastSeen?.toISOString() || new Date().toISOString(),
      })),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };

    res.json(formattedConversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
