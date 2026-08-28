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
    payload: (a) => ({ url: a.url, sortType: a.sortType, dataNum: a.dataNum, offset: a.offset, source: SOURCE }),
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
    description: '抖音热点趋势查询，按平台获取热门话题列表',
    params: {
      platform: { type: 'string', default: 'douyin', description: '平台：douyin/xiaohongshu/gongzhonghao 等' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
    },
    payload: (a) => {
      const p = { platform: a.platform || 'douyin', source: SOURCE };
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

  // ==================== AI 搜索 ====================
  'deepseek-websearch': {
    description: 'DeepSeek AI 联网搜索，输入问题返回AI搜索结果',
    params: { inquiryText: { type: 'string', required: true, description: '搜索问题' } },
    payload: (a) => ({ inquiryText: a.inquiryText, source: SOURCE }),
  },
  'doubao-websearch': {
    description: '豆包 AI 联网搜索，输入问题返回AI搜索结果',
    params: { inquiryText: { type: 'string', required: true, description: '搜索问题' } },
    payload: (a) => ({ inquiry_text: a.inquiryText, source: SOURCE }),
  },
  'kimi-websearch': {
    description: 'Kimi AI 联网搜索，输入问题返回AI搜索结果',
    params: { inquiryText: { type: 'string', required: true, description: '搜索问题' } },
    payload: (a) => ({ inquiry_text: a.inquiryText, source: SOURCE }),
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
    description: '小红书爆款标题生成参考，查询同赛道爆款笔记标题规律',
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
  'xiaohongshu-title-score': {
    description: '小红书标题评分参考，查询同赛道爆款标题数据用于评分',
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
  'xiaohongshu-cover': {
    description: '小红书爆款封面设计参考，查询同赛道爆款笔记获取封面视觉规律',
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
  'xiaohongshu-note-analyzer': {
    description: '小红书笔记优化助手数据查询，查询同赛道爆款笔记用于文案评分对比',
    params: {
      keyword: { type: 'string', required: true, description: '文案主题关键词' },
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
  'xiaohongshu-dailytop': {
    description: '小红书每日爆款笔记，查询指定日期的每日爆款榜单',
    params: {
      rankDate: { type: 'string', required: true, description: '榜单日期 YYYY-MM-DD' },
      category: { type: 'string', description: '分类' },
    },
    payload: (a) => {
      const p = { rankDate: a.rankDate, source: SOURCE };
      if (a.category) p.category = a.category;
      return p;
    },
  },
  'xiaohongshu-weeklytop': {
    description: '小红书七日爆款笔记，查询指定日期的七日爆款榜单',
    params: {
      rankDate: { type: 'string', required: true, description: '榜单日期 YYYY-MM-DD' },
      category: { type: 'string', description: '分类' },
    },
    payload: (a) => {
      const p = { rankDate: a.rankDate, source: SOURCE };
      if (a.category) p.category = a.category;
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
    description: '公众号头部账号榜，查询最具影响力的公众号',
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
  'wechat-fastest-growing': {
    description: '公众号涨粉最快账号榜',
    params: {
      rankDate: { type: 'string', required: true, description: '榜单日期 YYYY-MM-DD' },
    },
    payload: (a) => ({ rankDate: a.rankDate, source: SOURCE }),
  },
  'wechat-title': {
    description: '公众号爆款标题参考，查询同赛道爆款文章标题规律',
    params: {
      keyword: { type: 'string', required: true, description: '赛道关键词' },
      days: { type: 'number', default: 7, description: '查询天数' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, source: SOURCE };
      if (a.days) p.days = a.days;
      return p;
    },
  },
  'wechat-original-hot': {
    description: '公众号原创爆款文章查询，按分类和时间获取原创10w+文章',
    params: {
      type: { type: 'string', default: '总排名', description: '分类：总排名/科技数码/健康养生 等23个标准分类' },
      startDate: { type: 'string', description: '起始日期 YYYY-MM-DD' },
      endDate: { type: 'string', description: '结束日期 YYYY-MM-DD' },
    },
    payload: (a) => ({
      type: a.type || '总排名', startDate: a.startDate || '', endDate: a.endDate || '', source: SOURCE,
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
    description: '公众号A股爆文榜，查询A股相关公众号文章排行',
    params: {
      keyword: { type: 'string', description: '搜索关键词' },
      offset: { type: 'number', default: 0, description: '偏移量' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword || '', offset: a.offset || 0, source: SOURCE };
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
      order: { type: 'string', description: '排序方式' },
      page: { type: 'number', default: 1, description: '页码' },
    },
    payload: (a) => {
      const p = { keyword: a.keyword, page: a.page || 1, source: SOURCE };
      if (a.order) p.order = a.order;
      return p;
    },
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
    description: '微博评论查询',
    params: {
      weiboId: { type: 'string', required: true, description: '微博ID' },
      cursor: { type: 'string', description: '分页游标' },
    },
    payload: (a) => {
      const p = { weiboId: a.weiboId, source: SOURCE };
      if (a.cursor) p.cursor = a.cursor;
      return p;
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
      url: { type: 'string', required: true, description: 'YouTube视频链接' },
      language: { type: 'string', description: '字幕语言代码' },
    },
    payload: (a) => {
      const p = { url: a.url, source: SOURCE };
      if (a.language) p.language = a.language;
      return p;
    },
  },
  'twitter-comment': {
    description: 'X(Twitter)推文评论查询',
    params: {
      tweetId: { type: 'string', required: true, description: '推文ID' },
    },
    payload: (a) => ({ tweetId: a.tweetId, source: SOURCE }),
  },
};

const SOURCE = 'RedFoxMCP';

module.exports = { overrides, SOURCE };
