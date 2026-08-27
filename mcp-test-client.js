#!/usr/bin/env node
/** MCP 服务器测试客户端：spawn server.js 并发送 JSON-RPC 消息
 * 用法:
 *   node mcp-test-client.js list                      # 列出工具
 *   node mcp-test-client.js call <tool> <args.json>   # 调用工具（参数从 JSON 文件读）
 */
const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', [path.join(__dirname, 'server.js')], {
  cwd: __dirname,
  env: { ...process.env },
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buf = '';
server.stdout.on('data', (d) => {
  buf += d.toString('utf-8');
  // 按行解析
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (line) console.log('[SERVER]', line.slice(0, 500));
  }
});
server.stderr.on('data', (d) => process.stderr.write('[ERR] ' + d));

const send = (obj) => server.stdin.write(JSON.stringify(obj) + '\n');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const cmd = process.argv[2] || 'list';
  send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } });
  await sleep(300);
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  await sleep(300);

  if (cmd === 'list') {
    send({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    await sleep(1000);
  } else if (cmd === 'call') {
    const toolName = process.argv[3] || 'douyin-search';
    let args = { keyword: 'AI' };
    if (process.argv[4]) {
      // 支持从文件读取 JSON 参数
      const fs = require('fs');
      args = JSON.parse(fs.readFileSync(process.argv[4], 'utf-8'));
    }
    console.log(`[CALL] ${toolName} ${JSON.stringify(args)}`);
    send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: toolName, arguments: args } });
    await sleep(30000);
  }
  server.kill();
}

main();
