const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:5000';

async function runSimulation() {
  console.log('--- Starting TalkToStranger Unique Count, Auth & P2P Simulation ---');

  // Baseline online count (accounts for any already-open browser windows)
  const initialOnline = (await (await fetch(`${SERVER_URL}/api/health`)).json()).online;
  console.log(`Baseline online users currently connected: ${initialOnline}`);

  // 1. Test Auth API: Guest Creation
  const guestRes = await fetch(`${SERVER_URL}/api/auth/guest`, { method: 'POST' });
  const guestData = await guestRes.json();
  if (!guestData.token || !guestData.user.isGuest) {
    throw new Error('Guest creation failed');
  }
  console.log(`✓ Guest initialized: ${guestData.user.username}`);

  // 2. Test Auth API: User Registration
  const testUsername = `user_${Date.now()}`;
  const regRes = await fetch(`${SERVER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      email: `${testUsername}@example.com`,
      password: 'password123'
    })
  });
  const regData = await regRes.json();
  if (!regData.token || regData.user.username !== testUsername) {
    throw new Error('User registration failed: ' + JSON.stringify(regData));
  }
  console.log(`✓ Account registered: ${regData.user.username}`);

  // 3. Test Priority Upgrade
  const upgradeRes = await fetch(`${SERVER_URL}/api/auth/upgrade-priority`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${regData.token}` }
  });
  const upgradeData = await upgradeRes.json();
  if (upgradeData.user.tier !== 'priority') {
    throw new Error('Priority upgrade failed: ' + JSON.stringify(upgradeData));
  }
  console.log(`✓ Account upgraded to Priority Pass: tier = ${upgradeData.user.tier}`);

  // 4. Test UNIQUE User Counting across multiple tabs of the same browser
  const user1ClientId = 'device_user_alpha_' + Date.now();
  const tab1 = io(SERVER_URL, { transports: ['websocket'], auth: { clientId: user1ClientId } });
  const tab2 = io(SERVER_URL, { transports: ['websocket'], auth: { clientId: user1ClientId } });

  await Promise.all([
    new Promise(res => tab1.on('connect', res)),
    new Promise(res => tab2.on('connect', res))
  ]);

  // Check health endpoint for unique count increment
  const health1 = await (await fetch(`${SERVER_URL}/api/health`)).json();
  const addedUsersAfter2Tabs = health1.online - initialOnline;
  console.log(`✓ 2 browser tabs connected from same device -> Unique count added: ${addedUsersAfter2Tabs}`);
  if (addedUsersAfter2Tabs !== 1) {
    throw new Error(`Expected exactly 1 unique user added for same device tabs, but got ${addedUsersAfter2Tabs}`);
  }

  // Connect a 2nd distinct user device
  const user2ClientId = 'device_user_beta_' + Date.now();
  const user2Client = io(SERVER_URL, { transports: ['websocket'], auth: { clientId: user2ClientId } });
  await new Promise(res => user2Client.on('connect', res));

  const health2 = await (await fetch(`${SERVER_URL}/api/health`)).json();
  const addedUsersAfter2Devices = health2.online - initialOnline;
  console.log(`✓ 2nd distinct device connected -> Unique count added: ${addedUsersAfter2Devices}`);
  if (addedUsersAfter2Devices !== 2) {
    throw new Error(`Expected exactly 2 unique users added for 2 distinct devices, but got ${addedUsersAfter2Devices}`);
  }

  // 5. Test Matchmaking without tags
  let matchPromise = new Promise((resolve) => {
    let count = 0;
    const matches = {};

    tab1.on('match-found', (data) => {
      matches.client1 = data;
      count++;
      if (count === 2) resolve(matches);
    });

    user2Client.on('match-found', (data) => {
      matches.client2 = data;
      count++;
      if (count === 2) resolve(matches);
    });
  });

  console.log('Finding match for Priority Tab 1 & Guest Client 2 in video mode...');
  tab1.emit('find-stranger', { mode: 'video', tier: 'priority' });
  user2Client.emit('find-stranger', { mode: 'video', tier: 'guest' });

  const matches = await matchPromise;
  console.log('✓ Matchmaker paired peers successfully:');
  console.log(`  Room: ${matches.client1.roomId}`);
  console.log(`  Client 1 partnerTier: ${matches.client1.partnerTier}`);
  console.log(`  Client 2 partnerTier: ${matches.client2.partnerTier}`);

  // 6. Test WebRTC Offer signal relay
  const signalPromise = new Promise((resolve) => {
    user2Client.on('signal', ({ senderId, signal }) => {
      if (signal.type === 'offer') {
        resolve({ senderId, signal });
      }
    });
  });

  tab1.emit('signal', {
    targetId: matches.client1.partnerId,
    signal: { type: 'offer', sdp: { type: 'offer', sdp: 'mock-sdp-data' } }
  });

  await signalPromise;
  console.log('✓ WebRTC Signal Offer relayed successfully to stranger');

  // 7. Test External Web Share Co-Browse relay
  const webSharePromise = new Promise((resolve) => {
    user2Client.on('web-share', (data) => {
      resolve(data);
    });
  });

  tab1.emit('web-share', {
    url: 'https://duckduckgo.com',
    active: true
  });

  const webShareData = await webSharePromise;
  console.log(`✓ External Web Co-Browse link relayed: "${webShareData.url}"`);

  // 8. Test chat message relay
  const chatPromise = new Promise((resolve) => {
    user2Client.on('chat-message', (msg) => {
      resolve(msg);
    });
  });

  tab1.emit('chat-message', {
    text: 'Hey! Where are you from?',
    timestamp: Date.now()
  });

  const chatMsg = await chatPromise;
  console.log(`✓ Chat message received: "${chatMsg.text}"`);

  // 9. Test skip
  const skipPromise = new Promise((resolve) => {
    user2Client.on('stranger-left', (reason) => {
      resolve(reason);
    });
  });

  tab1.emit('skip-stranger', { requeue: false });
  await skipPromise;
  console.log('✓ Stranger skip event received');

  // Clean up
  tab1.disconnect();
  tab2.disconnect();
  user2Client.disconnect();

  console.log('--- ALL SIMULATION, UNIQUE COUNT & AUTH CHECKS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

runSimulation().catch(err => {
  console.error('Test simulation failed:', err);
  process.exit(1);
});
