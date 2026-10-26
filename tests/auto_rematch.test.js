const io = require('socket.io-client');
const assert = require('assert');

const SOCKET_URL = 'http://localhost:5000';

async function testAutoRematch() {
  console.log('Testing Auto-Rematch when one side ends or skips...');

  const clientA = io(SOCKET_URL, { auth: { clientId: 'client_A_' + Date.now() } });
  const clientB = io(SOCKET_URL, { auth: { clientId: 'client_B_' + Date.now() } });
  const clientC = io(SOCKET_URL, { auth: { clientId: 'client_C_' + Date.now() } });

  await new Promise(r => setTimeout(r, 600));

  let matchedA = null;
  let matchedB = null;

  clientA.on('match-found', (data) => {
    matchedA = data;
  });

  clientB.on('match-found', (data) => {
    matchedB = data;
  });

  // Client A and B search
  clientA.emit('find-stranger', { mode: 'chat', gender: 'male' });
  clientB.emit('find-stranger', { mode: 'chat', gender: 'female' });

  await new Promise(r => setTimeout(r, 600));
  assert.ok(matchedA && matchedB, 'Client A and B should be matched initially');
  console.log('✓ Initial match established between A and B');

  // Now, Client A clicks STOP/Leave
  let bReceivedLeft = false;
  clientB.on('stranger-left', () => {
    bReceivedLeft = true;
    // Client B auto-starts looking for stranger
    clientB.emit('find-stranger', { mode: 'chat', gender: 'female' });
  });

  clientA.emit('leave-all');

  await new Promise(r => setTimeout(r, 600));
  assert.ok(bReceivedLeft, 'Client B should receive stranger-left');
  console.log('✓ Client B received stranger-left when A stopped');

  // Now Client C joins queue
  let bMatchedWithC = null;
  clientB.on('match-found', (data) => {
    bMatchedWithC = data;
  });

  clientC.emit('find-stranger', { mode: 'chat', gender: 'other' });

  await new Promise(r => setTimeout(r, 600));
  assert.ok(bMatchedWithC, 'Client B should automatically be matched with Client C!');
  console.log('✓ Client B automatically matched with next available stranger Client C!');

  clientA.disconnect();
  clientB.disconnect();
  clientC.disconnect();

  console.log('--- AUTO-REMATCH TEST PASSED PERFECTLY ---');
  process.exit(0);
}

testAutoRematch().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
