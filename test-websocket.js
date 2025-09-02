// Simple test file to verify WebSocket integration
// Run this with: node test-websocket.js

const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';
const WIDGET_KEY = '1252ffdae8fa53f80cb8a2458d9c5b79eac3195d6027380ca1c93ed9077dfa26';
const CHATBOT_ID = '68b57bb9fe84a4241ee9a6f5';

console.log('🚀 Testing WebSocket connection to your backend...');
console.log(`📡 Server URL: ${SERVER_URL}`);
console.log(`🔑 Widget Key: ${WIDGET_KEY}`);
console.log(`🤖 Chatbot ID: ${CHATBOT_ID}`);

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  timeout: 10000,
  auth: {
    widgetKey: WIDGET_KEY,
    chatbotId: CHATBOT_ID
  }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to backend:', socket.id);
  
  // Test the flow
  setTimeout(() => {
    console.log('📞 Joining conversation...');
    socket.emit('join-conversation', { sessionId: `ui-test-${Date.now()}` });
  }, 1000);
});

socket.on('connected', (data) => {
  console.log('🎉 Backend confirmed connection:', data);
});

socket.on('conversation-started', (data) => {
  console.log('🗣️  Conversation started:', data);
  
  // Send a test message
  setTimeout(() => {
    console.log('💬 Sending test message...');
    socket.emit('send-message', { content: 'Hello from the new UI integration! 👋' });
  }, 1000);
});

socket.on('message', (data) => {
  console.log('📨 Received message:', data);
});

socket.on('typing', (data) => {
  console.log('⌨️  Typing indicator:', data);
});

socket.on('agent-joined', (data) => {
  console.log('👤 Agent joined:', data);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🚨 Connection error:', error.message);
});

// Cleanup after 30 seconds
setTimeout(() => {
  console.log('🏁 Test completed, closing connection...');
  socket.close();
  process.exit(0);
}, 30000);
