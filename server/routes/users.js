const express = require('express');
const { authenticateRequest } = require('../lib/auth');
const { getUsersCollection } = require('../lib/mongodb');

const router = express.Router();

// Get all users (for creating conversations)
router.get('/', async (req, res) => {
  const user = authenticateRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const users = await getUsersCollection();
    const allUsers = await users.find({}, {
      projection: {
        password: 0, // Exclude password field
        pushSubscription: 0 // Exclude sensitive data
      }
    }).toArray();

    const formattedUsers = allUsers.map(u => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      isOnline: u.isOnline || false,
      lastSeen: u.lastSeen?.toISOString() || new Date().toISOString()
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user online status
router.put('/status', async (req, res) => {
  const user = authenticateRequest(req);
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { isOnline } = req.body;

  try {
    const users = await getUsersCollection();
    const { ObjectId } = require('mongodb');
    
    await users.updateOne(
      { _id: new ObjectId(user.userId) },
      { 
        $set: { 
          isOnline: isOnline,
          lastSeen: new Date()
        }
      }
    );

    res.json({ message: 'Status updated' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;