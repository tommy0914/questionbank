require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../backend-bank/models/user');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/question-bank';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const user = await User.findOne({ username: ADMIN_USERNAME }).lean();
    if (!user) {
      console.log(`No user found with username=${ADMIN_USERNAME}`);
      process.exit(0);
    }
    // Print safe info about the user
    console.log({ id: user._id.toString(), username: user.username, role: user.role, createdAt: user.createdAt });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
