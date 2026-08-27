#!/usr/bin/env node
/**
 * 为 Qoder 生成 MCP 注册配置：
 *   SERVER_METADATA.json  +  tools/<tool-name>.json
 * 输出到 qoder-register/
 * 用法: node gen-qoder-register.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { buildAllTools } = require('./src/build-tools');

const OUT_DIR = path.join(__dirname, 'qoder-register');

const { tools } = buildAllTools();

function main() {
  const toolsDir = path.join(OUT_DIR, 'tools');
  fs.mkdirSync(toolsDir, { recursive: true });

  // SERVER_METADATA.json
  const metadata = {
    name: 'redfox-mcp',
    source: 'local',
    toolCount: tools.length,
    description: 'RedFox 新媒体数据 MCP 服务器：抖音/小红书/公众号/B站/快手/微博等平台爆款数据查询、违禁词检测、AI搜索、视频下载与生成',
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SERVER_METADATA.json'), JSON.stringify(metadata, null, 2), 'utf-8');

  // tools/*.json
  for (const t of tools) {
    const def = {
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    };
    fs.writeFileSync(path.join(toolsDir, `${t.name}.json`), JSON.stringify(def, null, 2), 'utf-8');
  }

  console.log(`Done: ${tools.length} tool schemas + SERVER_METADATA.json -> ${OUT_DIR}`);
}

main();
