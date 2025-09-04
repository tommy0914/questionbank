const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Create a new subject for a class
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { name, classId } = req.body;
  if (!name || !classId) {
    return res.status(400).json({ error: 'Name and classId are required' });
  }
  try {
    const subject = new Subject({ name, classId });
    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Get all subjects for a class
router.get('/class/:classId', verifyToken, async (req, res) => {
  try {
    const subjects = await Subject.find({ classId: req.params.classId });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get all subjects
router.get('/', verifyToken, async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Update a subject
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { name, classId } = req.body;
  try {
    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, classId },
      { new: true }
    );
    if (!updatedSubject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ message: 'Subject updated successfully', subject: updatedSubject });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Get a single subject by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('classId', 'name');
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// Delete a subject (cascade delete questions)
const Question = require('../models/Question');
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const subjectId = req.params.id;
    await Subject.findByIdAndDelete(subjectId);
    await Question.deleteMany({ subjectId });
    res.json({ message: 'Subject and its questions deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subject and related questions' });
  }
});

module.exports = router;
