// routes/flashcardRoutes.js
const express = require('express');
const router = express.Router();
const Note = require('../models/note');
const ensureAuthenticated = require('../middleware/authMiddleware');

// GET /flashcards - Show flashcards from user's notes
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.session.user._id });
    res.render('flashcards', { flashcards: notes });
  } catch (err) {
    console.error("Flashcards error:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;