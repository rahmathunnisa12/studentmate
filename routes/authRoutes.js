const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/task');
const Note = require('../models/note'); // Import Note model
const ensureAuthenticated = require('../middleware/authMiddleware');

// GET /login
router.get('/login', (req, res) => {
  res.render('login', { message: req.flash('error') });
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Please enter all fields');
    return res.redirect('/login');
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    req.session.user = user;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Server error');
    res.redirect('/login');
  }
});

// GET /signup
router.get('/signup', (req, res) => {
  res.render('signup', { message: req.flash('error') });
});

// POST /signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    req.flash('error', 'All fields are required');
    return res.redirect('/signup');
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/signup');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    req.flash('success', 'Signup successful. Please log in.');
    res.redirect('/login');
  } catch (err) {
    console.error("Signup error details:", err);
    req.flash('error', 'Server error');
    res.redirect('/signup');
  }
});

// GET /dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    const tasks = await Task.find({ userId: user._id });

    res.render('dashboard', { user, tasks });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send('Server error');
  }
});

// POST /task
router.post('/task', ensureAuthenticated, async (req, res) => {
  const { title, dueDate } = req.body;
  const user = req.session.user;

  try {
    const newTask = new Task({
      userId: user._id,
      title,
      dueDate
    });

    await newTask.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error("Error adding task:", err);
    res.status(500).send('Server error');
  }
});

// GET /notes - View all study notes
router.get('/notes', ensureAuthenticated, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.session.user._id }).sort({ createdAt: -1 });
    res.render('notes', { notes });
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).send('Server error');
  }
});

// GET /add-note - Show form to add note
router.get('/add-note', ensureAuthenticated, (req, res) => {
  res.render('add-note');
});

// POST /add-note - Save new note
router.post('/add-note', ensureAuthenticated, async (req, res) => {
  const { title, subject, content } = req.body;
  const newNote = new Note({
    userId: req.session.user._id,
    title,
    subject,
    content
  });

  try {
    await newNote.save();
    res.redirect('/notes');
  } catch (err) {
    console.error("Error saving note:", err);
    res.status(500).send('Server error');
  }
});

// GET /edit-task/:id
router.get('/edit-task/:id', ensureAuthenticated, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.userId.toString() !== req.session.user._id.toString()) {
      return res.status(404).send('Task not found');
    }
    res.render('edit-task', { task });
  } catch (err) {
    console.error("Edit task error:", err);
    res.status(500).send('Server error');
  }
});

// POST /update-task/:id
router.post('/update-task/:id', ensureAuthenticated, async (req, res) => {
  const { title, dueDate } = req.body;

  try {
    await Task.findByIdAndUpdate(req.params.id, { title, dueDate });
    res.redirect('/dashboard');
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).send('Server error');
  }
});

// GET /delete-task/:id
router.get('/delete-task/:id', ensureAuthenticated, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).send('Server error');
  }
});
// GET /flashcards
router.get('/flashcards', ensureAuthenticated, async (req, res) => {
  try {
    const flashcards = await Note.find({ userId: req.session.user._id }).select('title content');
    res.render('flashcards', { flashcards });
  } catch (err) {
    console.error("Error fetching flashcards:", err);
    res.status(500).send('Server error');
  }
});
// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error("Logout error:", err);
    res.redirect('/login');
  });
});

// GET /
router.get('/', (req, res) => {
  res.redirect('/login');
});

module.exports = router;