# 魔搭 MCP 广场部署配置指南 — 其余 7 个 MCP 服务

> 目标：将红狐 MCP 集群中**尚未上架魔搭**的 7 个 npm 子包逐一托管部署到 [魔搭 MCP 广场](https://modelscope.cn/mcp)，获得专属 Remote URL（SSE / Streamable HTTP），供任意 MCP 客户端远程连接。
>
> 已上架（跳过）：抖音 `redfox-mcp-server-douyin`、公众号 `redfox-mcp-server-wechat`、小红书 `redfox-mcp-server-xiaohongshu`、微博 `redfox-mcp-server-weibo`、全平台 `redfox-mcp-server`。

## 一、待部署服务总览

| # | npm 包 | MCP 名 | 工具数 | 建议英文名称 | 建议显示名称 |
|---|--------|--------|-------|-------------|-------------|
| 1 | redfox-mcp-server-bilibili | bilibili-mcp | 6 | redfox-mcp-bilibili | B站数据 MCP |
| 2 | redfox-mcp-server-kuaishou | kuaishou-mcp | 5 | redfox-mcp-kuaishou | 快手数据 MCP |
| 3 | redfox-mcp-server-overseas | overseas-mcp | 7 | redfox-mcp-overseas | 海外平台 MCP |
| 4 | redfox-mcp-server-ai | ai-tools-mcp | 6 | redfox-mcp-ai-tools | AI 工具 MCP |
| 5 | redfox-mcp-server-astock | astock-mcp | 4 | redfox-mcp-astock | A股财经数据 MCP |
| 6 | redfox-mcp-server-content | content-mcp | 9 | redfox-mcp-content | 全网内容数据 MCP |
| 7 | redfox-mcp-server-trending | trending-mcp | 5 | redfox-mcp-trending | 全网热点研究 MCP |

合计 **42 个工具**（与主包 88 工具去重后的分布一致）。

## 二、通用配置步骤（每个服务重复一次）

### 1. 进入创建页

浏览器打开 [魔搭 MCP 广场创建页](https://modelscope.cn/mcp/servers/create?template=customize)（或 MCP 广场右上角「创建 MCP」→ 自定义创建）。

### 2. 填写基础字段

| 字段 | 填写说明 |
|------|---------|
| 英文名称 | 用上表建议值（全站唯一，创建后不可改） |
| 显示名称 | 中文名，如「B站数据 MCP」 |
| 托管类型 | 选 **可托管部署**（必须，才会生成 Remote URL） |
| 简介 | 用第三节各服务「简介」文案 |
| 服务配置 config | 选 STDIO，粘贴第三节各服务「服务配置 JSON」（**不允许注释**，逐字复制） |
| 环境变量 | 添加 `REDFOX_API_KEY`（值留空或任意占位——连接时由用户填自己的 Key；部署检测不依赖它） |
| README | 用各子包自带 [packages/*/README.md](packages/) 内容（含功能说明 + 使用方式 + 工具清单） |
| 图标 | 可从 npm 包首页或红狐素材选择，可留默认 |

### 3. 提交并等待部署检测

魔搭会执行 `npx -y <包名>@latest` 启动服务并调用 `tools/list`：

- 检测**不需要 API Key**（工具静态注册即可返回），7 个包均已实测可过；
- 若失败，常见原因是 config JSON 含注释/多余逗号，或 args 漏写 `-y`。

### 4. 验证与分享

- 服务状态变「可连接」后，点击「连接」→ 填入自己的 `REDFOX_API_KEY`（如 `ak_xxx`）→ 获得专属 Remote URL：
  `https://mcp-<uuid>.api-inference.modelscope.cn/sse`
- 将该 URL 填入 Qoder / Dify / 通义灵码 / Cursor 等任意 MCP 客户端（Header 或 env 带 `REDFOX_API_KEY`）即可远程调用。

## 三、各服务配置卡片（JSON 逐字复制）

### 1. B站数据 MCP（6 工具）

- 简介：B站数据查询：关键词搜索、账号主页、作品集、评论、视频下载等 6 个工具。
- 工具：`bilibili-keywords-search`、`bilibili-keywords-accounts`、`bilibili-portfolio-search`、`bilibili-comment`、`bilibili-search-download`、`bilibili-video-downloader`

```json
{
  "mcpServers": {
    "redfox-mcp-bilibili": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-bilibili@latest"],
      "env": { "REDFOX_API_KEY": "" }
    }
  }
}
```

### 2. 快手数据 MCP（5 工具）

- 简介：快手数据查询：关键词搜索、账号列表、账号作品、评论、视频提取等 5 个工具。
- 工具：`kuaishou-search`、`kuaishou-accounts`、`kuaishou-account-works`、`kuaishou-comment`、`kuaishou-video-extract`

```json
{
  "mcpServers": {
    "redfox-mcp-kuaishou": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-kuaishou@latest"],
      "env": { "REDFOX_API_KEY": "" }
    }
  }
}
```

### 3. 海外平台 MCP（7 工具）

- 简介：海外平台内容获取：YouTube/Twitter/TikTok/Instagram 视频下载、评论分析、YouTube 视频摘要等 7 个工具。
- 工具：`youtube-video-downloader`、`youtube-digest`、`youtube-comment`、`twitter-video-downloader`、`twitter-comment`、`tiktok-video-downloader`、`instagram-video-downloader`

```json
{
  "mcpServers": {
    "redfox-mcp-overseas": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-overseas@latest"],
      "env": { "REDFOX_API_KEY": "" }
    }
  }
}
```

### 4. AI 工具 MCP（6 工具）

- 简介：AI 大模型内容工具：DeepSeek/豆包/Kimi 联网搜索、Seedance 视频生成、图片写作、视频提示词等 6 个工具。
- 工具：`deepseek-websearch`、`doubao-websearch`、`kimi-websearch`、`seedance-video-gen`、`visual-ops-writer`、`video-prompt-expert`

```json
{
  "mcpServers": {
    "redfox-mcp-ai-tools": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-ai@latest"],
      "env": { "REDFOX_API_KEY": "" }
    }
  }
}
```

### 5. A股财经数据 MCP（4 工具）

- 简介：A股内容情报：公众号 A股大V榜、大V文章查询（猫笔刀/格兰投研等）、跨平台 A股资讯检索、投资博主素材采集等 4 个工具。
- 工具：`gzh-astock-top`、`stock-analysis`、`stock-feed`、`investor-distiller`

```json
{
  "mcpServers": {
    "redfox-mcp-astock": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-astock@latest"],
      "env": { "REDFOX_API_KEY": "" }
    }
  }
}
```

### 6. 全网内容数据 MCP（9 工具）

- 简介：内容创作数据：短剧爆款榜（公众号/抖音/小红书/B站）、文旅信息源查询（4 平台）、多平台官方违禁词检测，共 9 个工具。
- 工具：`playlet-{wechat,douyin,xiaohongshu,bili}-feed`、`cultural-tourism-{wechat,douyin,xiaohongshu,bilibili}-feed`、`multi-wordcheck`

```json
{
  "mcpServers": {
    "redfox-mcp-content": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-content@latest"],
      "env": { "REDFOX_API_KEY": "" }
    }
  }
}
```

### 7. 全网热点研究 MCP（5 工具）

- 简介：全网热点舆情：7 大平台热搜聚合、TOP10 热词回溯、今日头条搜索、近 30 天话题舆情研究、内容出海 Top50 榜单，共 5 个工具。
- 工具：`trending-hub`、`trending-hub-top10`、`toutiao-search`、`cn-last30days`、`multi-content-feed`

```json
{
  "mcpServers": {
    "redfox-mcp-trending": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-trending@latest"],
      "env": { "REDFOX_API_KEY": "" }
    }
  }
}
```

## 四、注意事项

1. **名称唯一性**：英文名称全站唯一，若被占用可换 `redfox-bilibili-data` 等变体，同时更新 JSON 的 key（key 需与英文名称一致或取易于识别的标识）。
2. **JSON 严格性**：config 粘贴后先本地用 `JSON.parse` 校验一遍（无注释、无尾逗号）。
3. **部署检测**：7 包均为纯 stdio JSON-RPC、`tools/list` 静态返回（零依赖 Node ≥18），魔搭检测可稳定通过；失败时看魔搭日志，多为 Node 环境未启用或 npm 包名拼写错误。
4. **免费额度**：每账号最多 20 个托管服务（当前已 5 + 本次 7 = 12，余量 8）；单服务 1 实例；全服务共享 5 秒窗口 ≤500 次请求、单用户总量 ≤50000 次。若触顶可购买「个人专属云资源」。
5. **主包依赖**：3 个主题包（astock/content/trending）依赖主包 `redfox-mcp-server >=1.0.4`，魔搭托管时 npx 会自动拉取该依赖，无需额外配置。

## 五、部署前本地自检（可选）

每个服务部署前可在本地验证启动命令：

```bash
npx -y redfox-mcp-server-<name>@latest
# 启动日志出现 "MCP Server v1.0.x 已启动 / 工具数量: N" 即正常
```

或用任意 MCP 客户端添加本地服务 `npx -y <包名>@latest`（env 配 `REDFOX_API_KEY`），`tools/list` 应返回与第三节一致的工具数。
