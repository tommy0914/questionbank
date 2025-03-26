// bankServer.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import Mongoose models.
const Question = require('./models/question');
const User = require('./models/User');

const app = express();
const PORT = 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/questionBankDB';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware to parse JSON and enable CORS.
app.use(express.json());
app.use(cors());

// Connect to MongoDB.
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* ================================
   Authentication Middlewares
================================ */

// Verify that the request includes a valid JWT token.
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Failed to authenticate token' });
    req.user = decoded;
    next();
  });
}

// Require that the authenticated user has an 'admin' role.
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin role required' });
  }
}

/* ================================
   Authentication Routes
================================ */

// Optional: Registration endpoint to create new admin users.
app.post('/api/bank/auth/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!(username && password)) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    // Check if the user already exists.
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, role: role || 'admin' });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint. Returns a JWT token if credentials are valid.
app.post('/api/bank/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!(username && password)) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/* ================================
   Question Bank Endpoints
================================ */

// GET /api/bank/questions
// Returns all questions in the bank.
app.get('/api/bank/questions', async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching questions' });
  }
});

// POST /api/bank/questions
// Create a new question. Admin only.
app.post('/api/bank/questions', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { text, options, answer, topic, linkedQuestionIds } = req.body;
    if (!text || !options || !answer) {
      return res.status(400).json({ error: "Missing required fields: text, options, or answer" });
    }
    const newQuestion = new Question({
      text,
      options,
      answer,
      topic: topic || "General",
      linkedQuestionIds: linkedQuestionIds || []
    });
    
    await newQuestion.save();

    // Advanced Linking:
    // Automatically set linkedQuestionIds based on the topic if none provided.
    if (topic && (!linkedQuestionIds || linkedQuestionIds.length === 0)) {
      const relatedQuestions = await Question.find({ 
        topic,
        _id: { $ne: newQuestion._id }
      });
      if (relatedQuestions.length > 0) {
        newQuestion.linkedQuestionIds = relatedQuestions.map(q => q._id);
        await newQuestion.save();
      }
    }
    res.status(201).json(newQuestion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding question' });
  }
});

// PUT /api/bank/questions/:id
// Update an existing question. Admin only.
app.put('/api/bank/questions/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const questionId = req.params.id;
    const updateData = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Merge existing question data with the update.
    Object.assign(question, updateData);
    
    // Advanced Linking:
    // If topic is updated and no linkedQuestionIds is provided, update automatically.
    if (updateData.topic && !updateData.linkedQuestionIds) {
      const relatedQuestions = await Question.find({ 
        topic: updateData.topic,
        _id: { $ne: questionId }
      });
      question.linkedQuestionIds = relatedQuestions.map(q => q._id);
    }
    await question.save();
    res.json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating question' });
  }
});

// DELETE /api/bank/questions/:id
// Delete a question. Admin only.
app.delete('/api/bank/questions/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const questionId = req.params.id;
    const deletedQuestion = await Question.findByIdAndDelete(questionId);
    if (!deletedQuestion) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted successfully', question: deletedQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting question' });
  }
});

// GET /api/bank/questions/:id/linked
// Returns a question along with its linked questions.
app.get('/api/bank/questions/:id/linked', async (req, res) => {
  try {
    const questionId = req.params.id;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    // Retrieve the linked questions using the stored IDs.
    const linkedQuestions = await Question.find({
      _id: { $in: question.linkedQuestionIds }
    });
    res.json({ question, linkedQuestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching linked questions' });
  }
});

// GET /api/bank/questions/:id/suggested
// Returns suggested related questions based on the question's topic and not already linked.
app.get('/api/bank/questions/:id/suggested', async (req, res) => {
  try {
    const questionId = req.params.id;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    // Find suggestions by matching topic and excluding already linked and the question itself.
    const suggested = await Question.find({ 
      topic: question.topic,
      _id: { $ne: questionId, $nin: question.linkedQuestionIds }
    });
    res.json({ question, suggested });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching suggested related questions' });
  }
});

// Batch Import:
// POST /api/bank/questions/import
// Bulk import an array of question objects. Admin only.
app.post('/api/bank/questions/import', verifyToken, requireAdmin, async (req, res) => {
  try {
    const questionsArray = req.body; // Expecting an array of question objects.
    if (!Array.isArray(questionsArray)) {
      return res.status(400).json({ error: 'Data must be an array of questions' });
    }
    const importedQuestions = await Question.insertMany(questionsArray);
    res.status(201).json({ message: 'Questions imported successfully', importedQuestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error importing questions' });
  }
});

// Batch Export:
// GET /api/bank/questions/export
// Export all questions as JSON. Admin only.
app.get('/api/bank/questions/export', verifyToken, requireAdmin, async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error exporting questions' });
  }
});

/* ================================
   Start the Server
================================ */
app.listen(PORT, () => {
  console.log(`Question Bank backend is running on http://localhost:${PORT}`);
});
console.log(__dirname);