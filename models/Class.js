const mongoose = require("mongoose");

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  timeLimit: { type: Number, default: 0 }, // in minutes
});

module.exports = mongoose.models.Class || mongoose.model("Class", ClassSchema);