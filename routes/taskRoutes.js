// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const ensureAuthenticated = require('../middleware/authMiddleware');

console.log("✅ LOADED: taskRoutes.js");
// GET /task - Show tasks or redirect
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.session.user._id });
    res.render('dashboard', { tasks }); // make sure 'dashboard.ejs' is ready to receive 'tasks'
  } catch (err) {
    console.error("Fetch tasks error:", err);
    res.status(500).send("Error fetching tasks");
  }
});

// Add Task
router.post('/task', ensureAuthenticated, async (req, res) => {
  const { title, dueDate, category } = req.body;
  try {
    await Task.create({
      userId: req.session.user._id,
      title,
      dueDate,
      category: category || 'Other'
    });
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding task");
  }
});

// Toggle Task Completion
router.patch('/toggle-complete/:id', ensureAuthenticated, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.userId.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    task.completed = req.body.completed === true;
    await task.save();

    const allTasks = await Task.find({ userId: req.session.user._id });
    const totalTasks = allTasks.length;
    const completedCount = allTasks.filter(t => t.completed).length;
    const percentDone = totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0;

    res.json({ completedCount, totalTasks, percentDone });
  } catch (err) {
    console.error("Toggle task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Task
router.get('/delete-task/:id', ensureAuthenticated, async (req, res) => {
  try {
    await Task.deleteOne({ _id: req.params.id, userId: req.session.user._id });
    res.redirect('/dashboard');
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).send("Error deleting task");
  }
});
// GET /task/edit-task/:id
router.get('/edit-task/:id', ensureAuthenticated, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.session.user._id });
    if (!task) return res.status(404).send("Task not found");
    res.render('editTask', { task });
  } catch (err) {
    console.error("Edit task error:", err);
    res.status(500).send("Error fetching task");
  }
});

// POST /task/edit-task/:id
router.post('/edit-task/:id', ensureAuthenticated, async (req, res) => {
  const { title, dueDate } = req.body;
  try {
    await Task.findByIdAndUpdate(req.params.id, { title, dueDate });
    res.redirect('/dashboard');
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).send("Error updating task");
  }
});

module.exports = router;