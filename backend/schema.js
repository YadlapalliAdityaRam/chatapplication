const { gql } = require('apollo-server-express');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const typeDefs = gql`
  type Comment {
    id: ID
    username: String
    userDetails: User
    text: String
    createdAt: String
  }

  type Post {
    id: ID!
    author: String!
    authorDetails: User
    text: String
    image: String
    images: [String]
    likes: [String]
    comments: [Comment]
    createdAt: String
  }

  type Message {
    id: ID
    sender: String
    text: String
    media: String
    createdAt: String
  }

  type Conversation {
    id: ID
    withUser: String
    blocked: Boolean
    messages: [Message]
  }

  type Notification {
    id: ID
    type: String
    fromUser: String
    postId: String
    text: String
    read: Boolean
    createdAt: String
  }

  type User {
    id: ID
    username: String!
    name: String
    bio: String
    avatar: String
    followers: [String]
    following: [String]
    notifications: [Notification]
    token: String
  }

  type UserProfile {
    user: User
    posts: [Post]
  }

  type AuthPayload {
    token: String!
    username: String!
  }

  type Query {
    getPosts: [Post]
    getMe: User
    getUserProfile(username: String!): UserProfile
    getConversation(withUser: String!): Conversation
    getAllUsers: [User]
  }

  type Mutation {
    register(username: String!, name: String!, email: String!, password: String!): AuthPayload
    login(identifier: String!, password: String!): AuthPayload
    createPost(text: String, image: String, images: [String]): Post
    toggleLike(postId: ID!): Post
    addComment(postId: ID!, text: String!): Post
    toggleFollow(username: String!): UserProfile
    updateProfile(username: String, name: String, bio: String, avatar: String): User
    markNotificationsRead: Boolean
    sendMessage(toUsername: String!, text: String, media: String): Conversation
    blockUser(username: String!, block: Boolean!): Conversation
    deletePost(postId: ID!): Boolean
    deleteComment(postId: ID!, commentId: ID!): Post
  }
`;

const resolvers = {
  Query: {
    getPosts: async () => {
      return await Post.find().sort({ createdAt: -1 });
    },
    getMe: async (_, __, context) => {
      if (!context.user) throw new Error('Authentication required');
      return await User.findOne({ username: context.user.username });
    },
    getUserProfile: async (_, { username }) => {
      const user = await User.findOne({ username });
      if (!user) throw new Error('User not found');
      const posts = await Post.find({ author: username }).sort({ createdAt: -1 });
      return { user, posts };
    },
    getConversation: async (_, { withUser }, context) => {
      if (!context.user) throw new Error('Authentication required');
      const currentUser = await User.findOne({ username: context.user.username });
      const conversation = currentUser.conversations.find(c => c.withUser === withUser);
      if (!conversation) {
        return { withUser, blocked: false, messages: [] };
      }
      return conversation;
    },
    getAllUsers: async () => {
      return await User.find({}, 'id username name avatar');
    }
  },
  Post: {
    authorDetails: async (post) => {
      return await User.findOne({ username: post.author });
    }
  },
  Comment: {
    userDetails: async (comment) => {
      return await User.findOne({ username: comment.username });
    }
  },
  Mutation: {
    register: async (_, { username, name, email, password }) => {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const lowerUsername = username.toLowerCase();
      const existingUser = await User.findOne({ $or: [{ email }, { username: lowerUsername }] });
      if (existingUser) throw new Error('User with that email or username already exists');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ username: lowerUsername, name, email, password: hashedPassword });
      await user.save();

      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return { token, username: user.username };
    },
    
    login: async (_, { identifier, password }) => {
      const lowerIdentifier = identifier.toLowerCase();
      const user = await User.findOne({
        $or: [
          { email: lowerIdentifier },
          { username: lowerIdentifier }
        ]
      });
      if (!user) throw new Error('User not found');
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error('Invalid credentials');
      
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return { token, username: user.username };
    },

    createPost: async (_, { text, image, images }, context) => {
      if (!context.user) throw new Error('Authentication required');
      if (!text && !image && (!images || images.length === 0)) throw new Error('Post must have text or image');

      const authorName = context.user.username;
      const post = new Post({ author: authorName, text, image, images });
      await post.save();

      // Notify followers
      const currentUser = await User.findOne({ username: authorName });
      if (currentUser && currentUser.followers && currentUser.followers.length > 0) {
        await User.updateMany(
          { username: { $in: currentUser.followers } },
          { $push: { notifications: { type: 'NEW_POST', fromUser: authorName, postId: post.id, text: 'created a new post' } } }
        );
      }

      return post;
    },

    toggleLike: async (_, { postId }, context) => {
      if (!context.user) throw new Error('Authentication required');
      const post = await Post.findById(postId);
      if (!post) throw new Error('Post not found');

      const username = context.user.username;
      const index = post.likes.indexOf(username);
      
      if (index === -1) {
        post.likes.push(username);
        // Create notification
        if (post.author !== username) {
          await User.findOneAndUpdate(
            { username: post.author },
            { $push: { notifications: { type: 'LIKE', fromUser: username, postId: post.id, text: 'liked your post' } } }
          );
        }
      } else {
        post.likes.splice(index, 1);
      }

      await post.save();
      return post;
    },

    addComment: async (_, { postId, text }, context) => {
      if (!context.user) throw new Error('Authentication required');
      const post = await Post.findById(postId);
      if (!post) throw new Error('Post not found');

      const username = context.user.username;
      post.comments.unshift({ username, text });
      await post.save();

      if (post.author !== username) {
        await User.findOneAndUpdate(
          { username: post.author },
          { $push: { notifications: { type: 'COMMENT', fromUser: username, postId: post.id, text: 'commented on your post' } } }
        );
      }

      return post;
    },

    deleteComment: async (_, { postId, commentId }, context) => {
      if (!context.user) throw new Error('Authentication required');
      const post = await Post.findById(postId);
      if (!post) throw new Error('Post not found');

      const comment = post.comments.id(commentId);
      if (!comment) throw new Error('Comment not found');

      if (comment.username !== context.user.username) {
        throw new Error('Not authorized to delete this comment');
      }

      post.comments.pull(commentId);
      await post.save();
      return post;
    },

    deletePost: async (_, { postId }, context) => {
      if (!context.user) throw new Error('Authentication required');
      const post = await Post.findById(postId);
      if (!post) throw new Error('Post not found');

      if (post.author !== context.user.username) {
        throw new Error('Not authorized to delete this post');
      }

      await Post.deleteOne({ _id: postId });
      return true;
    },

    toggleFollow: async (_, { username }, context) => {
      if (!context.user) throw new Error('Authentication required');
      const currentUserUsername = context.user.username;
      if (currentUserUsername === username) throw new Error('Cannot follow yourself');

      const currentUser = await User.findOne({ username: currentUserUsername });
      const targetUser = await User.findOne({ username });
      if (!targetUser) throw new Error('User not found');

      const isFollowing = currentUser.following.includes(username);

      if (isFollowing) {
        currentUser.following = currentUser.following.filter(u => u !== username);
        targetUser.followers = targetUser.followers.filter(u => u !== currentUserUsername);
      } else {
        currentUser.following.push(username);
        targetUser.followers.push(currentUserUsername);
        targetUser.notifications.push({
          type: 'FOLLOW',
          fromUser: currentUserUsername,
          text: 'started following you'
        });
      }

      await currentUser.save();
      await targetUser.save();

      const posts = await Post.find({ author: username }).sort({ createdAt: -1 });
      return { user: targetUser, posts };
    },

    updateProfile: async (_, { username, name, bio, avatar }, context) => {
      if (!context.user) throw new Error('Authentication required');
      const oldUsername = context.user.username;
      const user = await User.findOne({ username: oldUsername });
      
      if (name !== undefined) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;
      
      let newToken = null;
      if (username !== undefined && username.toLowerCase() !== oldUsername) {
        const lowerUsername = username.toLowerCase();
        // Check if taken
        const existing = await User.findOne({ username: lowerUsername });
        if (existing) throw new Error('Username already taken');

        user.username = lowerUsername;

        // Cascade updates
        await Post.updateMany({ author: oldUsername }, { $set: { author: lowerUsername } });
        await Post.updateMany({ likes: oldUsername }, { $set: { 'likes.$': lowerUsername } });
        await Post.updateMany(
          { 'comments.username': oldUsername },
          { $set: { 'comments.$[elem].username': lowerUsername } },
          { arrayFilters: [{ 'elem.username': oldUsername }] }
        );
        await User.updateMany({ followers: oldUsername }, { $set: { 'followers.$': lowerUsername } });
        await User.updateMany({ following: oldUsername }, { $set: { 'following.$': lowerUsername } });
        await User.updateMany(
          { 'notifications.fromUser': oldUsername },
          { $set: { 'notifications.$[elem].fromUser': lowerUsername } },
          { arrayFilters: [{ 'elem.fromUser': oldUsername }] }
        );
        await User.updateMany(
          { 'conversations.withUser': oldUsername },
          { $set: { 'conversations.$[elem].withUser': lowerUsername } },
          { arrayFilters: [{ 'elem.withUser': oldUsername }] }
        );
        
        const usersWithConvos = await User.find({ 'conversations.withUser': lowerUsername });
        for (let u of usersWithConvos) {
           for (let c of u.conversations) {
              if (c.withUser === lowerUsername) {
                 for (let m of c.messages) {
                    if (m.sender === oldUsername) m.sender = lowerUsername;
                 }
              }
           }
           await u.save();
        }

        newToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
      }

      await user.save();
      const updatedUser = user.toObject();
      if (newToken) updatedUser.token = newToken;
      
      return updatedUser;
    },

    markNotificationsRead: async (_, __, context) => {
      if (!context.user) throw new Error('Authentication required');
      const user = await User.findOne({ username: context.user.username });
      user.notifications.forEach(n => n.read = true);
      await user.save();
      return true;
    },

    sendMessage: async (_, { toUsername, text, media }, context) => {
      if (!context.user) throw new Error('Authentication required');
      const senderName = context.user.username;
      
      const sender = await User.findOne({ username: senderName });
      const receiver = await User.findOne({ username: toUsername });
      if (!receiver) throw new Error('User not found');

      let senderConv = sender.conversations.find(c => c.withUser === toUsername);
      if (!senderConv) {
        sender.conversations.push({ withUser: toUsername, messages: [] });
        senderConv = sender.conversations[sender.conversations.length - 1];
      }

      let receiverConv = receiver.conversations.find(c => c.withUser === senderName);
      if (!receiverConv) {
        receiver.conversations.push({ withUser: senderName, messages: [] });
        receiverConv = receiver.conversations[receiver.conversations.length - 1];
      }

      if (senderConv.blocked || receiverConv.blocked) {
        throw new Error('Cannot send message, user is blocked');
      }

      const message = { sender: senderName, text, media, createdAt: new Date() };
      senderConv.messages.push(message);
      receiverConv.messages.push(message);

      // Add chat notification to receiver
      const existingNotif = receiver.notifications.find(n => n.type === 'CHAT' && n.fromUser === senderName && !n.read);
      if (!existingNotif) {
        receiver.notifications.push({
          type: 'CHAT',
          fromUser: senderName,
          text: 'sent you a message'
        });
      }

      await sender.save();
      await receiver.save();
      return senderConv;
    },

    blockUser: async (_, { username, block }, context) => {
      if (!context.user) throw new Error('Authentication required');
      const currentUser = await User.findOne({ username: context.user.username });
      
      let conv = currentUser.conversations.find(c => c.withUser === username);
      if (!conv) {
        currentUser.conversations.push({ withUser: username, blocked: block, messages: [] });
        conv = currentUser.conversations[currentUser.conversations.length - 1];
      } else {
        conv.blocked = block;
      }
      
      await currentUser.save();
      return conv;
    }
  }
};

module.exports = { typeDefs, resolvers };
