const express = require('express');
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('../lib/mongodb');
const { generateToken } = require('../lib/auth');
const { toPublicUser } = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const { db } = await connectToDatabase();

    const existingUser = await db.collection('users').findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? 'Email already exists'
            : 'Username already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.collection('users').insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isOnline: true,
      lastSeen: new Date(),
    });

    const user = {
      _id: result.insertedId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      isOnline: true,
      lastSeen: new Date(),
    };

    const token = generateToken({
      userId: result.insertedId.toString(),
      username,
      email,
    });

    res.status(201).json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await db
      .collection('users')
      .updateOne(
        { _id: user._id },
        { $set: { isOnline: true, lastSeen: new Date() } }
      );

    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    const updatedUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      isOnline: true,
      lastSeen: new Date(),
      pushSubscription: user.pushSubscription,
    };

    res.status(200).json({
      token,
      user: toPublicUser(updatedUser),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
