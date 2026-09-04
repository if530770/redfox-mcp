/**
 * 工具构建器
 * 合并自动提取的 tools-manifest.json 与人工校正 overrides.js，
 * 生成最终的 MCP 工具定义列表：
 *   { name, description, inputSchema, handler }
 *
 * 参数设计规则：
 * - 优先使用 override.params（人工精确校正）
 * - 否则使用自动提取的 payloadKeys（过滤 source 等内部字段）
 * - source 字段由服务器自动填充，不暴露给调用方
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { overrides, SOURCE, EXCLUDED_TOOLS } = require('./overrides');
const EXCLUDED = new Set(EXCLUDED_TOOLS || []);
const { request, submitAndPoll, RedFoxApiError } = require('./redfox-client');

const MANIFEST_PATH = path.join(__dirname, '..', 'tools-manifest.json');

/** 参数名转换：payload 键名 -> 友好参数名 */
function toArgName(key) {
  return key;
}

/**
 * 从 manifest 自动生成工具定义（无 override 时）
 */
function buildFromManifest(item) {
  const api = item.api;
  if (!api || !api.endpoint) return null;

  // 参数：payloadKeys 中排除内部字段
  const internalKeys = ['source'];
  const paramKeys = (api.payloadKeys || []).filter(k => !internalKeys.includes(k));

  const properties = {};
  const required = [];
  for (const key of paramKeys) {
    properties[key] = { type: inferType(key), description: key };
  }
  // 常见必填参数
  if (properties.keyword) required.push('keyword');
  else if (properties.url && /download|extract/i.test(item.name)) required.push('url');
  else if (properties.prompt && /video-gen|image-gen|visual/i.test(item.name)) required.push('prompt');

  const inputSchema = {
    type: 'object',
    properties,
    ...(required.length ? { required } : {}),
  };

  const endpoint = api.endpoint;
  const method = api.method || 'POST';

  const handler = async (args) => {
    const body = { ...args, source: SOURCE };
    const resp = await request({ url: endpoint, method, body });
    return { content: [{ type: 'text', text: JSON.stringify(resp, null, 2) }] };
  };

  return { name: item.name, description: item.description || `RedFox API: ${endpoint}`, inputSchema, handler };
}

/** 根据键名推断参数类型 */
function inferType(key) {
  if (/num|page|size|count|limit|offset|max|days|top|duration|seed|batch/i.test(key)) return 'number';
  if (/bool|flag|is|has|enabled/i.test(key)) return 'boolean';
  return 'string';
}

/**
 * 构建带 override 的工具定义
 */
function buildWithOverride(item, ov) {
  const { params = {}, payload, description, async: isAsync, submitUrl, resultUrl, taskIdField, pollIntervalMs, pollMaxAttempts, endpoint: ovEndpoint, method: ovMethod } = ov;

  const properties = {};
  const required = [];
  for (const [name, def] of Object.entries(params)) {
    const prop = { type: def.type || 'string', description: def.description || name };
    if (def.enum) prop.enum = def.enum;
    if (def.default !== undefined) prop.default = def.default;
    properties[name] = prop;
    if (def.required) required.push(name);
  }
  const inputSchema = { type: 'object', properties, ...(required.length ? { required } : {}) };

  const makeBody = (args) => {
    const body = payload ? payload(args) : { ...args, source: SOURCE };
    // 删除未提供的可选参数
    for (const k of Object.keys(body)) {
      if (body[k] === undefined) delete body[k];
    }
    return body;
  };

  let handler;
  if (isAsync && submitUrl && resultUrl) {
    handler = async (args) => {
      const body = makeBody(args);
      const result = await submitAndPoll({
        submitUrl, resultUrl, submitBody: body,
        taskIdField, pollIntervalMs, pollMaxAttempts,
      });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    };
  } else {
    const endpoint = ovEndpoint || item.api?.endpoint || submitUrl;
    const method = ovMethod || item.api?.method || 'POST';
    handler = async (args) => {
      const body = makeBody(args);
      const placeholders = [...endpoint.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
      const isGet = method.toUpperCase() === 'GET';
      let url = endpoint;
      let finalBody = body;

      if (placeholders.length) {
        // URL 模板渲染（如 GET query 接口: ...?rankDate={rankDate}&category={category}）
        for (const key of placeholders) {
          const value = body[key];
          if (value === undefined || value === null) {
            throw new RedFoxApiError(`缺少 URL 参数: ${key}`, 'MISSING_URL_PARAM');
          }
          url = url.replace(new RegExp(`\\{${key}\\}`), encodeURIComponent(String(value)));
        }
        finalBody = undefined;
      } else if (isGet) {
        // GET + query 接口（榜单类，如 hotSpot/getListByPlatform）：非空参数拼到 query string
        const qs = Object.entries(body)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&');
        if (qs) url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${qs}`;
        finalBody = undefined;
      }

      const resp = await request({ url, method: placeholders.length || isGet ? 'GET' : method, body: finalBody });
      return { content: [{ type: 'text', text: JSON.stringify(resp, null, 2) }] };
    };
  }

  return { name: item.name, description: description || item.description || item.name, inputSchema, handler };
}

/**
 * 加载 manifest 并构建全部工具
 * @returns {Array<{name, description, inputSchema, handler}>}
 */
function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`[redfox-mcp] 未找到 ${MANIFEST_PATH}，请先运行 mcp-extract-manifest.js 生成工具清单`);
    return [];
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  return manifest.tools || [];
}

/**
 * 构建全部工具定义
 */
function buildAllTools() {
  const items = loadManifest();
  const tools = [];
  const skipped = [];

  for (const item of items) {
    if (EXCLUDED.has(item.name)) {
      skipped.push({ name: item.name, reason: 'record-only-endpoint' });
      continue;
    }
    const ov = overrides[item.name];
    try {
      if (ov) {
        const tool = buildWithOverride(item, ov);
        tools.push(tool);
      } else {
        const tool = buildFromManifest(item);
        if (tool) tools.push(tool);
        else skipped.push({ name: item.name, reason: 'no-api-endpoint' });
      }
    } catch (e) {
      skipped.push({ name: item.name, reason: e.message });
    }
  }

  return { tools, skipped };
}

module.exports = { buildAllTools };
