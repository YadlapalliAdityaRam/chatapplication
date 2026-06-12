const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }],
  blockedBy: [{ type: String }],
}, { timestamps: true });

// Create compound index for fast queries when searching for conversation by participants
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
