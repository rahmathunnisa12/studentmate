//app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session setup
app.use(session({
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Flash messages middleware
const flash = require('connect-flash');
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Import models before routes that use them
const Task = require('./models/task');
const Note = require('./models/note');
const User = require('./models/User');

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const noteRoutes = require('./routes/noteRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');

// Route middlewares
app.use('/', authRoutes);
app.use('/task', taskRoutes);
app.use('/note', noteRoutes);
app.use('/flashcards', flashcardRoutes);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/login');
});


// 404 handler
app.use((req, res, next) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Global error handler - MUST BE LAST
app.use((err, req, res, next) => {
  console.error("❌ Global error caught:", err.stack);
  res.status(500).render('error', {
    title: 'Internal Server Error',
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});