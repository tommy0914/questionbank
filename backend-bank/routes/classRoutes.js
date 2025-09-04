
const express = require("express");
const router = express.Router();
const Class = require("../models/Class");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const Subject = require('../models/Subject');
const Question = require('../models/Question');

// Update a class by ID
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, timeLimit } = req.body;
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { name, timeLimit },
      { new: true }
    );
    if (!updatedClass) return res.status(404).json({ error: 'Class not found' });
    res.json({ message: 'Class updated', class: updatedClass });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Delete a class by ID (cascade delete subjects and questions)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const classId = req.params.id;
    const deletedClass = await Class.findByIdAndDelete(classId);
    if (!deletedClass) return res.status(404).json({ error: 'Class not found' });

    // Delete all subjects belonging to this class
    await Subject.deleteMany({ classId });
    // Delete all questions belonging to this class
    await Question.deleteMany({ classId });

    res.json({ message: 'Class, its subjects, and its questions deleted successfully', class: deletedClass });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete class and related data' });
  }
});

// Create a new class
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  const { name, timeLimit } = req.body;
  try {
    const newClass = new Class({ name, timeLimit });
    await newClass.save();
    res.status(201).json({ message: "Class created", class: newClass });
  } catch (err) {
    res.status(500).json({ error: "Failed to create class" });
  }
});

// Get all classes
router.get("/", async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// Get a single class by ID
router.get("/:id", async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) return res.status(404).json({ error: "Class not found" });
    res.json(classObj);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch class" });
  }
});

module.exports = router;