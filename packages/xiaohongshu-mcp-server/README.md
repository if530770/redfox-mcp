# 小红书数据 MCP Server（redfox-mcp-server-xiaohongshu）

基于**红狐数据**（redfox.hk）小红书 API 封装的专业小红书数据 MCP 服务器，提供 **16 个小红书数据工具**。

- **爆款发现**：爆款笔记搜索、日榜/周榜、低粉爆款、对标账号推荐
- **内容创作**：笔记写作、标题生成与评分、封面参考、文案改写
- **账号分析**：账号七维度诊断、笔记深度解析、AI 信息流订阅
- **内容合规**：小红书违禁词检测、视频下载

属于红狐 MCP 服务器集群的小红书分类包，只加载小红书相关工具（2KB 极轻量）。如需全平台 91 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys?source=mcp) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "xiaohongshu-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-xiaohongshu@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

**Claude Desktop / Cursor**：

```bash
claude mcp add xiaohongshu-mcp -- npx -y redfox-mcp-server-xiaohongshu@latest
```

### 3. 开始使用

配置完成后，即可用自然语言调用小红书数据能力：

- "搜索最近 7 天小红书上关于露营的爆款笔记"
- "帮我给这篇笔记生成 5 个标题并评分"
- "分析这个小红书账号的表现"

## 部署到 ModelScope MCP 广场

魔搭 MCP 广场支持将本服务器**托管部署**为云端 MCP 服务。

1. 进入 [创建页](https://modelscope.cn/mcp/servers/create?template=customize)，选择「自定义创建」
2. 托管类型选择「可托管部署」，`command` 填 `npx`
3. 服务配置：

```json
{
  "mcpServers": {
    "redfox-mcp-server-xiaohongshu": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-xiaohongshu@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

4. 环境变量：`REDFOX_API_KEY`（连接时由用户填写自己的 Key）
5. 部署检测通过后，获得专属 Remote URL：`https://mcp-<uuid>.api-inference.modelscope.cn/sse`

## 工具清单（16 个）

| 分类 | 工具 |
|------|------|
| 爆款发现 | `xiaohongshu-search` 笔记搜索、`xiaohongshu-dailytop` 日榜、`xiaohongshu-weeklytop` 周榜、`xiaohongshu-similar-account` 对标账号 |
| 内容创作 | `xiaohongshu-write` 笔记写作、`xiaohongshu-title` 标题生成、`xiaohongshu-title-score` 标题评分、`xiaohongshu-cover` 封面参考、`xiaohongshu-rewrite` 文案改写 |
| 账号分析 | `xiaohongshu-account-analyzer` 账号诊断、`xiaohongshu-note-analyzer` 笔记解析、`xiaohongshu-top-account` 账号榜、`xiaohongshu-ai-feed` AI 信息流 |
| 内容合规 | `xiaohongshu-prohibited-word` 违禁词检测 |
| 素材获取 | `xiaohongshu-crawler` 笔记爬取、`xiaohongshu-video-downloader` 视频下载 |

## 架构

本包是红狐 MCP 集群的独立分类包，核心逻辑复用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server)：

```
redfox-mcp-server-xiaohongshu（server.js，仅 4KB）
        │  require
        ▼
redfox-mcp-server（依赖）──> build-tools.js 工具构建
                                  │
                                  ▼
                      redfox-client.js ──> https://redfox.hk/story/api/...?source=mcp
```

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？**
A: 未设置 `REDFOX_API_KEY` 环境变量，请先在客户端配置中填写。

**Q: 返回 `[BIZ_ERROR]`？**
A: API Key 无效或权限不足，请到红狐hub检查 Key 状态。

**Q: 想用其他平台的数据？**
A: 红狐 MCP 集群还提供抖音（`redfox-mcp-server-douyin`）、公众号（`redfox-mcp-server-wechat`）独立包，以及全平台综合包 `redfox-mcp-server`。

## License

MIT
