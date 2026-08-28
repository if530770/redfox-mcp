#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const p = path.join(__dirname, 'server.js');
console.log('server:', p);
const s = spawn(process.execPath, [p], { stdio: ['pipe', 'pipe', 'pipe'] });
s.stdout.on('data', d => console.log('[OUT]', JSON.stringify(d.toString('utf-8'))));
s.stderr.on('data', d => console.log('[ERR]', d.toString('utf-8').slice(0, 300)));
s.on('error', e => console.log('[SPAWN-ERR]', e.message));
s.on('exit', (code, sig) => console.log('[EXIT]', code, sig));
s.stdin.on('error', e => console.log('[STDIN-ERR]', e.message));
setTimeout(() => {
  console.log('[WRITE] sending initialize');
  s.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } }) + '\n');
}, 1500);
setTimeout(() => { console.log('[DONE]'); s.kill(); }, 6000);
