const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';
const WIDGET_KEY = '1252ffdae8fa53f80cb8a2458d9c5b79eac3195d6027380ca1c93ed9077dfa26';
const CHATBOT_ID = '68b57bb9fe84a4241ee9a6f5';

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  timeout: 10000,
  auth: {
    widgetKey: WIDGET_KEY,
    chatbotId: CHATBOT_ID
  }
});

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

socket.on('connect', () => console.log('[connect]', socket.id));
socket.on('connected', (data) => console.log('[connected event]', data));
socket.on('conversation-started', (e) => {
  console.log('[conversation-started]', e);
  if (e?.conversationId) socket.conversationId = e.conversationId;
});
socket.on('message', (e) => console.log('[message]', e));
socket.on('typing', (e) => console.log('[typing]', e));
socket.on('status-change', (e) => console.log('[status-change]', e));
socket.on('queue-update', (e) => console.log('[queue-update]', e));
socket.on('agent-joined', (e) => console.log('[agent-joined]', e));
socket.on('conversation-ended', (e) => console.log('[conversation-ended]', e));
socket.on('ai-analysis-result', (e) => console.log('[ai-analysis-result]', e));
socket.on('conversation-summary', (e) => console.log('[conversation-summary]', e));
socket.on('conversation-metadata-updated', (e) => console.log('[conversation-metadata-updated]', e));
socket.on('agent-typing', (e) => console.log('[agent-typing]', e));
socket.on('conversation-transferred', (e) => console.log('[conversation-transferred]', e));
socket.on('pong', (e) => console.log('[pong]', e));
socket.on('error', (e) => console.warn('[socket error event]', e));
socket.on('disconnect', (reason) => console.log('[disconnect]', reason));

async function run() {
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('connect timeout')), 12000);
      socket.once('connect', () => { clearTimeout(t); resolve(); });
      socket.once('connect_error', (err) => { clearTimeout(t); reject(err); });
    });

    socket.emit('ping');

    console.log('[emit] join-conversation');
    socket.emit('join-conversation', { sessionId: 'test-session-' + Date.now() });
    await wait(5000); // Wait even longer for database operation

    console.log('[emit] typing true');
    socket.emit('typing', { conversationId: socket.conversationId, isTyping: true });
    await wait(500);

    console.log('[emit] send-message');
    socket.emit('send-message', { content: 'Hello from node test script \uD83D\uDC4B' });
    await wait(1000);

    console.log('[emit] typing false');
    socket.emit('typing', { conversationId: socket.conversationId, isTyping: false });
    await wait(500);

    console.log('[emit] request-ai-analysis');
    socket.emit('request-ai-analysis', { message: 'Check intent please', analysisType: 'intent' });
    await wait(1000);

    console.log('[emit] update-conversation-metadata');
    socket.emit('update-conversation-metadata', { metadata: { orderId: '12345', source: 'test-script' } });
    await wait(500);

    if (socket.conversationId) {
      console.log('[emit] request-conversation-summary');
      socket.emit('request-conversation-summary');
      await wait(1000);

      console.log('[emit] rate');
      socket.emit('rate', { conversationId: socket.conversationId, rating: 5, comment: 'Great!' });
      await wait(500);

      console.log('[emit] end-conversation');
      socket.emit('end-conversation', { conversationId: socket.conversationId });
      await wait(1000);
    }

    console.log('[done] closing socket');
    socket.close();
    process.exit(0);
  } catch (err) {
    console.error('[run error]', err?.message || err, err);
    socket.close();
    process.exit(1);
  }
}

run();