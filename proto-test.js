#!/usr/bin/env node
/**
 * 本地验证 1.0.1：模拟不同协议版本的 initialize 握手 + tools/list
 */
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');

function test(version) {
  return new Promise((resolve) => {
    const server = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    let buf = '';
    const timer = setTimeout(() => { server.kill(); resolve({ version, ok: false, err: 'timeout' }); }, 8000);
    server.stdout.on('data', (d) => {
      buf += d.toString('utf-8');
      if (buf.includes('"id":0') && buf.includes('"id":1')) {
        clearTimeout(timer);
        const lines = buf.trim().split('\n').filter(l => l.includes('"id":'));
        const init = JSON.parse(lines.find(l => l.includes('"id":0')));
        const list = JSON.parse(lines.find(l => l.includes('"id":1')));
        const ok = init.result.protocolVersion === version && list.result.tools.length > 0;
        server.kill();
        resolve({ version, ok, serverVersion: init.result.protocolVersion, tools: list.result.tools.length, err: ok ? '' : `negotiated=${init.result.protocolVersion}, tools=${list.result.tools.length}` });
      }
    });
    server.stdout.on('close', () => clearTimeout(timer));
    server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: version, capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } }) + '\n');
    setTimeout(() => server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n'), 500);
  });
}

(async () => {
  const versions = ['2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07', '1.0'];
  for (const v of versions) {
    const r = await test(v);
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  protocolVersion=${v}  ->  negotiated=${r.serverVersion}, tools=${r.tools}  ${r.err}`);
  }
  process.exit(0);
})();
