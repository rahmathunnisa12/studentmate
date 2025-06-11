require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: true
}));

// Flash messages
app.use(flash());

// Logging session user
app.use((req, res, next) => {
  console.log("Session user:", req.session.user);
  next();
});

// Routes
app.use('/', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});