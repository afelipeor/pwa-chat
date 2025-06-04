const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateRequest } = require('../lib/auth');
const { getUsersCollection } = require('../lib/mongodb');

const router = express.Router();

// Subscribe to notifications
router.post('/subscribe', async (req, res) => {
  const user = authenticateRequest(req);

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { subscription } = req.body;

  if (!subscription) {
    return res.status(400).json({ message: 'Subscription data is required' });
  }

  try {
    const users = await getUsersCollection();

    await users.updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: { pushSubscription: subscription } }
    );

    res.status(200).json({ message: 'Subscription saved' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
