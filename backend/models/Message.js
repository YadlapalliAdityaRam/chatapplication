const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: String, required: true },
  text: { type: String },
  media: { type: String }, // Base64
  createdAt: { type: Date, default: Date.now }
});

// Create index on conversationId and createdAt for pagination and quick retrieval
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
