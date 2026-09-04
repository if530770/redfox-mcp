/**
 * export-tools-python.js — 从 manifest + overrides 生成 Python 包使用的 tools.json
 *
 * 输出路径: ../redfox-mcp-py/core/src/redfox_mcp_core/tools.json
 * 与 Node 端 buildAllTools() 保持同一份数据源，避免双端漂移：
 *   - endpoint: 优先 override 修正后的 endpoint（含 GET query 榜单接口）
 *   - method:   override.method || manifest.method || POST
 *   - 两步式异步工具: 附带 submitUrl/resultUrl/taskIdField/poll* 元数据
 *   - fixedParams: 请求必须携带、但不暴露为公开参数的常量（如 hotSpot 的 platform=2）
 *   - Python 专属参数修正表 PY_PARAMS：Node 端 payload 函数可做的“便捷换算”
 *     （days→startDate 等）在 Python 端不可用，直接暴露后端字段参数。
 *
 * 用法: node scripts/export-tools-python.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { overrides } = require('../src/overrides');
const { buildAllTools } = require('../src/build-tools.js');

const MANIFEST_PATH = path.join(__dirname, '..', 'tools-manifest.json');
const OUT_PATH = path.join(__dirname, '..', '..', 'redfox-mcp-py', 'core', 'src', 'redfox_mcp_core', 'tools.json');

/** 请求必须携带但不对公开的参数常量（key: 工具名 -> {字段: 值}） */
const PY_FIXED = {
  'douyin-hot-trend': { platform: 2 },
  'weibo-comment-search': { maxIdType: '0' },
  'youtube-digest': { format: 'json', includeTimestamp: false, sendMetadata: true },
};

/** Python 专属参数修正（Node payload 的便捷换算在 Python 端改为直接暴露后端字段） */
const PY_PARAMS = {
  'wechat-title': {
    keyword: { type: 'string', required: true, description: '赛道关键词（多词用逗号分隔，最多5个）' },
    startDate: { type: 'string', description: '起始日期 YYYY-MM-DD（建议填今天往前推 N-1 天，如近7天则填今天减6天）' },
  },
  'wechat-top-account': {
    rankType: { type: 'string', default: 'day', enum: ['day', 'week', 'month'], description: '榜单类型：day=日榜(每日17:30更新昨日) week=周榜(周一更新上周) month=月榜(每月3号更新上月)' },
    rankDate: { type: 'string', description: '榜单日期 YYYY-MM-DD；不填后端返回最近可用日期' },
    category: { type: 'string', default: '总排名', description: '分类（默认：总排名；可选 科技数码/健康养生 等23个标准分类）' },
  },
  // 2026-09 全量验证修复：Node 端 payload 换算在 Python 端不可用，直接暴露后端字段
  'bilibili-comment': {
    opusId: { type: 'string', required: true, description: 'B站视频BV号（如 BV1GJ411x7h7）' },
    sortType: { type: 'string', default: '2', enum: ['2', '1'], description: '排序：2=按热度, 1=按时间' },
    dataNum: { type: 'string', default: '20', description: '获取评论数量' },
    offset: { type: 'string', default: '0', description: '分页游标' },
  },
  'bilibili-search-download': {
    keyword: { type: 'string', required: true, description: '搜索关键词' },
    page: { type: 'string', default: '1', description: '页码' },
    pageSize: { type: 'number', default: 10, description: '每页数量' },
    order: { type: 'string', default: 'play', description: '排序方式（如 play）' },
    dateRange: { type: 'string', default: '7d', description: '发布时间范围，如 7d=近7天' },
  },
  'kuaishou-accounts': {
    accountName: { type: 'string', required: true, description: '快手账号名称' },
    page: { type: 'number', default: 1, description: '页码' },
    pageSize: { type: 'number', default: 20, description: '每页数量（最大50）' },
  },
  'weibo-comment-search': {
    opusId: { type: 'string', required: true, description: '微博博文 opusId（博文链接尾段的字母数字串，如 https://weibo.com/1784473157/R8X4f2lnq 中的 R8X4f2lnq）' },
    maxCursor: { type: 'string', default: '0', description: '翻页游标，翻页时传上次返回的 maxId' },
  },
  'youtube-digest': {
    videoUrl: { type: 'string', required: true, description: 'YouTube视频链接或视频ID' },
    language: { type: 'string', default: 'zh,en,asr', description: '字幕语言代码，如 zh/en' },
  },
};

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const { tools: nodeTools } = buildAllTools();
  const nodeByName = new Map(nodeTools.map(t => [t.name, t]));
  const pyTools = [];

  for (const item of manifest.tools || []) {
    const node = nodeByName.get(item.name);
    const ov = overrides[item.name];
    if (!node) continue; // 构建期跳过的工具（无端点）不导出

    const py = {
      name: item.name,
      description: node.description,
      inputSchema: node.inputSchema,
    };

    // Python 专属参数修正
    if (PY_PARAMS[item.name]) {
      const properties = {};
      const required = [];
      for (const [name, def] of Object.entries(PY_PARAMS[item.name])) {
        const prop = { type: def.type || 'string', description: def.description || name };
        if (def.enum) prop.enum = def.enum;
        if (def.default !== undefined) prop.default = def.default;
        properties[name] = prop;
        if (def.required) required.push(name);
      }
      py.inputSchema = { type: 'object', properties, ...(required.length ? { required } : {}) };
    }

    const api = item.api || {};
    if (ov && (ov.async || ov.submitUrl) && ov.submitUrl) {
      py.endpoint = ov.submitUrl;
      py.method = 'POST';
      py.submitUrl = ov.submitUrl;
      py.resultUrl = ov.resultUrl;
      py.taskIdField = ov.taskIdField || 'data.taskId';
      py.pollIntervalMs = ov.pollIntervalMs || 5000;
      py.pollMaxAttempts = ov.pollMaxAttempts || 60;
    } else {
      py.endpoint = (ov && ov.endpoint) || api.endpoint;
      py.method = (ov && ov.method) || api.method || 'POST';
    }
    if (PY_FIXED[item.name]) py.fixedParams = PY_FIXED[item.name];

    pyTools.push(py);
  }

  const out = { generatedAt: new Date().toISOString(), toolCount: pyTools.length, tools: pyTools };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf-8');
  console.log(`已生成 ${pyTools.length} 个工具 -> ${OUT_PATH}`);
}

main();
