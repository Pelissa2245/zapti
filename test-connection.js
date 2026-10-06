const http = require('http');
const { URL } = require('url');

const tests = [
  { name: '192.168.1.193:3000', url: 'http://192.168.1.193:3000/api/v1/auth/bootstrap-status' },
  { name: 'localhost:3000', url: 'http://localhost:3000/api/v1/auth/bootstrap-status' },
];

async function test() {
  for (const test of tests) {
    const parsed = new URL(test.url);
    console.log('Testing:', test.name);
    console.log('Host:', parsed.hostname);
    console.log('Port:', parsed.port);

    await new Promise((resolve) => {
      const req = http.request({
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: 'GET',
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('  Status:', res.statusCode);
          console.log('  Data:', data);
          if (res.socket && res.socket.remoteAddress) {
            console.log('  Remote:', res.socket.remoteAddress + ':' + res.socket.remotePort);
          } else {
            console.log('  Remote: N/A');
          }
          resolve();
        });
      });
      req.on('error', (e) => {
        console.error('  Error:', e.message);
        resolve();
      });
      req.end();
    });
  }
}
test();