require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/question-bank';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ username: ADMIN_USERNAME });
    if (existing) {
      console.log(`Admin user "${ADMIN_USERNAME}" already exists (id=${existing._id}). No action taken.`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const admin = new User({ username: ADMIN_USERNAME, password: hashed, role: 'admin' });
    await admin.save();
    console.log(`Admin user created: username=${ADMIN_USERNAME}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin user:', err);
    process.exit(1);
  }
}

run();
