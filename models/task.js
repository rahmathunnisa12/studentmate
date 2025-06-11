//models/task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  completed: { // 👈 New field
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Task', taskSchema);