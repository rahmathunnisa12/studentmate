// routes/noteRoutes.js
const express = require('express');
const router = express.Router();
const Note = require('../models/note');
const ensureAuthenticated = require('../middleware/authMiddleware');

// Add Note Page
router.get('/add-note', ensureAuthenticated, (req, res) => {
  res.render('add-note');
});

// Save New Note
router.post('/add-note', ensureAuthenticated, async (req, res) => {
  const { title, subject, content } = req.body;
  try {
     console.log("Current session user:", req.session.user);
    await Note.create({
      userId: req.session.user._id,
      title,
      subject,
      content
    });
    req.flash('success_msg', 'Note saved successfully');
    res.redirect('/note/notes');
  } catch (err) {
    console.error("Error adding note:", err);
    res.status(500).send("Error saving note");
  }
});

// View Notes
router.get('/notes', ensureAuthenticated, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.session.user._id });
    res.render('notes', { notes });
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).send("Server error");
  }
});

// Edit Note Page
router.get('/edit-note/:id', ensureAuthenticated, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.session.user._id });
    if (!note) return res.status(404).send("Note not found");
    res.render('edit-note', { note });
  } catch (err) {
    console.error("Error fetching note:", err);
    res.status(500).send("Server error");
  }
});

// Update Note
router.post('/update-note/:id', ensureAuthenticated, async (req, res) => {
  const { title, subject, content } = req.body;
  try {
    await Note.findByIdAndUpdate(req.params.id, { title, subject, content });
     req.flash('success', 'Note updated successfully');
    res.redirect('/note/notes');
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).send("Server error");
  }
});

// Delete Note
// Delete Note
/*router.post('/delete-note/:id', ensureAuthenticated, async (req, res) => {
  try {
    const result = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id
    });

    if (!result) {
      return res.status(404).send("Note not found or already deleted");
    }

    req.flash('success_msg', 'Note deleted successfully');
    res.redirect('/note/notes');
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).send("Server error");
  }
});*/
router.post('/delete-note/:id', ensureAuthenticated, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, userId: req.session.user._id });
    req.flash('success_msg', 'Note deleted successfully');
    res.redirect('/note/notes');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Something went wrong');
    res.redirect('/note/notes');
  }
});

module.exports = router;