/**
 * 人工校正层（Overrides）
 * 对自动提取的工具定义进行精确校正：
 * - 修正 payload 字段映射
 * - 补充缺失参数
 * - 标记异步任务类工具（提交 + 轮询）
 * - 过滤无意义的内部字段
 *
 * 每条 override 会合并到自动提取的 manifest 定义上。
 */
'use strict';

const BASE = 'https://redfox.hk';

/**
 * override 结构：
 * {
 *   name,               // skill 目录名（匹配 key）
 *   description,        // 可选：覆盖描述
 *   params: {           // 公开参数：name -> { type, required, description, default, enum }
 *   },
 *   payload: (args) => ({...}),  // 构建 payload 的函数
 *   async: true,        // 异步任务：自动提交 + 轮询
 *   submitUrl, resultUrl, taskIdField, pollIntervalMs, pollMaxAttempts,
 *   note: '...',        // 备注
 * }
 */
const overrides = {
  // ==================== 视频下载系列 ====================
  'bilibili-video-downloader': {
    description: '根据视频链接下载B站视频，返回视频地址',
    params: {
      url: { type: 'string', required: true, description: 'B站视频链接（如 https://www.bilibili.com/video/BVxxxx）' },
    },
    payload: (a) => ({ url: a.url, source: SOURCE }),
  },
  'instagram-video-downloader': {
    description: '根据视频链接下载Instagram视频',
    params: { url: { type: 'string', required: true, description: 'Instagram视频链接' } },
    payload: (a) => ({ url: a.url, source: SOURCE }),
  },
  'tiktok-video-downloader': {
    description: '根据视频链接下载TikTok视频',
    params: { url: { type: 'string', required: true, description: 'TikTok视频链接' } },
    payload: (a) => ({ url: a.url, source: SOURCE }),
  },
  'twitter-video-downloader': {
    description: '根据推文链接下载X(Twitter)视频',
    params: { url: { type: 'string', required: true, description: 'X(Twitter)推文链接' } },
    payload: (a) => ({ url: a.url, source: SOURCE }),
  },
  'youtube-video-downloader': {
    description: '根据视频链接下载YouTube视频',
    params: { url: { type: 'string', required: true, description: 'YouTube视频链接' } },
    payload: (a) => ({ url: a.url, source: SOURCE }),
  },
  'xiaohongshu-video-downloader': {
    description: '根据笔记链接下载小红书视频',
    params: { url: { type: 'string', required: true, description: '小红书笔记链接' } },
    payload: (a) => ({ url: a.url, source: SOURCE }),
  },
  'wechat-video-downloader': {
    description: '根据链接下载视频号视频',
    params: { url: { type: 'string', required: true, description: '视频号链接' } },
    payload: (a) => ({ url: a.url, source: SOURCE }),
  },

  // ==================== 异步任务类 ====================
  'seedance-video-gen': {
    description: 'AI视频生成工具，基于豆包 Seedance 2.0 模型，输入文字提示词生成视频（自动等待任务完成并返回视频链接）',
    params: {
      prompt: { type: 'string', required: true, description: '视频内容描述提示词' },
      resolution: { type: 'string', default: '720p', enum: ['480p', '720p', '1080p'], description: '分辨率' },
      ratio: { type: 'string', default: '16:9', enum: ['16:9', '9:16', '1:1'], description: '画面比例' },
      duration: { type: 'number', default: 5, enum: [5, 10], description: '视频时长（秒）' },
      seed: { type: 'number', default: -1, description: '随机种子，-1为随机' },
      watermark: { type: 'boolean', default: true, description: '是否带水印' },
      generateAudio: { type: 'boolean', default: true, description: '是否生成音频' },
      returnLastFrame: { type: 'boolean', default: false, description: '是否返回最后一帧图片' },
      imageUrl: { type: 'string', description: '参考图片URL（图生视频）' },
    },
    payload: (a) => {
      const content = [{ type: 'text', text: a.prompt }];
      if (a.imageUrl) content.push({ type: 'image_url', image_url: { url: a.imageUrl } });
      return {
        content,
        model: 'doubao-seedance-2-0-260128',
        resolution: a.resolution,
        ratio: a.ratio,
        duration: a.duration,
        seed: a.seed,
        watermark: a.watermark,
        generateAudio: a.generateAudio,
        returnLastFrame: a.returnLastFrame,
        source: SOURCE,
      };
    },
    async: true,
    submitUrl: BASE + '/story/api/parseWork/videoGen/submit',
    resultUrl: BASE + '/story/api/parseWork/videoGen/result',
    taskIdField: 'data.taskId',
    pollIntervalMs: 5000,
    pollMaxAttempts: 60,
  },
  'visual-ops-writer': {
    description: 'AI图片生成工具（视觉运营文案配图），提交文字提示词生成图片，支持参考图、批量风格（自动等待任务完成）',
    params: {
      prompt: { type: 'string', required: true, description: '图片内容描述提示词' },
      style: { type: 'string', default: 'redfox', enum: ['redfox', 'popcomic', 'yellowcomic', 'reference', 'none', 'random'], description: '生成风格：redfox=红狐视觉风格, popcomic=流行漫画, yellowcomic=黄漫, reference=参考图风格, none=无风格' },
      size: { type: 'string', default: '1792x1024', description: '图片尺寸，如 1024x1024 / 1792x1024 / 1024x1792 等' },
      referenceImage: { type: 'string', description: '参考图片URL（style=reference 时使用）' },
    },
    payload: (a) => ({ prompt: a.prompt, style: a.style, size: a.size, referenceImage: a.referenceImage, source: SOURCE }),
    async: true,
    submitUrl: BASE + '/story/api/parseWork/imageGen/submitSkill',
    resultUrl: BASE + '/story/api/parseWork/imageGen/result',
    taskIdField: 'data.taskId',
    pollIntervalMs: 5000,
    pollMaxAttempts: 60,
  },
  'kuaishou-video-extract': {
    description: '快手视频文案提取（视频转文字），提交视频链接自动提取文案',
    params: { url: { type: 'string', required: true, description: '快手视频链接' } },
    payload: (a) => ({ url: a.url, source: SOURCE }),
    async: true,
    submitUrl: BASE + '/story/api/parseWork/audioTextExtract/submit/kuaishou',
    resultUrl: BASE + '/story/api/parseWork/audioTextExtract/result/kuaishou',
    taskIdField: 'data.taskId',
    pollIntervalMs: 4000,
    pollMaxAttempts: 45,
  },
  'bilibili-comment': {
    description: '获取B站视频评论，异步任务自动轮询结果',
    params: {
      url: { type: 'string', required: true, description: 'B站视频链接或BV号' },
      sortType: { type: 'string', default: '2', enum: ['2', '1'], description: '排序：2=按热度, 1=按时间' },
      dataNum: { type: 'number', default: 20, description: '获取评论数量' },
      offset: { type: 'string', description: '分页游标' },
    },
    payload: (a) => {
      // 真实提交字段为 opusId（BV号）+ 字符串化分页参数（对齐 bili_comment_search.py）
      const raw = String(a.url || '');
      const bv = raw.match(/BV[0-9A-Za-z]+/);
      return {
        opusId: bv ? bv[0] : raw,
        sortType: a.sortType || '2',
        dataNum: String(a.dataNum ?? 20),
        offset: String(a.offset || '0'),
        source: SOURCE,
      };
    },
    async: true,
    submitUrl: BASE + '/story/api/bili/commentSubmit',
    resultUrl: BASE + '/story/api/bili/commentResult',
    taskIdField: 'data.taskId',
    pollIntervalMs: 4000,
    pollMaxAttempts: 45,
  },

  // ==================== 平台搜索/查询类校正 ====================
  'douyin-search': {
    description: '抖音作品查询工具。根据关键词搜索抖音热门爆款作品，支持按日期范围筛选',
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词，空字符串查询全站热门' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
      pageNum: { type: 'number', default: 1, description: '页码' },
      pageSize: { type: 'number', default: 50, description: '每页数量（最大50）' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE, pageNum: a.pageNum || 1, pageSize: a.pageSize || 50 };
      if (a.startDate) p.startDate = a.startDate;
      if (a.endDate) p.endDate = a.endDate;
      return p;
    },
  },
  'douyin-similar-account': {
    description: '查询抖音相似账号，根据账号ID或名称匹配对标账号',
    params: {
      accountId: { type: 'string', description: '抖音账号ID' },
      accountName: { type: 'string', description: '抖音账号名称' },
    },
    payload: (a) => {
      const p = { source: SOURCE };
      if (a.accountId) p.accountId = a.accountId;
      if (a.accountName) p.accountName = a.accountName;
      return p;
    },
  },
  'douyin-account-diagnosis': {
    description: '抖音账号诊断工具，根据账号ID查询账号数据并生成诊断报告',
    params: {
      accountId: { type: 'string', required: true, description: '抖音账号ID' },
    },
    payload: (a) => ({ accountId: a.accountId, source: SOURCE }),
  },
  'douyin-hot-trend': {
    description: '抖音热点趋势查询，不填日期返回实时热榜，可查询指定时间段的热门话题',
    params: {
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD（不填为实时榜）' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD（不填为实时榜）' },
    },
    endpoint: 'https://redfox.hk/story/api/hotSpot/getListByPlatform',
    method: 'GET',
    payload: (a) => {
      const p = { platform: 2, source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      if (a.endDate) p.endDate = a.endDate;
      return p;
    },
  },
  'douyin-content-surge': {
    description: '抖音内容突增榜，查询互动数据突增的爆款内容',
    params: {
      type: { type: 'string', default: '1', description: '榜单类型：1=突增榜, 2=周突增榜' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
    },
    payload: (a) => {
      const p = { type: a.type || '1', source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      return p;
    },
  },
  'douyin-weekly-surge': {
    description: '抖音周突增榜，查询本周互动数据突增的爆款内容',
    params: {
      type: { type: 'string', default: '2', description: '榜单类型' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
    },
    payload: (a) => {
      const p = { type: a.type || '2', source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      return p;
    },
  },
  'douyin-daily-hot': {
    description: '抖音每日爆款榜，查询每日点赞排行最高的作品',
    params: {
      type: { type: 'string', default: '1', description: '榜单类型' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
    },
    payload: (a) => {
      const p = { type: a.type || '1', source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      if (a.endDate) p.endDate = a.endDate;
      return p;
    },
  },
  'douyin-rise-ranking': {
    description: '抖音涨粉榜，查询指定日期的账号涨粉排行',
    params: {
      dateType: { type: 'string', default: '1', description: '日期类型：1=日榜, 2=周榜' },
      rankDate: { type: 'string', required: true, description: '榜单日期 YYYY-MM-DD' },
      category: { type: 'string', description: '分类' },
    },
    payload: (a) => {
      const p = { dateType: a.dateType || '1', rankDate: a.rankDate, source: SOURCE };
      if (a.category) p.category = a.category;
      return p;
    },
  },
  'douyin-top-account': {
    description: '抖音头部账号榜，查询抖音最具影响力账号排行',
    params: {
      dateType: { type: 'string', default: '1', description: '日期类型：1=日榜, 2=周榜' },
      rankDate: { type: 'string', required: true, description: '榜单日期 YYYY-MM-DD' },
      type: { type: 'string', description: '榜单类型' },
    },
    payload: (a) => {
      const p = { dateType: a.dateType || '1', rankDate: a.rankDate, source: SOURCE };
      if (a.type) p.type = a.type;
      return p;
    },
  },
  'trending-hub': {
    description: '全网热点聚合查询，按平台和关键词获取热门话题',
    params: {
      platform: { type: 'string', default: 'douyin', description: '平台：douyin/xiaohongshu/weibo 等' },
      keywords: { type: 'string', description: '关键词（逗号分隔）' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
    },
    payload: (a) => {
      const p = { platform: a.platform || 'douyin', source: SOURCE };
      if (a.keywords) p.keywords = a.keywords.split(',').map(s => s.trim()).filter(Boolean);
      if (a.startDate) p.startDate = a.startDate;
      if (a.endDate) p.endDate = a.endDate;
      return p;
    },
  },
  'trending-hub-top10': {
    description: '全网热搜关键词 TOP10 查询',
    params: {
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
    },
    payload: (a) => {
      const p = { source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      if (a.endDate) p.endDate = a.endDate;
      return p;
    },
  },

  // ==================== 多平台搜索 ====================
  'cn-last30days': {
    description: '全网多平台近30天内容搜索，按关键词跨平台查询爆款内容',
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词' },
      platforms: { type: 'string', description: '平台列表（逗号分隔），如 douyin,xiaohongshu,gongzhonghao' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.platforms) p.platforms = a.platforms.split(',').map(s => s.trim()).filter(Boolean);
      if (a.startDate) p.startDate = a.startDate;
      if (a.endDate) p.endDate = a.endDate;
      return p;
    },
  },
  'stock-feed': {
    description: '股票内容资讯查询，跨平台搜索股票相关爆款内容',
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词（如股票代码或名称）' },
      platforms: { type: 'string', description: '平台列表（逗号分隔）' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.platforms) p.platforms = a.platforms.split(',').map(s => s.trim()).filter(Boolean);
      if (a.startDate) p.startDate = a.startDate;
      if (a.endDate) p.endDate = a.endDate;
      return p;
    },
  },

  // ==================== AI 搜索（两步异步：提交 + 轮询） ====================
  'deepseek-websearch': {
    description: 'DeepSeek AI 联网搜索，输入问题返回AI搜索结果',
    params: { inquiryText: { type: 'string', required: true, description: '搜索问题' } },
    payload: (a) => ({ inquiryText: a.inquiryText, source: SOURCE }),
    async: true,
    submitUrl: 'https://redfox.hk/story/api/deepSearch/dsSubmit',
    resultUrl: 'https://redfox.hk/story/api/deepSearch/dsResult',
    taskIdField: 'data.taskId',
    pollIntervalMs: 5000,
    pollMaxAttempts: 60,
  },
  'doubao-websearch': {
    description: '豆包 AI 联网搜索，输入问题返回AI搜索结果',
    params: { inquiryText: { type: 'string', required: true, description: '搜索问题' } },
    payload: (a) => ({ inquiry_text: a.inquiryText, source: SOURCE }),
    async: true,
    submitUrl: 'https://redfox.hk/story/api/doubaoSearch/submit',
    resultUrl: 'https://redfox.hk/story/api/doubaoSearch/result',
    taskIdField: 'data.taskId',
    pollIntervalMs: 5000,
    pollMaxAttempts: 60,
  },
  'kimi-websearch': {
    description: 'Kimi AI 联网搜索，输入问题返回AI搜索结果',
    params: { inquiryText: { type: 'string', required: true, description: '搜索问题' } },
    payload: (a) => ({ inquiry_text: a.inquiryText, source: SOURCE }),
    async: true,
    submitUrl: 'https://redfox.hk/story/api/kimi/submit',
    resultUrl: 'https://redfox.hk/story/api/kimi/result',
    taskIdField: 'data.taskId',
    pollIntervalMs: 5000,
    pollMaxAttempts: 60,
  },

  // ==================== 违禁词检测 ====================
  'multi-wordcheck': {
    description: '多平台违禁词检测，检查文案中的敏感词并返回检测结果',
    params: {
      content: { type: 'string', required: true, description: '待检测文案内容' },
      platform: { type: 'string', default: 'xiaohongshu', enum: ['xiaohongshu', 'douyin', 'wechat', 'bilibili', 'kuaishou'], description: '目标平台' },
    },
    payload: (a) => ({ content: a.content, platform: a.platform || 'xiaohongshu', source: SOURCE }),
  },
  'wechat-prohibited-word': {
    description: '公众号违禁词检测，检查文案中的敏感表述',
    params: { content: { type: 'string', required: true, description: '待检测文案内容' } },
    payload: (a) => ({ content: a.content, platform: 'wechat', source: SOURCE }),
  },
  'xiaohongshu-prohibited-word': {
    description: '小红书违禁词检测，检查笔记文案中的违规词',
    params: { content: { type: 'string', required: true, description: '待检测文案内容' } },
    payload: (a) => ({ content: a.content, platform: 'xiaohongshu', source: SOURCE }),
  },
  'douyin-prohibited-word': {
    description: '抖音违禁词检测，检查文案中的敏感词',
    params: { content: { type: 'string', required: true, description: '待检测文案内容' } },
    payload: (a) => ({ content: a.content, platform: 'douyin', source: SOURCE }),
  },

  // ==================== 平台信息类校正 ====================
  'toutiao-search': {
    description: '今日头条作品搜索，按关键词查询头条爆款内容',
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词' },
      offset: { type: 'number', default: 0, description: '偏移量' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, offset: a.offset || 0, source: SOURCE };
      return p;
    },
  },
  'wechat-search': {
    description: '公众号文章搜索，按关键词搜索公众号爆款文章',
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      maxItems: { type: 'number', default: 10, description: '返回数量' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      if (a.maxItems) p.maxItems = a.maxItems;
      return p;
    },
  },
  'wechat-write': {
    description: '公众号爆款文章写作参考，基于关键词查询同赛道爆款文章供创作参考',
    params: {
      keyword: { type: 'string', required: true, description: '创作方向关键词' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      maxItems: { type: 'number', default: 10, description: '返回数量' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      if (a.maxItems) p.maxItems = a.maxItems;
      return p;
    },
  },
  'wechat-cover': {
    description: '公众号爆款封面参考，查询同赛道爆款文章获取封面设计参考',
    params: {
      keyword: { type: 'string', required: true, description: '赛道关键词' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      maxItems: { type: 'number', default: 10, description: '返回数量' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      if (a.maxItems) p.maxItems = a.maxItems;
      return p;
    },
  },
  'xiaohongshu-search': {
    description: '小红书笔记搜索，根据关键词获取爆款笔记数据',
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词，空字符串查询全站热门' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
      pageNum: { type: 'number', default: 1, description: '页码' },
      pageSize: { type: 'number', default: 50, description: '每页数量（最大50）' },
    },
    payload: (a) => ({
      keyword: a.keyword, pageNum: a.pageNum || 1, pageSize: a.pageSize || 50,
      startDate: a.startDate || '', endDate: a.endDate || '', source: SOURCE,
    }),
  },
  'xiaohongshu-write': {
    description: '小红书笔记创作数据支撑，基于关键词查询同赛道爆款笔记供创作参考',
    params: {
      keyword: { type: 'string', required: true, description: '创作方向关键词' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
    },
    payload: (a) => ({
      keyword: a.keyword, pageNum: 1, pageSize: 50,
      startDate: a.startDate || '', endDate: a.endDate || '', source: SOURCE,
    }),
  },
  'xiaohongshu-title': {
    description: '小红书爆款标题生成参考，按关键词查询同赛道近30天爆款笔记标题规律',
    params: {
      keyword: { type: 'string', required: true, description: '赛道关键词' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD（最近30天内）' },
    },
    endpoint: 'https://redfox.hk/story/api/cozeSkill/getXhsCozeSkillData',
    method: 'GET',
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      return p;
    },
  },
  'xiaohongshu-title-score': {
    description: '小红书标题评分参考，按关键词查询同赛道近30天爆款标题数据用于评分',
    params: {
      keyword: { type: 'string', required: true, description: '赛道关键词' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD（最近30天内）' },
    },
    endpoint: 'https://redfox.hk/story/api/cozeSkill/getXhsCozeSkillData',
    method: 'GET',
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      return p;
    },
  },
  'xiaohongshu-cover': {
    description: '小红书爆款封面设计参考，按关键词查询同赛道近30天爆款笔记，获取封面视觉规律',
    params: {
      keyword: { type: 'string', required: true, description: '赛道关键词' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD（最近30天内）' },
    },
    endpoint: 'https://redfox.hk/story/api/cozeSkill/getXhsCozeSkillData',
    method: 'GET',
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      return p;
    },
  },
  'xiaohongshu-note-analyzer': {
    description: '小红书笔记优化助手数据查询，按关键词查询同赛道近30天爆款笔记用于文案评分对比',
    params: {
      keyword: { type: 'string', required: true, description: '文案主题关键词' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD（最近30天内）' },
    },
    endpoint: 'https://redfox.hk/story/api/cozeSkill/getXhsCozeSkillData',
    method: 'GET',
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.startDate) p.startDate = a.startDate;
      return p;
    },
  },
  'xiaohongshu-dailytop': {
    description: '小红书每日爆款笔记 TOP50，查询指定日期的日榜（每日19:00更新昨日数据）',
    params: {
      rankDate: { type: 'string', required: true, description: '榜单日期 YYYY-MM-DD（最近30天）' },
      category: { type: 'string', default: '综合全部', description: '分类（默认：综合全部）' },
    },
    endpoint: 'https://redfox.hk/story/api/cozeSkill/getXhsCozeSkillDataOne',
    method: 'GET',
    payload: (a) => {
      const p = { rankDate: a.rankDate, source: SOURCE, category: a.category || '综合全部' };
      return p;
    },
  },
  'xiaohongshu-weeklytop': {
    description: '小红书七日爆款笔记，查询指定日期的七日爆款榜单',
    params: {
      rankDate: { type: 'string', required: true, description: '榜单日期 YYYY-MM-DD' },
      category: { type: 'string', default: '综合全部', description: '分类（默认：综合全部）' },
    },
    endpoint: 'https://redfox.hk/story/api/cozeSkill/getXhsCozeSkillDataSeven?rankDate={rankDate}&source={source}&category={category}',
    method: 'GET',
    payload: (a) => {
      const p = { rankDate: a.rankDate, source: SOURCE, category: a.category || '综合全部' };
      return p;
    },
  },
  'xiaohongshu-top-account': {
    description: '小红书头部账号榜，查询最具影响力的小红书账号',
    params: {
      dateType: { type: 'string', default: '1', description: '日期类型：1=日榜, 2=周榜' },
      rankDate: { type: 'string', required: true, description: '榜单日期 YYYY-MM-DD' },
      type: { type: 'string', description: '榜单类型' },
    },
    payload: (a) => {
      const p = { dateType: a.dateType || '1', rankDate: a.rankDate, source: SOURCE };
      if (a.type) p.type = a.type;
      return p;
    },
  },
  'wechat-top-account': {
    description: '公众号综合实力账号榜，按榜单类型与日期查询头部账号（日榜限近7天/周榜限近3周/月榜限近3月）',
    params: {
      rankType: { type: 'string', default: 'day', enum: ['day', 'week', 'month'], description: '榜单类型：day=日榜(每日17:30更新昨日) week=周榜(周一更新上周) month=月榜(每月3号更新上月)' },
      rankDate: { type: 'string', description: '榜单日期 YYYY-MM-DD；不填自动取该类型最近可用日期' },
      category: { type: 'string', default: '总排名', description: '分类（默认：总排名；可选 科技数码/健康养生 等23个标准分类）' },
    },
    endpoint: 'https://redfox.hk/story/api/cozeSkill/getGzhCozeSkillDataIndex',
    method: 'GET',
    payload: (a) => {
      const rankType = a.rankType || 'day';
      const p = { rankType, source: SOURCE, category: a.category || '总排名' };
      if (a.rankDate) {
        const fmt = /^\d{4}-\d{2}-\d{2}$/;
        if (!fmt.test(a.rankDate)) {
          throw new Error('rankDate 格式错误，请使用 YYYY-MM-DD');
        }
        p.rankDate = a.rankDate;
      } else {
        p.rankDate = latestGzhRankDate(rankType);
      }
      return p;
    },
  },
  'wechat-fastest-growing': {
    description: '公众号阅读增长最快账号榜，按日期查询（每日更新，仅支持最近30天）',
    params: {
      rankDate: { type: 'string', required: true, description: '榜单日期 YYYY-MM-DD（最近30天，支持 yesterday/today）' },
    },
    endpoint: 'https://redfox.hk/story/api/cozeSkill/getGzhCozeSkillDataRaise',
    method: 'GET',
    payload: (a) => {
      const p = { rankDate: normalizeDate(a.rankDate), source: SOURCE };
      if (!p.rankDate) {
        throw new Error('rankDate 格式错误，请使用 YYYY-MM-DD / yesterday / today');
      }
      return p;
    },
  },
  'wechat-title': {
    description: '公众号爆款标题参考，按关键词查询近N天同赛道爆款文章标题规律',
    params: {
      keyword: { type: 'string', required: true, description: '赛道关键词（多词用逗号分隔，最多5个）' },
      days: { type: 'number', default: 7, description: '查询最近N天（1-30，默认7）' },
    },
    endpoint: 'https://redfox.hk/story/api/cozeSkill/getWxCozeSkillData',
    method: 'GET',
    payload: (a) => {
      const days = Math.min(Math.max(parseInt(a.days, 10) || 7, 1), 30);
      const start = new Date();
      start.setDate(start.getDate() - (days - 1));
      return { keyword: a.keyword, startDate: fmtDate(start), source: SOURCE };
    },
  },
  'wechat-original-hot': {
    description: '公众号原创爆款文章查询，按分类和时间获取原创10w+文章',
    params: {
      type: { type: 'string', default: '总排名', description: '分类：总排名/科技数码/健康养生 等23个标准分类' },
      startDate: { type: 'string', required: true, description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', required: true, description: '结束日期 YYYY-MM-DD（后端强制必填）' },
    },
    payload: (a) => ({
      type: a.type || '总排名', startDate: a.startDate, endDate: a.endDate, source: SOURCE,
    }),
  },
  'wechat-10w-hot': {
    description: '公众号10w+爆文查询，按分类和时间获取10w+阅读热门文章',
    params: {
      type: { type: 'string', default: '总排名', description: '分类：总排名/科技数码/健康养生 等23个标准分类' },
      startDate: { type: 'string', required: true, description: '起始日期 YYYY-MM-DD（支持 yesterday 等）' },
      endDate: { type: 'string', required: true, description: '结束日期 YYYY-MM-DD' },
    },
    payload: (a) => ({ type: a.type || '总排名', startDate: a.startDate, endDate: a.endDate, source: SOURCE }),
  },
  'gzh-astock-top': {
    description: '公众号A股大V榜，按关键词搜索公众号账号排行（默认A股领域，返回账号与最新文章数据）',
    params: {
      keyword: { type: 'string', description: '搜索关键词（默认 A股）' },
      offset: { type: 'number', default: 0, description: '偏移量' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword || 'A股', offset: a.offset || 0, source: SOURCE };
      return p;
    },
  },

  // ==================== 快手校正 ====================
  'kuaishou-account-works': {
    description: '快手账号作品查询，按账号查询作品列表',
    params: {
      userId: { type: 'string', required: true, description: '快手用户ID' },
      page: { type: 'number', default: 1, description: '页码' },
      size: { type: 'number', default: 20, description: '每页数量' },
    },
    payload: (a) => ({ userId: a.userId, page: a.page || 1, size: a.size || 20, source: SOURCE }),
  },
  'kuaishou-comment': {
    description: '快手作品评论查询',
    params: {
      opusId: { type: 'string', required: true, description: '快手作品ID' },
      cursor: { type: 'string', description: '分页游标' },
    },
    payload: (a) => {
      const p = { opusId: a.opusId, source: SOURCE };
      if (a.cursor) p.cursor = a.cursor;
      return p;
    },
  },

  // ==================== B站校正 ====================
  'bilibili-keywords-accounts': {
    description: 'B站账号搜索，按关键词搜索B站UP主',
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词' },
      order: { type: 'string', default: 'fans', enum: ['totalrank', 'fans'], description: '排序：totalrank=综合排序, fans=按粉丝数' },
      page: { type: 'number', default: 1, description: '页码' },
    },
    payload: (a) => ({ keyword: a.keyword, order: a.order || 'fans', page: a.page || 1, source: SOURCE }),
  },
  'bilibili-keywords-search': {
    description: 'B站内容搜索，按关键词搜索B站视频',
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词' },
      sortType: { type: 'string', description: '排序类型' },
      publishTime: { type: 'string', description: '发布时间' },
      page: { type: 'number', default: 1, description: '页码' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, page: a.page || 1, source: SOURCE };
      if (a.sortType) p.sortType = a.sortType;
      if (a.publishTime) p.publishTime = a.publishTime;
      return p;
    },
  },
  'bilibili-portfolio-search': {
    description: 'B站用户作品列表查询',
    params: {
      uid: { type: 'string', required: true, description: 'B站用户UID' },
    },
    payload: (a) => ({ uid: a.uid, source: SOURCE }),
  },
  'bilibili-search-download': {
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词' },
      page: { type: 'number', default: 1, description: '页码' },
      pageSize: { type: 'number', default: 10, description: '每页数量' },
      order: { type: 'string', default: 'play', description: '排序方式（如 play）' },
      dateRange: { type: 'string', default: '7d', description: '发布时间范围，如 7d=近7天' },
    },
    // 对齐 bilibili_search.py：page 字符串化，字段全量必传
    payload: (a) => ({
      keyword: a.keyword,
      page: String(a.page || 1),
      pageSize: a.pageSize || 10,
      order: a.order || 'play',
      dateRange: a.dateRange || '7d',
      source: SOURCE,
    }),
  },

  // ==================== 快手校正 ====================
  'kuaishou-accounts': {
    params: {
      accountName: { type: 'string', required: true, description: '快手账号名称' },
      page: { type: 'number', default: 1, description: '页码' },
      pageSize: { type: 'number', default: 20, description: '每页数量（最大50）' },
    },
    // 对齐 search_ks_user.py：真实接口不传 source
    payload: (a) => ({ accountName: a.accountName, page: a.page || 1, pageSize: a.pageSize || 20 }),
  },

  // ==================== 微博校正 ====================
  'weibo-realtime-search': {
    description: '微博实时搜索，按关键词实时搜索微博内容',
    params: {
      keyword: { type: 'string', required: true, description: '搜索关键词' },
      page: { type: 'number', default: 1, description: '页码' },
    },
    payload: (a) => ({ keyword: a.keyword, page: a.page || 1, source: SOURCE }),
  },
  'weibo-post-search': {
    description: '微博用户作品列表查询',
    params: {
      userId: { type: 'string', required: true, description: '微博用户ID' },
      page: { type: 'number', default: 1, description: '页码' },
    },
    payload: (a) => ({ userId: a.userId, page: a.page || 1, source: SOURCE }),
  },
  'weibo-hot-search': {
    description: '微博热搜榜查询',
    params: {},
    payload: (a) => ({ source: SOURCE }),
  },
  'weibo-comment-search': {
    description: '微博博文评论查询，支持翻页',
    params: {
      weiboId: { type: 'string', required: true, description: '微博博文链接或 opusId（如 https://weibo.com/1784473157/R8X4f2lnq）' },
      cursor: { type: 'string', description: '翻页游标，翻页时传上次返回的 maxCursor' },
    },
    // 对齐 weibo_comment_search.py：POST commentList，body 为 opusId/maxCursor/maxIdType
    endpoint: BASE + '/story/api/weibo/ability/commentList',
    payload: (a) => {
      const m = String(a.weiboId).match(/weibo\.com\/\d+\/([A-Za-z0-9]+)/);
      return {
        opusId: m ? m[1] : String(a.weiboId),
        maxCursor: a.cursor || '0',
        maxIdType: '0',
        source: SOURCE,
      };
    },
  },

  // ==================== 其他 ====================
  'x-comment-analyzer': {
    description: 'X(Twitter)推文评论查询',
    params: {
      tweetId: { type: 'string', required: true, description: '推文ID' },
      cursor: { type: 'string', description: '分页游标' },
    },
    payload: (a) => {
      const p = { tweetId: a.tweetId, source: SOURCE };
      if (a.cursor) p.cursor = a.cursor;
      return p;
    },
  },
  'youtube-comment': {
    description: 'YouTube视频评论查询',
    params: {
      videoId: { type: 'string', required: true, description: 'YouTube视频ID' },
      sortBy: { type: 'string', description: '排序方式' },
      languageCode: { type: 'string', description: '语言代码' },
      countryCode: { type: 'string', description: '国家代码' },
      continuationToken: { type: 'string', description: '分页游标' },
    },
    payload: (a) => {
      const p = { videoId: a.videoId, source: SOURCE };
      if (a.sortBy) p.sortBy = a.sortBy;
      if (a.languageCode) p.languageCode = a.languageCode;
      if (a.countryCode) p.countryCode = a.countryCode;
      if (a.continuationToken) p.continuationToken = a.continuationToken;
      return p;
    },
  },
  'youtube-digest': {
    description: 'YouTube视频字幕/文案提取（视频转文字）',
    params: {
      url: { type: 'string', required: true, description: 'YouTube视频链接或视频ID' },
      language: { type: 'string', description: '字幕语言代码，如 zh/en（默认自动多语言）' },
    },
    // 对齐 extract.py：真实字段为 videoUrl，另带 format/includeTimestamp/sendMetadata 默认值
    payload: (a) => ({
      videoUrl: a.url,
      format: 'json',
      includeTimestamp: false,
      sendMetadata: true,
      language: a.language || 'zh,en,asr',
      source: SOURCE,
    }),
  },
  'twitter-comment': {
    description: 'X(Twitter)推文评论查询',
    params: {
      tweetId: { type: 'string', required: true, description: '推文ID' },
    },
    payload: (a) => ({ tweetId: a.tweetId, source: SOURCE }),
  },
  // ==================== 短剧信息源（playlet-*，queryPlayletMsgs） ====================
  // 对齐桌面真实脚本：msgType='短剧' + platform 平台编号(0公众号/1抖音/3小红书/6B站)，
  // 时间范围取目标日整天；数据每日15:00更新前一天，目标日期无数据须先确认，禁止静默回退
  'playlet-bili-feed': {
    description: 'B站短剧爆款榜查询：按日期获取B站短剧作品(点赞量排序)。数据每日15:00更新前一天，查询日期仅允许≤最近数据日且无数据日期必须确认后再查，禁止自动回退',
    params: {
      date: { type: 'string', description: '数据日期 YYYY-MM-DD（默认最近数据日）' },
      count: { type: 'number', default: 100, description: '最大返回条数 1-200（默认100）' },
    },
    payload: (a) => {
      const r = dayRange(a.date);
      const n = Math.min(Math.max(Number(a.count) || 100, 1), 200);
      return { msgType: '短剧', platform: 6, pageNum: 1, pageSize: n, startTime: r.start, endTime: r.end, source: SOURCE };
    },
  },
  'playlet-douyin-feed': {
    description: '抖音短剧爆款榜查询：按日期获取抖音短剧作品(点赞量排序)。数据每日15:00更新前一天，查询日期仅允许≤最近数据日且无数据日期必须确认后再查，禁止自动回退',
    params: {
      date: { type: 'string', description: '数据日期 YYYY-MM-DD（默认最近数据日）' },
      count: { type: 'number', default: 100, description: '最大返回条数 1-200（默认100）' },
    },
    payload: (a) => {
      const r = dayRange(a.date);
      const n = Math.min(Math.max(Number(a.count) || 100, 1), 200);
      return { msgType: '短剧', platform: 1, pageNum: 1, pageSize: n, startTime: r.start, endTime: r.end, source: SOURCE };
    },
  },
  'playlet-wechat-feed': {
    description: '公众号短剧爆款榜查询：按日期获取公众号短剧文章(阅读量排序)。数据每日15:00更新前一天，查询日期仅允许≤最近数据日且无数据日期必须确认后再查，禁止自动回退',
    params: {
      date: { type: 'string', description: '数据日期 YYYY-MM-DD（默认最近数据日）' },
      count: { type: 'number', default: 100, description: '最大返回条数 1-200（默认100）' },
    },
    payload: (a) => {
      const r = dayRange(a.date);
      const n = Math.min(Math.max(Number(a.count) || 100, 1), 200);
      return { msgType: '短剧', platform: 0, pageNum: 1, pageSize: n, startTime: r.start, endTime: r.end, source: SOURCE };
    },
  },
  'playlet-xiaohongshu-feed': {
    description: '小红书短剧爆款榜查询：按日期获取小红书短剧笔记(互动量排序)。数据每日15:00更新前一天，查询日期仅允许≤最近数据日且无数据日期必须确认后再查，禁止自动回退',
    params: {
      date: { type: 'string', description: '数据日期 YYYY-MM-DD（默认最近数据日）' },
      count: { type: 'number', default: 100, description: '最大返回条数 1-200（默认100）' },
    },
    payload: (a) => {
      const r = dayRange(a.date);
      const n = Math.min(Math.max(Number(a.count) || 100, 1), 200);
      return { msgType: '短剧', platform: 3, pageNum: 1, pageSize: n, startTime: r.start, endTime: r.end, source: SOURCE };
    },
  },
  // ==================== 文旅信息源（cultural-tourism-*） ====================
  // 对齐 cultural_tourism_report.py：query{Gzh,Xhs,Dy,Bili}PlayletMsgs + keyword + 目标日整天
  'cultural-tourism-bilibili-feed': {
    description: '文旅B站信息源查询：按关键词与日期获取文旅类B站热门视频(点赞量排序)。数据每日15:00更新前一天，无数据日期必须确认后再查',
    params: {
      keyword: { type: 'string', description: '内容关键词，如 文旅、景区、旅游攻略（留空返回全部）' },
      date: { type: 'string', description: '数据日期 YYYY-MM-DD（默认最近数据日）' },
      count: { type: 'number', default: 100, description: '最大返回条数 1-200（默认100）' },
    },
    payload: (a) => {
      const r = dayRange(a.date);
      const n = Math.min(Math.max(Number(a.count) || 100, 1), 200);
      const p = { pageNum: 1, pageSize: n, startTime: r.start, endTime: r.end, source: SOURCE };
      if (a.keyword) p.keyword = a.keyword;
      return p;
    },
  },
  'cultural-tourism-douyin-feed': {
    description: '文旅抖音信息源查询：按关键词与日期获取文旅类抖音热门作品(点赞量排序)。数据每日15:00更新前一天，无数据日期必须确认后再查',
    params: {
      keyword: { type: 'string', description: '内容关键词，如 文旅、景区、旅游攻略（留空返回全部）' },
      date: { type: 'string', description: '数据日期 YYYY-MM-DD（默认最近数据日）' },
      count: { type: 'number', default: 100, description: '最大返回条数 1-200（默认100）' },
    },
    payload: (a) => {
      const r = dayRange(a.date);
      const n = Math.min(Math.max(Number(a.count) || 100, 1), 200);
      const p = { pageNum: 1, pageSize: n, startTime: r.start, endTime: r.end, source: SOURCE };
      if (a.keyword) p.keyword = a.keyword;
      return p;
    },
  },
  'cultural-tourism-wechat-feed': {
    description: '文旅公众号信息源查询：按关键词与日期获取文旅类公众号热门文章(阅读量排序)。数据每日15:00更新前一天，无数据日期必须确认后再查',
    params: {
      keyword: { type: 'string', description: '内容关键词，如 文旅、景区、旅游攻略（留空返回全部）' },
      date: { type: 'string', description: '数据日期 YYYY-MM-DD（默认最近数据日）' },
      count: { type: 'number', default: 100, description: '最大返回条数 1-200（默认100）' },
    },
    payload: (a) => {
      const r = dayRange(a.date);
      const n = Math.min(Math.max(Number(a.count) || 100, 1), 200);
      const p = { pageNum: 1, pageSize: n, startTime: r.start, endTime: r.end, source: SOURCE };
      if (a.keyword) p.keyword = a.keyword;
      return p;
    },
  },
  'cultural-tourism-xiaohongshu-feed': {
    description: '文旅小红书信息源查询：按关键词与日期获取文旅类小红书热门笔记(点赞量排序)。数据每日15:00更新前一天，无数据日期必须确认后再查',
    params: {
      keyword: { type: 'string', description: '内容关键词，如 文旅、景区、旅游攻略（留空返回全部）' },
      date: { type: 'string', description: '数据日期 YYYY-MM-DD（默认最近数据日）' },
      count: { type: 'number', default: 100, description: '最大返回条数 1-200（默认100）' },
    },
    payload: (a) => {
      const r = dayRange(a.date);
      const n = Math.min(Math.max(Number(a.count) || 100, 1), 200);
      const p = { pageNum: 1, pageSize: n, startTime: r.start, endTime: r.end, source: SOURCE };
      if (a.keyword) p.keyword = a.keyword;
      return p;
    },
  },
  // ==================== 全网聚合查询 ====================
  'multi-content-feed': {
    description: '全网内容出海Top50榜单查询：按日期获取公众号/抖音/视频号/小红书/快手/B站内容出海爆款作品。平台编号：0公众号 1抖音 2视频号 3小红书 4快手 6B站；数据每日15:00更新前一天',
    params: {
      date: { type: 'string', description: '数据日期 YYYY-MM-DD（默认最近数据日）' },
      platforms: { type: 'string', description: '平台编号（逗号分隔，如 0,1,3；留空返回全部6平台）' },
      keyword: { type: 'string', description: '内容关键词（可选）' },
    },
    payload: (a) => {
      const r = dayRange(a.date);
      const p = { startTime: r.start, endTime: r.end, source: SOURCE };
      if (a.platforms) {
        const list = a.platforms.split(',').map(s => Number(s.trim())).filter(n => Number.isInteger(n) && n >= 0 && n <= 6 && n !== 5);
        p.platforms = list.length ? list : [0, 1, 2, 3, 4, 6];
      } else {
        p.platforms = [0, 1, 2, 3, 4, 6];
      }
      if (a.keyword) p.keyword = a.keyword;
      return p;
    },
  },
  // ==================== A股财经（queryWorkList，对齐 common.py） ====================
  'stock-analysis': {
    description: '公众号A股大V文章查询：按公众号微信号获取其历史文章(发布时间倒序)，供复盘/选股素材采集。内置大V微信号：猫笔刀maobidao、格兰投研gelantouyan、投资明见sinaxxm、财躺平gh_ad228eaec48a、终身黑白zshbtz',
    params: {
      account: { type: 'string', required: true, description: '公众号微信号（内置大V见描述，也支持任意公众号微信号）' },
      offset: { type: 'number', default: 0, description: '分页偏移量' },
      days: { type: 'number', default: 7, description: '回溯天数（发布窗口）' },
    },
    payload: (a) => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - (Number(a.days) || 7));
      return {
        account: a.account,
        offset: Number(a.offset) || 0,
        sortType: '_2',
        publishTimeStart: fmtDate(start),
        publishTimeEnd: fmtDate(now),
        source: SOURCE,
      };
    },
  },
  'investor-distiller': {
    description: '公众号投资大V文章列表查询(蒸馏器素材采集)：按公众号微信号分页拉取文章列表，支持用文章UUID精确获取单篇',
    params: {
      account: { type: 'string', required: true, description: '公众号微信号' },
      offset: { type: 'number', default: 0, description: '分页偏移量' },
      workUuid: { type: 'string', description: '文章UUID（精确获取单篇时填写）' },
    },
    payload: (a) => {
      const p = { account: a.account, offset: Number(a.offset) || 0, sortType: '_2', source: SOURCE };
      if (a.workUuid) p.workUuid = a.workUuid;
      return p;
    },
  },
};

const SOURCE = 'mcp';

/* ---------------- 日期辅助（与真实技能脚本保持一致） ---------------- */

/** 本地时间格式化 YYYY-MM-DD */
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 榜单日期解析：支持 YYYY-MM-DD / yesterday / today，非法返回 null */
function normalizeDate(input) {
  const s = String(input == null ? '' : input).trim().toLowerCase();
  const now = new Date();
  if (s === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return fmtDate(d);
  }
  if (s === 'today') return fmtDate(now);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/**
 * 公众号综合实力账号榜最新可查询日期（对齐 gzh_growth_fetcher.py）：
 * - day:   每日17:30更新昨日 → 17:30后取昨天，否则取前天
 * - week:  每周一17:30更新上周 → 17:30后取本周一，否则取上周一
 * - month: 每月3号23:00更新上月 → 3号23:00后取上月1号，否则取上上月1号
 */
function latestGzhRankDate(rankType) {
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const afterDayUpdate = now.getHours() > 17 || (now.getHours() === 17 && now.getMinutes() >= 30);

  if (rankType === 'week') {
    const monday = new Date(base);
    monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7));
    if (!afterDayUpdate) monday.setDate(monday.getDate() - 7);
    return fmtDate(monday);
  }
  if (rankType === 'month') {
    const afterMonthUpdate = now.getDate() > 3 || (now.getDate() === 3 && now.getHours() >= 23);
    const target = new Date(now.getFullYear(), now.getMonth(), 1);
    target.setMonth(target.getMonth() - (afterMonthUpdate ? 1 : 2));
    return fmtDate(target);
  }
  // day（默认）
  const d = new Date(base);
  d.setDate(d.getDate() - (afterDayUpdate ? 1 : 2));
  return fmtDate(d);
}

/** feed 类最新可查数据日：数据每日15:00更新前一天 → 15:00后返回昨天，否则前天 */
function latestFeedDate() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getHours() < 15) d.setDate(d.getDate() - 2);
  else d.setDate(d.getDate() - 1);
  return fmtDate(d);
}

/** feed 类目标日整天时间窗（date 非法时回退最近数据日） */
function dayRange(date) {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) ? date : latestFeedDate();
  return { start: `${day} 00:00:00`, end: `${day} 23:59:59` };
}

/**
 * 无真实数据功能接口的工具（record/save 仅为技能记录上报，无法提供数据查询），
 * 从 MCP 工具集剔除：multi-rewrite / zhihu-rewrite / optimize-skill-md
 */
const EXCLUDED_TOOLS = ['multi-rewrite', 'zhihu-rewrite', 'optimize-skill-md'];

module.exports = { overrides, SOURCE, EXCLUDED_TOOLS };
