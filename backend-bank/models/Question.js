const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: String, required: true },
  topic: { type: String, required: true },
});

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;