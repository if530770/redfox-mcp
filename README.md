# RedFox MCP Server

将 [redfox-community](https://github.com/redfox-data/redfox-community) 仓库的 **115 个 Agent Skill** 封装为 **单一 MCP 服务器**（方案2：全部工具一次部署可用）。

- **88 个工具**可直接调用（已接入 RedFox 真实 API）
- **零依赖**：纯 Node.js 原生实现（内置 fetch），无需 npm install、无需 Python
- **协议**：MCP (Model Context Protocol) over stdio，兼容 Qoder / Claude / Cursor 等客户端

```json
{
  "mcpServers": {
    "redfox-mcp-server": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

## 部署到 ModelScope MCP 广场（托管部署）

魔搭 MCP 广场支持将本服务器**托管部署**为云端 MCP 服务，对外提供专属 Remote URL（SSE / Streamable HTTP），用户无需本地运行即可远程连接。

### 1. 发布 npm 包（仅首次）

```bash
cd redfox-mcp
npm login           # 需要 npm 账号
npm publish         # 包名 redfox-mcp-server，零依赖，37KB
```

### 2. 魔搭创建服务

进入 [创建页](https://modelscope.cn/mcp/servers/create?template=customize)（或从 GitHub 仓库快速创建），填写：

| 字段 | 值 |
|------|-----|
| 英文名称 | redfox-mcp-server |
| 托管类型 | **可托管部署** |
| 服务配置 config | 填写下方 `mcpServers` 中的 server 配置（**不允许注释**） |
| 环境变量 | `REDFOX_API_KEY`（连接时由用户填写自己的 Key） |
| README | 功能说明 + 使用方式（可直接用本文件） |

平台部署检测会执行 `npx -y redfox-mcp-server@latest` 并调用 `tools/list`（已实测无需 API Key 即可返回 88 个工具，检测可顺利通过）。

### 3. 用户使用

用户在服务详情页填写自己的 `REDFOX_API_KEY` → 点击「连接」→ 获得专属 Remote URL：

```
https://mcp-<uuid>.api-inference.modelscope.cn/sse
```

填入任意 MCP 客户端（Qoder / Dify / 通义灵码等）即可远程使用全部 88 个工具。

> 免费部署限制：每用户最多 20 个部署服务、每服务 1 个实例、全部免费服务 5 秒窗口内 ≤500 次请求、单用户总量 ≤50000 次。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys) 获取 `REDFOX_API_KEY`。

### 2. 启动服务器

```bash
# Windows PowerShell
$env:REDFOX_API_KEY = "ak_xxxx..."
node server.js
```

### 3. 配置到客户端

**Qoder**：在 MCP 配置中添加本服务器（发布后可用 npx 方式，本地开发用 node 方式）：

- **npx 方式（推荐，需已发布 npm 包）**：
  ```json
  {
    "mcpServers": {
      "redfox-mcp-server": {
        "command": "npx",
        "args": ["-y", "redfox-mcp-server@latest"],
        "env": { "REDFOX_API_KEY": "ak_xxxx..." }
      }
    }
  }
  ```
- **本地开发方式**：
  ```json
  {
    "mcpServers": {
      "redfox-mcp": {
        "command": "node",
        "args": ["E:\\path\\to\\redfox-mcp\\server.js"],
        "env": { "REDFOX_API_KEY": "ak_xxxx..." }
      }
    }
  }
  ```

Qoder 注册文件（`SERVER_METADATA.json` + `tools/*.json`）位于 [qoder-register/](qoder-register/)，由 `gen-qoder-register.js` 自动生成。

**Claude Desktop / Cursor**：`claude mcp add redfox-mcp -- node <path>/server.js`

## 工具清单

| 平台 | 工具 |
|------|------|
| 抖音 | douyin-search, douyin-hot-trend, douyin-daily-hot, douyin-content-surge, douyin-weekly-surge, douyin-rise-ranking, douyin-top-account, douyin-similar-account, douyin-account-diagnosis, douyin-ai-feed, douyin-prohibited-word, douyin-subscribe |
| 小红书 | xiaohongshu-search, xiaohongshu-write, xiaohongshu-title, xiaohongshu-title-score, xiaohongshu-cover, xiaohongshu-note-analyzer, xiaohongshu-dailytop, xiaohongshu-weeklytop, xiaohongshu-top-account, xiaohongshu-account-analyzer, xiaohongshu-similar-account, xiaohongshu-crawler, xiaohongshu-ai-feed, xiaohongshu-prohibited-word, xiaohongshu-rewrite, xiaohongshu-video-downloader |
| 公众号 | wechat-10w-hot, wechat-original-hot, wechat-search, wechat-write, wechat-cover, wechat-title, wechat-top-account, wechat-fastest-growing, wechat-similar-account, wechat-account-analyzer, wechat-prohibited-word, wechat-rewrite, wechat-video-downloader, gzh-astock-top |
| B站 | bilibili-keywords-search, bilibili-keywords-accounts, bilibili-portfolio-search, bilibili-comment, bilibili-search-download, bilibili-video-downloader |
| 快手 | kuaishou-search, kuaishou-accounts, kuaishou-account-works, kuaishou-comment, kuaishou-video-extract |
| 微博 | weibo-hot-search, weibo-realtime-search, weibo-post-search, weibo-comment-search |
| YouTube/X | youtube-digest, youtube-comment, youtube-video-downloader, twitter-comment, twitter-video-downloader |
| TikTok | tiktok-video-downloader |
| 多平台 | cn-last30days, stock-feed, stock-analysis, multi-content-feed, trending-hub, trending-hub-top10, playlet-*-feed, cultural-tourism-*-feed |
| AI 搜索 | deepseek-websearch, doubao-websearch, kimi-websearch |
| AI 生成 | seedance-video-gen（视频）, visual-ops-writer（图片）, video-prompt-expert |
| 工具 | 违禁词检测（4平台）, 视频下载（8平台）, multi-wordcheck |

## 架构

```
redfox-mcp/
├── server.js              # MCP stdio 服务器入口（JSON-RPC 2.0）
├── tools-manifest.json    # 自动提取的工具清单（从仓库脚本提取 API 端点/参数）
├── src/
│   ├── redfox-client.js   # RedFox API 统一客户端（双请求头、错误处理、任务轮询）
│   ├── build-tools.js     # 工具构建器（合并 manifest + overrides）
│   └── overrides.js       # 人工校正层（精确参数映射、异步任务定义）
└── qoder-register/        # Qoder 注册文件（SERVER_METADATA.json + tools/*.json）
```

### 数据流

```
MCP 客户端 ──JSON-RPC/stdio──> server.js ──> build-tools.js 工具注册表
                                                │
                                                ▼
                                    redfox-client.js（X-API-KEY 双发）
                                                │
                                                ▼
                                    https://redfox.hk/story/api/...
```

### 工具参数设计

- 参数名与 RedFox API payload 字段一致（camelCase：`startDate`/`pageNum`/`pageSize`）
- `source` 字段由服务器自动填充为 `RedFoxMCP`，无需调用方传参
- 异步任务类工具（视频生成/视频提文案/评论获取）自动提交 + 轮询，直接返回最终结果

## 重新生成工具清单

仓库脚本更新后，重新提取 API 信息：

```bash
node mcp-extract-manifest.js "E:\path\to\redfox-community"
copy tools-manifest.json redfox-mcp\tools-manifest.json
node gen-qoder-register.js   # 重新生成 Qoder 注册文件
```

## 未接入的工具（24 个）

以下 Skill 无 API 端点（纯 AI 分析/提示词型），未注册为工具：

`ai-intelligence-investigator`, `image-gen`, `redfox-skill-generator`, `redfox-subscribe`, `multi-copywrite-alchemy`, `pdf-image-text-extractor`, `seedream-5-lite`, `gzh-search`, `gzh-subscribe`, `video-downloader`, `douyin-works-crawler`, `tiktok-home-downloader`, `geo-analyzer`, `global-ai-news-brief`, `overseas-trending-search`, `wechat-account-analyzer`, `weibo-video-downloader`, `twitter-work-search`, `xiaohongshu-lowtop` 等

如需接入，可在 `src/overrides.js` 中补充对应端点后重新生成。

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？**
A: 未设置 `REDFOX_API_KEY` 环境变量，请先在启动前配置。

**Q: 返回 `[BIZ_ERROR]`？**
A: API Key 无效或权限不足，请到红狐hub检查 Key 状态。

**Q: 如何测试？**
```bash
node mcp-test-client.js list   # 列出工具
node mcp-test-client.js call douyin-search test-args.json   # 调用工具（参数从 JSON 文件读）
```
