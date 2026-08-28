#!/usr/bin/env node
/**
 * wechat-mcp-server
 * 公众号数据 MCP Server — 10w+爆文、标题参考、账号诊断、违禁词检测
 * 协议：MCP (Model Context Protocol) over stdio，JSON-RPC 2.0
 *
 * 启动：REDFOX_API_KEY=ak_xxx npx -y wechat-mcp-server@latest
 */
'use strict';

const readline = require('readline');
const { buildAllTools } = require('redfox-mcp-server/src/build-tools');
const { RedFoxApiError } = require('redfox-mcp-server/src/redfox-client');

const SERVER_NAME = 'wechat-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07'];

const PLATFORM_PREFIX = 'wechat';
const PLATFORM_LABEL = '公众号';

const { tools: allTools, skipped: allSkipped } = buildAllTools();
const tools = allTools.filter(t => t.name.startsWith(PLATFORM_PREFIX + '-'));
const skipped = allSkipped.filter(s => s.name.startsWith(PLATFORM_PREFIX + '-'));

const toolMap = new Map(tools.map(t => [t.name, t]));

// ---------- JSON-RPC 消息处理 ----------
function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return null;
  const { id, method, params } = msg;

  if (id === undefined || id === null) {
    if (method === 'notifications/initialized' || method === 'notifications/cancelled') return null;
    return null;
  }

  try {
    switch (method) {
      case 'initialize': {
        const requested = params?.protocolVersion;
        const negotiated = SUPPORTED_PROTOCOLS.includes(requested) ? requested : PROTOCOL_VERSION;
        return respond(id, {
          protocolVersion: negotiated,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        });
      }
      case 'ping': return respond(id, {});
      case 'tools/list':
        return respond(id, {
          tools: tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
        });
      case 'tools/call': {
        const { name, arguments: args = {} } = params || {};
        const tool = toolMap.get(name);
        if (!tool) return respondError(id, -32602, `Unknown tool: ${name}`);
        runTool(tool, args, id);
        return null;
      }
      default: return respondError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return respondError(id, -32603, e.message);
  }
}

async function runTool(tool, args, id) {
  try {
    const result = await tool.handler(args);
    send(respond(id, { content: result.content || [{ type: 'text', text: String(result) }], isError: false }));
  } catch (e) {
    const errMsg = e instanceof RedFoxApiError ? `[${e.code}] ${e.message}` : `工具执行失败: ${e.message}`;
    send(respond(id, { content: [{ type: 'text', text: errMsg }], isError: true }));
  }
}

function respond(id, result) { return JSON.stringify({ jsonrpc: '2.0', id, result }); }
function respondError(id, code, message) { return JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }); }
function send(payload) { process.stdout.write(payload + '\n'); }

// ---------- 启动 ----------
const rl = readline.createInterface({ input: process.stdin });

console.error(`[${SERVER_NAME}] ${PLATFORM_LABEL}数据 MCP Server v${SERVER_VERSION} 已启动`);
console.error(`[${SERVER_NAME}] 工具数量: ${tools.length}`);
if (skipped.length) console.error(`[${SERVER_NAME}] 跳过工具: ${skipped.map(s => `${s.name}(${s.reason})`).join(', ')}`);
if (!process.env.REDFOX_API_KEY) {
  console.error(`[${SERVER_NAME}] 警告: 未设置 REDFOX_API_KEY 环境变量`);
  console.error(`[${SERVER_NAME}] 获取: https://redfox.hk/settings/api-keys`);
}

rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const out = handleMessage(msg);
  if (out) send(out);
});

rl.on('close', () => process.exit(0));