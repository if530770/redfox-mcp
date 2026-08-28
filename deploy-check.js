#!/usr/bin/env node
/**
 * 模拟魔搭部署检测：npx -y redfox-mcp-server@latest
 * 启动远程 npm 包 -> initialize -> tools/list -> tools/call
 */
const { spawn } = require('child_process');

const server = spawn(process.execPath, [
  'C:\\Users\\马祯\\Documents\\Qoder\\2026-08-27\\chat-1\\tmp-deploy-check\\node_modules\\redfox-mcp-server\\server.js'
], {
  env: { ...process.env },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buf = '';
server.stdout.on('data', (d) => { buf += d.toString('utf-8'); });
server.stderr.on('data', (d) => process.stderr.write('[ERR] ' + d));

const send = (obj) => server.stdin.write(JSON.stringify(obj) + '\n');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('1) initialize...');
  send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'deploy-check', version: '1.0' } } });
  await sleep(2000);

  console.log('2) notifications/initialized...');
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  await sleep(500);

  console.log('3) tools/list...');
  send({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  await sleep(2000);

  const listLine = buf.trim().split('\n').find(l => l.includes('"id":1'));
  if (!listLine) { console.log('FAIL: no tools/list response'); console.log('RAW:', buf.slice(-500)); server.kill(); process.exit(1); }
  const listResp = JSON.parse(listLine);
  const tools = listResp.result.tools;
  console.log(`tools/list OK: ${tools.length} tools`);
  console.log('sample:', tools.slice(0, 5).map(t => t.name).join(', '));

  console.log('4) tools/call douyin-search...');
  send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'douyin-search', arguments: { keyword: 'AI' } } });
  await sleep(15000);

  const callLine = buf.trim().split('\n').find(l => l.includes('"id":2'));
  if (!callLine) { console.log('WARN: no tools/call response'); server.kill(); process.exit(1); }
  const callResp = JSON.parse(callLine);
  if (callResp.result && callResp.result.isError === false) {
    const text = callResp.result.content[0].text;
    const j = JSON.parse(text);
    console.log(`tools/call OK: code=${j.code}, data keys=${Object.keys(j.data || {}).join(',')}`);
  } else if (callResp.error) {
    console.log('tools/call ERROR:', JSON.stringify(callResp.error));
  } else {
    console.log('tools/call result:', JSON.stringify(callResp.result).slice(0, 300));
  }

  server.kill();
  process.exit(0);
})();
