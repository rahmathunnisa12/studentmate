// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/task');
const Note = require('../models/note');
const ensureAuthenticated = require('../middleware/authMiddleware');

// GET /login
router.get('/login', (req, res) => {
  res.render('login', { message: req.flash('error') });
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    req.flash('error', 'All fields are required');
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

    // ✅ Save user in session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email
    };

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
    console.error("Signup error:", err);
    req.flash('error', 'Server error');
    res.redirect('/signup');
  }
});

// GET /dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    const categoryFilter = req.query.category;

    let tasks = await Task.find({ userId: user._id }); // ✅ Use correct field

    if (categoryFilter && categoryFilter !== 'all') {
      const normalizedFilter = categoryFilter.toLowerCase();
      tasks = tasks.filter(task => task.category.toLowerCase() === normalizedFilter);
    }

    res.render('dashboard', {
      user,
      tasks,
      activeCategory: categoryFilter || 'all'
    });
  } catch (err) {
    console.error('❌ Dashboard error:', err);
    next(err); // Pass to global error handler
  }
});
// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect('/dashboard');
    }
    res.redirect('/login');
  });
});

module.exports = router;