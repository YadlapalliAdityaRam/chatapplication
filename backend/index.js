require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createServer } = require('http');
const { Server } = require('socket.io');

const { typeDefs, resolvers } = require('./schema');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  
  socket.on('join', (username) => {
    socket.join(username);
    console.log(`User ${username} joined their socket room`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization || '';
      if (token) {
        try {
          const user = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
          return { user, io };
        } catch (err) {
          console.error('JWT verification error:', err.message);
        }
      }
      return { io };
    },
  });

  await server.start();
  server.applyMiddleware({ 
    app, 
    path: '/graphql',
    bodyParserConfig: false
  });

  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      const PORT = process.env.PORT || 5000;
      httpServer.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`);
      });
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
    });
};

startServer();
