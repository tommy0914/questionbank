// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'admin' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: function() { return this.role === 'user'; } }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
