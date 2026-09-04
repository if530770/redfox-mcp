/**
 * verify-packages.js — 单平台 MCP 子包全量接口验证
 *
 * 单平台子包（redfox-mcp-server-wechat / -xiaohongshu / -douyin / -bilibili /
 * -kuaishou / -weibo / -overseas / -ai）自身仅做「依赖主包 buildAllTools() +
 * 前缀过滤」，接口正确性完全取决于主包工具定义。因此验证某个单平台 =
 * 用假 key 全量调用该前缀下每个工具的真实 handler 链路：
 *   ✅ code=3107 (API Key无效)  → 请求构造正确：URL/方法/参数已过后端校验，只卡 Key
 *   🟡 HTTP 401/403/400        → 路径与方法存在，被 HTTP 层拦截（400 需人工复核参数）
 *   ❌ code=500 (请求异常)      → 接口形状错误（POST 误用 / 字段不对 / 默认值不合法）
 *   ❌ HTTP 404 / 网络/超时      → 路径不存在或服务异常
 *
 * 用法: node scripts/verify-packages.js                  # 8 个单平台包全量
 *       node scripts/verify-packages.js --only wechat    # 只跑指定包（包名关键词）
 */
'use strict';

process.env.REDFOX_API_KEY = 'ak_test_fake';
const { buildAllTools } = require('../src/build-tools.js');
const { overrides } = require('../src/overrides.js');

/** 8 个单平台 npm 包：包名、展示名、工具名前缀（overseas/ai-tools 为多前缀） */
const PACKAGES = [
  { name: 'redfox-mcp-server-wechat',     label: '公众号',                            prefixes: ['wechat'] },
  { name: 'redfox-mcp-server-xiaohongshu', label: '小红书',                            prefixes: ['xiaohongshu'] },
  { name: 'redfox-mcp-server-douyin',     label: '抖音',                              prefixes: ['douyin'] },
  { name: 'redfox-mcp-server-bilibili',   label: 'B站',                               prefixes: ['bilibili'] },
  { name: 'redfox-mcp-server-kuaishou',   label: '快手',                              prefixes: ['kuaishou'] },
  { name: 'redfox-mcp-server-weibo',      label: '微博',                              prefixes: ['weibo'] },
  { name: 'redfox-mcp-server-overseas',   label: '海外(YouTube/X/TikTok/Instagram)',  prefixes: ['youtube', 'twitter', 'tiktok', 'instagram'] },
  { name: 'redfox-mcp-server-ai',         label: 'AI工具(DeepSeek/豆包/Kimi/Seedance/图片/视频)', prefixes: ['deepseek', 'doubao', 'kimi', 'seedance', 'visual', 'video'] },
];

/** 各平台下载类 url 参数的合法格式样例（链接无需真实存在，仅格式过参数校验） */
const URL_SAMPLE = {
  bilibili: 'https://www.bilibili.com/video/BV1GJ411x7h7',
  youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  twitter: 'https://twitter.com/redfox/status/1234567890123456789',
  tiktok: 'https://www.tiktok.com/@test/video/1234567890123456789',
  instagram: 'https://www.instagram.com/reel/AbCdEfGh123/',
  douyin: 'https://www.douyin.com/video/1234567890123456',
  xiaohongshu: 'https://www.xiaohongshu.com/explore/1234567890abcdef123456',
  wechat: 'https://mp.weixin.qq.com/s/AbCdEfGh1234567890',
  generic: 'https://example.com/video/123',
};

/** 按工具名前缀匹配 url 样例 */
function urlSampleFor(toolName) {
  for (const p of Object.keys(URL_SAMPLE)) {
    if (toolName.startsWith(p + '-')) return URL_SAMPLE[p];
  }
  return URL_SAMPLE.generic;
}

/** 字符串参数样例（按参数名启发式） */
function strSample(key, toolName) {
  if (/url|link|href/i.test(key)) return urlSampleFor(toolName);
  if (/^endDate|^end_date|endTime/i.test(key)) return '2026-09-02';
  if (/date|time|day/i.test(key) && !/every|interval/i.test(key)) return '2026-09-01';
  if (/keyword|query|search|topic|theme|subject|question|inquiry/i.test(key)) return 'AI';
  if (/prompt|content|text|desc|title|msg|comment|remark/i.test(key)) return '测试文案';
  if (/category|type|tag/i.test(key)) return '综合全部';
  if (/^(id|uid|userId|accountId|noteId|articleId|videoId|taskId|commentId|postId|urlId)$/i.test(key)) return '123456789';
  if (/account|author|name|user|owner/i.test(key)) return '测试';
  if (/code|token|password|secret/i.test(key)) return 'test';
  return 'AI';
}

/** 数字参数样例 */
function numSample(key) {
  if (/page|offset|batch|seed|num/i.test(key)) return 1;
  if (/limit|size|count|top|max/i.test(key)) return 20;
  if (/days|duration/i.test(key)) return 1;
  if (/year/i.test(key)) return 2026;
  if (/month/i.test(key)) return 9;
  return 1;
}

/** 为工具生成一组「合法最小参数」：default 优先 → enum 首值 → required/URL 占位符启发式 */
function buildArgs(t) {
  const props = t.inputSchema.properties || {};
  const args = {};
  for (const [k, v] of Object.entries(props)) {
    if (v.default !== undefined) args[k] = v.default;
  }

  // URL 模板占位符视为必填（如 ...?rankDate={rankDate}）
  const ov = overrides[t.name] || {};
  const endpoint = `${ov.endpoint || ''}${ov.resultUrl || ''}`;
  const need = new Set(t.inputSchema.required || []);
  for (const m of endpoint.matchAll(/\{(\w+)\}/g)) need.add(m[1]);

  for (const key of need) {
    if (args[key] !== undefined) continue;
    const prop = props[key] || {};
    if (prop.enum && prop.enum.length) { args[key] = prop.enum[0]; continue; }
    if (prop.type === 'number') { args[key] = numSample(key); continue; }
    if (prop.type === 'boolean') { args[key] = true; continue; }
    args[key] = strSample(key, t.name);
  }
  return args;
}

/** 把 handler 抛错/返回映射为判定 */
function classify(t, r, e) {
  if (e) {
    const status = e.details && typeof e.details === 'object' ? e.details.status : undefined;
    const biz = e.details && typeof e.details === 'object' ? e.details.code : undefined;
    if (e.code === 'BIZ_ERROR') {
      if (biz === 3107) return { pass: true, tag: 'code=3107(API Key无效)' };
      return { pass: false, tag: `code=${biz}` };
    }
    if (e.code === 'HTTP_ERROR') {
      if (status === 404) return { pass: false, tag: 'HTTP 404(路径不存在)' };
      return { pass: true, tag: `HTTP ${status}(路径存在,需人工复核参数)` };
    }
    if (e.code === 'MISSING_URL_PARAM') return { pass: false, tag: '缺少URL参数(样例生成不全)' };
    return { pass: false, tag: `${e.code || 'THROW'}: ${String(e.message).slice(0, 80)}` };
  }
  // 意外成功：假 key 不应返回数据；若有返回说明该接口未鉴权，人工复核
  return { pass: false, tag: '意外返回数据(未走鉴权?)' };
}

async function main() {
  const { tools, skipped } = buildAllTools();
  const onlyIdx = process.argv.indexOf('--only');
  let onlyVal = null;
  if (onlyIdx !== -1) onlyVal = process.argv[onlyIdx + 1];
  else {
    const eq = process.argv.find(a => a.startsWith('--only='));
    if (eq) onlyVal = eq.slice('--only='.length);
  }
  const filterSet = onlyVal ? new Set(onlyVal.split(',').map(s => s.trim())) : null;
  const targets = PACKAGES.filter(p => !filterSet || filterSet.has(p.name) || filterSet.has(p.label) || p.prefixes.some(x => filterSet.has(x)));

  console.log(`工具总数: ${tools.length} | 跳过: ${skipped.length} (${skipped.map(s => s.name).join(',') || '-'})`);
  console.log(`待验证单平台包: ${targets.length} 个\n`);

  let totalPass = 0, totalFail = 0;
  const failList = [];
  const timeout = (ms, p) => new Promise((res, rej) => { const tt = setTimeout(() => rej(new Error('超时')), ms); p.then(res, rej).finally(() => clearTimeout(tt)); });

  for (const pkg of targets) {
    const pkgTools = tools.filter(t => pkg.prefixes.some(pf => t.name.startsWith(pf + '-')));
    const pkgSkipped = skipped.filter(s => pkg.prefixes.some(pf => s.name.startsWith(pf + '-')));
    console.log(`========== ${pkg.name}（${pkg.label}）· ${pkgTools.length} 个工具 ==========`);
    if (pkgSkipped.length) console.log(`  ⚠ 构建跳过: ${pkgSkipped.map(s => `${s.name}(${s.reason})`).join(', ')}`);

    let pass = 0, fail = 0;
    for (const t of pkgTools) {
      let args = {};
      try { args = buildArgs(t); } catch { /* 忽略 */ }
      try {
        const r = await timeout(20000, t.handler(args));
        const v = classify(t, r, null);
        v.pass ? pass++ : fail++;
        if (!v.pass) failList.push({ pkg: pkg.name, tool: t.name, tag: v.tag, args });
        console.log(`  [${v.pass ? 'PASS' : 'FAIL'}] ${t.name} → ${v.tag}`);
      } catch (e) {
        const v = classify(t, null, e);
        v.pass ? pass++ : fail++;
        if (!v.pass) failList.push({ pkg: pkg.name, tool: t.name, tag: v.tag, args });
        console.log(`  [${v.pass ? 'PASS' : 'FAIL'}] ${t.name} → ${v.tag}`);
      }
    }
    totalPass += pass; totalFail += fail;
    console.log(`  → 通过 ${pass} / 失败 ${fail}\n`);
  }

  console.log('==================== 汇总 ====================');
  console.log(`✅ 接口构造正确: ${totalPass} | ❌ 异常: ${totalFail}`);
  if (failList.length) {
    console.log('\n---------------- ❌ 异常明细（需修复或人工复核） ----------------');
    for (const f of failList) console.log(`  [${f.pkg}] ${f.tool} → ${f.tag}`);
  }
}

main().catch(e => { console.error('执行失败:', e.message); process.exit(1); });
