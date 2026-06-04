const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'LIKE', 'COMMENT', 'FOLLOW'
  fromUser: { type: String, required: true },
  postId: { type: String },
  text: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  text: { type: String },
  media: { type: String }, // Base64
  createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  withUser: { type: String, required: true },
  blocked: { type: Boolean, default: false },
  messages: [messageSchema]
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  followers: [{ type: String }],
  following: [{ type: String }],
  notifications: [notificationSchema],
  conversations: [conversationSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
