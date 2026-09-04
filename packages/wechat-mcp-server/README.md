# 公众号数据 MCP Server（redfox-mcp-server-wechat）

基于**红狐数据**（redfox.hk）微信公众号 API 封装的专业公众号数据 MCP 服务器，提供 **14 个公众号数据工具**。

- **爆文发现**：每日 10w+ 爆文、原创爆文、文章搜索、账号排行榜、涨粉最快榜
- **内容创作**：公众号写作、标题参考、文案改写、封面参考
- **账号分析**：对标账号推荐、视频号内容、AI 信息流订阅
- **内容合规**：公众号违禁词检测、视频下载

属于红狐 MCP 服务器集群的公众号分类包，只加载公众号相关工具（2KB 极轻量）。如需全平台 91 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "wechat-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-wechat@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

**Claude Desktop / Cursor**：

```bash
claude mcp add wechat-mcp -- npx -y redfox-mcp-server-wechat@latest
```

### 3. 开始使用

配置完成后，即可用自然语言调用公众号数据能力：

- "查一下今天的公众号 10w+ 爆文"
- "搜索关于'AI'的公众号文章"
- "帮我写一篇公众号爆款文案"

## 部署到 ModelScope MCP 广场

魔搭 MCP 广场支持将本服务器**托管部署**为云端 MCP 服务。

1. 进入 [创建页](https://modelscope.cn/mcp/servers/create?template=customize)，选择「自定义创建」
2. 托管类型选择「可托管部署」，`command` 填 `npx`
3. 服务配置：

```json
{
  "mcpServers": {
    "redfox-mcp-server-wechat": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-wechat@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

4. 环境变量：`REDFOX_API_KEY`（连接时由用户填写自己的 Key）
5. 部署检测通过后，获得专属 Remote URL：`https://mcp-<uuid>.api-inference.modelscope.cn/sse`

## 工具清单（14 个）

| 分类 | 工具 |
|------|------|
| 爆文发现 | `wechat-10w-hot` 每日10w+爆文、`wechat-original-hot` 原创爆文、`wechat-search` 文章搜索、`wechat-top-account` 账号榜、`wechat-fastest-growing` 涨粉最快榜 |
| 内容创作 | `wechat-write` 公众号写作、`wechat-title` 标题参考、`wechat-rewrite` 文案改写、`wechat-cover` 封面参考 |
| 账号分析 | `wechat-similar-account` 对标账号、`wechat-channels-ai-feed` 视频号 AI 信息流、`wechat-channels-crawler` 视频号爬取 |
| 内容合规 | `wechat-prohibited-word` 违禁词检测 |
| 素材获取 | `wechat-video-downloader` 视频下载 |

## 架构

本包是红狐 MCP 集群的独立分类包，核心逻辑复用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server)：

```
redfox-mcp-server-wechat（server.js，仅 4KB）
        │  require
        ▼
redfox-mcp-server（依赖）──> build-tools.js 工具构建
                                  │
                                  ▼
                      redfox-client.js ──> https://redfox.hk/story/api/...
```

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？**
A: 未设置 `REDFOX_API_KEY` 环境变量，请先在客户端配置中填写。

**Q: 返回 `[BIZ_ERROR]`？**
A: API Key 无效或权限不足，请到红狐hub检查 Key 状态。

**Q: 想用其他平台的数据？**
A: 红狐 MCP 集群还提供抖音（`redfox-mcp-server-douyin`）、小红书（`redfox-mcp-server-xiaohongshu`）独立包，以及全平台综合包 `redfox-mcp-server`。

## License

MIT
