/**
 * verify-endpoints.js — 全量验证 MCP 工具接口路径
 *
 * 对每个工具实际使用的接口发探测请求（假 key），区分：
 *   - HTTP 404        → 路径不存在（必须修复）
 *   - HTTP 200 + 业务码 → 路径存在（200/2000 成功，其他如 3107=API Key无效 均证明路径正确）
 *   - 其他状态码      → 需要人工确认（400 参数错误 / 401 等均说明路径存在）
 *
 * 用法: node scripts/verify-endpoints.js [--verbose]
 */
'use strict';

const { overrides } = require('../src/overrides');
const fs = require('fs');
const path = require('path');

const MANIFEST = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools-manifest.json'), 'utf-8'));
const FAKE_KEY = 'ak_test_fake';
const CONCURRENCY = 6;
const verbose = process.argv.includes('--verbose');

/** 探测 URL 模板占位符的样例值（用于探测 GET query 接口路径是否存在） */
function fillPlaceholders(url) {
  const SAMPLE = {
    rankDate: '2026-09-01',
    rank_date: '2026-09-01',
    date: '2026-09-01',
    keyword: 'AI',
    category: '综合全部',
    category_encoded: '%E7%BB%BC%E5%90%88%E5%85%A8%E9%83%A8',
    source: 'endpoint-verify',
    taskId: '0',
  };
  let filled = url;
  for (const m of url.matchAll(/\{(\w+)\}/g)) {
    const key = m[1];
    filled = filled.replace(new RegExp(`\\{${key}\\}`), SAMPLE[key] || 'test');
  }
  return filled;
}

/** 为每个工具计算需要探测的 URL（异步工具: submitUrl + resultUrl；普通工具: endpoint） */
function collectTargets() {
  const targets = [];
  const seen = new Set();
  const urlToTools = new Map(); // key: `${method} ${url}` -> [toolNames]

  const addTool = (url, method, toolName) => {
    const key = `${method} ${url}`;
    if (!urlToTools.has(key)) urlToTools.set(key, []);
    const list = urlToTools.get(key);
    if (!list.includes(toolName)) list.push(toolName);
  };

  for (const item of MANIFEST.tools || []) {
    const api = item.api;
    const ov = overrides[item.name];

    if (ov && (ov.async || ov.submitUrl) && ov.submitUrl) {
      // 异步两步式：探测 submit + result 两个端点
      const resultUrl = ov.resultUrl ? ov.resultUrl.replace('{taskId}', '0') : null;
      addTool(ov.submitUrl, 'POST', item.name);
      if (resultUrl) addTool(resultUrl, 'POST', item.name);
    } else if ((ov && ov.endpoint) || (api && api.endpoint)) {
      // 普通工具：探测 override 修正后的 endpoint（优先）或 manifest 记录的 endpoint
      const raw = (ov && ov.endpoint) || api.endpoint;
      addTool(raw.includes('{') ? fillPlaceholders(raw) : raw, (ov && ov.method) || api.method || 'POST', item.name);
    }
    // 无 api.endpoint 且无 submitUrl 的工具（如 weibo-comment-search）不探测，构建时会跳过
  }

  for (const [key, tools] of urlToTools) {
    const [method, url] = [key.slice(0, key.indexOf(' ')), key.slice(key.indexOf(' ') + 1)];
    targets.push({ url, method, tools });
  }
  return targets;
}

async function probe(target) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  const started = Date.now();
  try {
    const resp = await fetch(target.url, {
      method: target.method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': FAKE_KEY,
        'REDFOX_API_KEY': FAKE_KEY,
      },
      body: target.method === 'POST' ? JSON.stringify({ source: 'endpoint-verify' }) : undefined,
      signal: ctrl.signal,
    });
    const text = await resp.text();
    let brief = text.slice(0, 150).replace(/\s+/g, ' ');
    // 尝试提取业务码
    try {
      const j = JSON.parse(text);
      if (j.code !== undefined) brief = `code=${j.code} msg=${j.msg || j.message || ''}`;
    } catch { /* 非 JSON */ }
    return { ...target, status: resp.status, brief, ms: Date.now() - started };
  } catch (e) {
    return { ...target, status: 0, brief: e.name === 'AbortError' ? 'TIMEOUT' : e.message.slice(0, 80), ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const targets = collectTargets();
  console.log(`共 ${targets.length} 个唯一接口待验证（覆盖 ${MANIFEST.tools.length} 个工具定义）\n`);

  const results = [];
  // 并发分批
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const rs = await Promise.all(batch.map(probe));
    results.push(...rs);
  }

  const notFound = results.filter(r => r.status === 404);
  const ok = results.filter(r => r.status === 200);
  const other = results.filter(r => r.status !== 404 && r.status !== 200);

  console.log('==================== 结果汇总 ====================');
  console.log(`✅ HTTP 200（路径正确） : ${ok.length}`);
  console.log(`🟡 其他状态（路径存在）: ${other.length}`);
  console.log(`❌ HTTP 404（路径错误!）: ${notFound.length}`);

  if (ok.length) {
    console.log('\n---------------- 200 接口明细 ----------------');
    for (const r of ok) console.log(`  ${r.method} ${r.url}  [${r.brief}]  (${r.tools.join(',')})`);
  }
  if (other.length) {
    console.log('\n---------------- 其他状态接口 ----------------');
    for (const r of other) console.log(`  ${r.method} ${r.url}  → HTTP ${r.status} [${r.brief}]  (${r.tools.join(',')})`);
  }
  if (notFound.length) {
    console.log('\n---------------- ❌ 404 接口（需修复） ----------------');
    for (const r of notFound) console.log(`  ${r.method} ${r.url}  (${r.tools.join(',')})`);
  }
  console.log(`\n耗时统计: 平均 ${(results.reduce((s, r) => s + r.ms, 0) / results.length).toFixed(0)}ms/接口`);
}

main().catch(e => { console.error('执行失败:', e.message); process.exit(1); });
