const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  author: { type: String, required: true }, // username of the creator
  text: { type: String },
  image: { type: String }, // Legacy compatibility
  images: [{ type: String }], // Array of Base64 image strings
  likes: [{ type: String }], // Array of usernames who liked
  comments: [commentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
