const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active rooms and their participants
const rooms = new Map();

// Get room participants
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  
  if (rooms.has(roomId)) {
    const participants = Array.from(rooms.get(roomId).keys());
    res.json({ roomId, participants, count: participants.length });
  } else {
    res.json({ roomId, participants: [], count: 0 });
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  let userId = null;
  let roomId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join':
          // User wants to join a room
          handleJoin(ws, data);
          userId = data.userId;
          roomId = data.roomId;
          break;
        
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Forward signaling messages to the specified peer
          if (data.to && roomId) {
            forwardMessage(roomId, data.to, { 
              type: data.type, 
              from: userId, 
              data: data.data 
            });
          }
          break;
          
        case 'leave':
          // User wants to leave the room
          if (roomId && userId) {
            handleLeave(roomId, userId);
          }
          break;
          
        case 'chat':
          // User sends a chat message
          if (roomId && userId) {
            broadcastToRoom(roomId, {
              type: 'chat',
              from: userId,
              data: data.data,
              time: new Date().toISOString()
            }, userId);
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    
    // Remove the user from the room when they disconnect
    if (roomId && userId) {
      handleLeave(roomId, userId);
    }
  });
  
  // Handle a user joining a room
  function handleJoin(ws, data) {
    const { roomId, userId } = data;
    
    if (!roomId || !userId) return;
    
    // Create the room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    // Add the user to the room
    rooms.get(roomId).set(userId, ws);
    
    console.log(`User ${userId} joined room ${roomId}`);
    
    // Notify existing participants about the new user
    broadcastToRoom(roomId, {
      type: 'user-joined',
      from: userId
    }, userId);
    
    // Send the new user information about existing participants
    const participants = Array.from(rooms.get(roomId).keys()).filter(id => id !== userId);
    
    participants.forEach(participantId => {
      ws.send(JSON.stringify({
        type: 'user-joined',
        from: participantId
      }));
    });
  }
  
  // Handle a user leaving a room
  function handleLeave(roomId, userId) {
    if (!rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    
    // Remove the user from the room
    room.delete(userId);
    
    console.log(`User ${userId} left room ${roomId}`);
    
    // Notify other participants that the user has left
    broadcastToRoom(roomId, {
      type: 'user-left',
      from: userId
    });
    
    // Delete the room if it's empty
    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }
  }
  
  // Forward a message to a specific user in a room
  function forwardMessage(roomId, to, message) {
    if (!rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    const recipient = room.get(to);
    
    if (recipient) {
      recipient.send(JSON.stringify(message));
    }
  }
  
  // Broadcast a message to all users in a room except the sender
  function broadcastToRoom(roomId, message, except = null) {
    if (!rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    
    room.forEach((ws, id) => {
      if (id !== except) {
        ws.send(JSON.stringify(message));
      }
    });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server is running on port ${PORT}`);
}); 