const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8443');

ws.on('open', () => {
  console.log('Connected to O1 Host Daemon!');

  const req = {
    id: 'test-1',
    method: 'hermes.chat',
    params: {
      query: 'Respond with exactly: O1 system live test ok',
    },
  };

  console.log('Sending hermes.chat request...');
  ws.send(JSON.stringify(req));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'telemetry') {
    console.log('Telemetry received:', msg.data.hermes);
  } else if (msg.type === 'stream_token') {
    process.stdout.write(msg.token);
  } else if (msg.type === 'done') {
    console.log('\nDone event received:', msg);
    ws.close();
    process.exit(0);
  }
});
