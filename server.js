#!/usr/bin/env node
/**
 * RedFox MCP Server
 * 将 redfox-community 仓库的全部 Skill 封装为 MCP 工具
 * 协议：MCP (Model Context Protocol) over stdio，JSON-RPC 2.0
 *
 * 启动：REDFOX_API_KEY=ak_xxx node server.js
 */
'use strict';

const readline = require('readline');
const { buildAllTools } = require('./src/build-tools');
const { RedFoxApiError } = require('./src/redfox-client');

const SERVER_NAME = 'redfox-mcp';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

const { tools, skipped } = buildAllTools();

// ---------- MCP 工具注册表 ----------
const toolMap = new Map(tools.map(t => [t.name, t]));

// ---------- JSON-RPC 消息处理 ----------
function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return null;

  const { id, method, params } = msg;

  // 通知类（无响应）
  if (!id) {
    if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
      return null; // 忽略
    }
    return null;
  }

  try {
    switch (method) {
      case 'initialize':
        return respond(id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        });

      case 'ping':
        return respond(id, {});

      case 'tools/list':
        return respond(id, {
          tools: tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
          })),
        });

      case 'tools/call': {
        const { name, arguments: args = {} } = params || {};
        const tool = toolMap.get(name);
        if (!tool) {
          return respondError(id, -32602, `Unknown tool: ${name}`);
        }
        // 异步执行（工具可能耗时较长）
        runTool(tool, args, id);
        return null; // 响应将通过后续 send 发送
      }

      default:
        return respondError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    return respondError(id, -32603, e.message);
  }
}

/** 异步执行工具并发送结果（长任务不阻塞消息循环） */
async function runTool(tool, args, id) {
  try {
    const result = await tool.handler(args);
    send(respond(id, {
      content: result.content || [{ type: 'text', text: String(result) }],
      isError: false,
    }));
  } catch (e) {
    const errMsg = e instanceof RedFoxApiError
      ? `[${e.code}] ${e.message}`
      : `工具执行失败: ${e.message}`;
    send(respond(id, {
      content: [{ type: 'text', text: errMsg }],
      isError: true,
    }));
  }
}

// ---------- JSON-RPC 响应工具 ----------
function respond(id, result) {
  return JSON.stringify({ jsonrpc: '2.0', id, result });
}

function respondError(id, code, message) {
  return JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
}

function send(payload) {
  process.stdout.write(payload + '\n');
}

// ---------- 启动 ----------
const rl = readline.createInterface({ input: process.stdin });

// 启动日志（stderr，避免污染 stdout 协议通道）
console.error(`[redfox-mcp] RedFox MCP Server v${SERVER_VERSION} 已启动`);
console.error(`[redfox-mcp] 工具数量: ${tools.length}, 跳过: ${skipped.length}`);
if (skipped.length) {
  console.error(`[redfox-mcp] 跳过工具: ${skipped.map(s => `${s.name}(${s.reason})`).join(', ')}`);
}
if (!process.env.REDFOX_API_KEY) {
  console.error('[redfox-mcp] 警告: 未设置 REDFOX_API_KEY 环境变量，工具调用将失败');
  console.error('[redfox-mcp] 设置方式: 前往 https://redfox.hk/settings/api-keys 获取后 export REDFOX_API_KEY=ak_xxx');
}

rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return; // 忽略非法 JSON
  }
  const out = handleMessage(msg);
  if (out) send(out);
});

rl.on('close', () => process.exit(0));
