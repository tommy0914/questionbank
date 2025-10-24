require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../backend-bank/models/user');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/question-bank';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const username = 'admin';
    const password = 'admin123';
    const user = await User.findOne({ username });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.error('Password mismatch');
      process.exit(1);
    }
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login OK. Token:');
    console.log(token);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
