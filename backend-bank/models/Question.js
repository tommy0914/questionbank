// filepath: /c:/Users/ADMIN/Desktop/question bank/backend-bank/models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String],
});

module.exports = mongoose.model('Question', questionSchema);