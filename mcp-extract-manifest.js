#!/usr/bin/env node
/**
 * redfox-community MCP 改造 - 增强版 API 信息提取
 * 从每个 skill 的 Python 脚本中提取：
 *   - API endpoint + HTTP method
 *   - 请求头类型（X-API-KEY / REDFOX_API_KEY）
 *   - payload 字段映射（argparse 参数 -> API payload 键）
 * 输出 tools-manifest.json（MCP 工具清单）
 * 用法: node mcp-extract-manifest.js <redfox-community 根目录>
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || 'e:\\新榜\\项目代码\\redfox-community';
const SKILLS_DIR = path.join(ROOT, 'skills');

// ============ 文本提取工具 ============

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    fm[key] = val;
  }
  return fm;
}

/** 提取 payload/params 字典的键集合 */
function extractPayloadKeys(src) {
  const keys = new Set();
  // 匹配各种命名：payload/params/data/body/... 或其下划线/后缀变体
  const dictRe = /(?:payload|params|data|body|request_data|post_data|form_data|query_params|json_data)[_a-zA-Z]*\s*=\s*\{([\s\S]*?)\n\s*\}/g;
  let m;
  while ((m = dictRe.exec(src)) !== null) {
    const block = m[1];
    const keyRe = /["']([A-Za-z][A-Za-z0-9_]*)["']\s*:/g;
    let km;
    while ((km = keyRe.exec(block)) !== null) keys.add(km[1]);
  }
  // 也匹配 json.dumps({...}) 内联
  const dumpRe = /json\.dumps\(\s*\{([\s\S]*?)\}\s*(?:,\s*ensure_ascii)?\)/g;
  while ((m = dumpRe.exec(src)) !== null) {
    const keyRe = /["']([A-Za-z][A-Za-z0-9_]*)["']\s*:/g;
    let km;
    while ((km = keyRe.exec(m[1])) !== null) keys.add(km[1]);
  }
  // 过滤非 payload 键（本地变量名等）
  return [...keys].filter(k => !/^(error|REDFOX_API_KEY|api_key|items|count|fetched_at|updatedAt|subscriptions|subscribedAt|uniqueName|userId)$/.test(k));
}

/** 提取 API 端点与 HTTP 方法 */
function extractEndpoints(src) {
  const eps = [];
  const urlRe = /https?:\/\/[^\s"'`)\]]+/g;
  const urls = new Set();
  for (const m of src.matchAll(urlRe)) {
    const u = m[0].replace(/["'`;)\]\\]+$/, '');
    if (u.includes('redfox.hk') && u.includes('/api/')) urls.add(u);
  }
  // 判断 method：优先看 Request(..., method="POST")，其次默认 POST（这些脚本基本全是 POST）
  for (const u of urls) {
    let method = 'POST';
    // 找到离 URL 最近的 method 声明
    const idx = src.indexOf(u);
    const near = src.slice(Math.max(0, idx), Math.min(src.length, idx + 300));
    const mm = near.match(/method\s*=\s*["'](GET|POST|PUT|DELETE)["']/i);
    if (mm) method = mm[1].toUpperCase();
    // GET 风格的 URL 带 query 参数
    if (/\?[A-Za-z]/.test(u.split('#')[0]) && !mm) method = 'GET';
    eps.push({ url: u, method });
  }
  return eps;
}

/** 提取请求头 */
function extractHeaders(src) {
  const hdrs = new Set();
  const re = /["'](X-API-KEY|REDFOX_API_KEY|api_key|apiKey|X-API-Key)["']\s*:/gi;
  for (const m of src.matchAll(re)) hdrs.add(m[1].toUpperCase());
  return [...hdrs];
}

/** 提取 argparse 参数名与默认值 */
function extractArgs(src) {
  const args = [];
  const re = /add_argument\(\s*["']--?([\w-]+)["'](?:[\s\S]*?default=([^,\)]+))?/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    args.push({ name: m[1], default: m[2] ? m[2].trim().replace(/["']/g, '') : undefined });
  }
  return args;
}

// ============ 主流程 ============

function survey() {
  const manifest = { version: '1.0.0', generatedAt: new Date().toISOString(), tools: [] };
  const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name).sort();

  for (const dir of dirs) {
    const skillDir = path.join(SKILLS_DIR, dir);
    let description = '';
    let name = dir;
    const skillMd = path.join(skillDir, 'SKILL.md');
    if (fs.existsSync(skillMd)) {
      const fm = parseFrontmatter(fs.readFileSync(skillMd, 'utf-8'));
      name = fm.name || dir;
      description = (fm.description || '').slice(0, 200);
    }

    const scriptsDir = path.join(skillDir, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      manifest.tools.push({ name: dir, description, skillDir: dir, status: 'no-scripts' });
      continue;
    }

    const pyFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.py'));
    const scriptsInfo = [];
    let primary = null;

    for (const py of pyFiles) {
      const src = fs.readFileSync(path.join(scriptsDir, py), 'utf-8');
      const eps = extractEndpoints(src);
      const hdrs = extractHeaders(src);
      const keys = extractPayloadKeys(src);
      const args = extractArgs(src);
      const info = { file: py, endpoints: eps, headers: hdrs, payloadKeys: keys, args };
      scriptsInfo.push(info);
      // 主脚本：优先选有端点的、名字最像主入口的
      if (eps.length > 0 && !primary) primary = info;
      if (eps.length > 0 && (py.includes('fetch') || py.includes('search') || py.includes('query') || py.includes('main') || py.includes('get') || py.includes('crawl') || py.includes('extract') || py.includes('submit')) && !primary.file.includes('generate') && !primary.file.includes('html')) primary = info;
    }

    if (primary && primary.endpoints.length > 0) {
      // 过滤掉 settings 等非 API 链接
      const eps = primary.endpoints.filter(e => !e.url.includes('/settings/') && !e.url.includes('/login') && !e.url.includes('redfox.hk?') && !/^https?:\/\/redfox\.hk\/?$/.test(e.url));
      if (eps.length > 0) {
        manifest.tools.push({
          name: dir, description, skillDir: dir, status: 'api',
          api: {
            script: primary.file,
            endpoint: eps[0].url,
            method: eps[0].method,
            headers: primary.headers,
            payloadKeys: primary.payloadKeys,
            args: primary.args,
            allEndpoints: eps.map(e => e.url),
          }
        });
        continue;
      }
    }

    // 有脚本但提取不到端点
    manifest.tools.push({
      name: dir, description, skillDir: dir, status: 'api-unknown',
      scripts: scriptsInfo.map(s => ({ file: s.file, headers: s.headers, payloadKeys: s.payloadKeys, args: s.args }))
    });
  }

  fs.writeFileSync(path.join(__dirname, 'tools-manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  const apiCount = manifest.tools.filter(t => t.status === 'api').length;
  console.log(`Done: ${manifest.tools.length} tools, ${apiCount} with API endpoints -> tools-manifest.json`);
}

survey();
