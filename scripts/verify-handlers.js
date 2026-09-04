// verify-handlers.js — 用假 key 经真实 handler 链路回归验证榜单/AI 搜索类工具：
// 预期 code=3107(API Key无效) 而非 code=500(请求异常)。覆盖 GET query、URL 模板、异步两步式构造。
process.env.REDFOX_API_KEY = 'ak_test_fake';
const { buildAllTools } = require('../src/build-tools.js');

const CASES = {
  'douyin-hot-trend': {},
  'wechat-fastest-growing': { rankDate: 'yesterday' },
  'wechat-title': { keyword: 'AI' },
  'wechat-top-account': {},
  'wechat-top-account-week': { rankType: 'week' },
  'xiaohongshu-dailytop': { rankDate: '2026-09-01' },
  'xiaohongshu-cover': { keyword: '美妆' },
  'xiaohongshu-title': { keyword: '美妆' },
  'xiaohongshu-title-score': { keyword: '美妆' },
  'xiaohongshu-note-analyzer': { keyword: '美妆' },
  'xiaohongshu-weeklytop': { rankDate: '2026-09-01' },
};

(async () => {
  const { tools, skipped } = buildAllTools();
  console.log('工具总数:', tools.length, '| 跳过:', skipped.length, skipped.map(s => s.name).join(',') || '-');
  for (const [label, args] of Object.entries(CASES)) {
    const realName = label.startsWith('wechat-top-account-week') ? 'wechat-top-account' : label;
    const t = tools.find(x => x.name === realName);
    try {
      const r = await t.handler(args);
      console.log(`[${label}] 返回(意外):`, JSON.stringify(r).slice(0, 160));
    } catch (e) {
      const code = e.code || e.message;
      console.log(`[${label}] -> ${e.code ? e.code : ''} code=${(e.details && e.details.code) || ''} ${String(e.message).slice(0, 90)}`);
    }
  }
})();
