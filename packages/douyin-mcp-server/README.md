# 抖音数据 MCP Server（redfox-mcp-server-douyin）

基于**红狐数据**（redfox.hk）抖音 API 封装的专业抖音数据 MCP 服务器，提供 **12 个抖音数据工具**。

- **热点追踪**：热门话题、每日/每周爆款、涨粉排行、上升榜
- **账号分析**：账号诊断报告、对标账号推荐、搜索查询
- **内容合规**：抖音违禁词检测、AI 信息流订阅

属于红狐 MCP 服务器集群的抖音分类包，只加载抖音相关工具（2KB 极轻量）。如需全平台 91 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys?source=mcp) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "douyin-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-douyin@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

**Claude Desktop / Cursor**：

```bash
claude mcp add douyin-mcp -- npx -y redfox-mcp-server-douyin@latest
```

### 3. 开始使用

配置完成后，即可用自然语言调用抖音数据能力：

- "查一下今天抖音的热门话题 TOP 20"
- "搜索'美食'相关的抖音视频"
- "分析这个抖音账号的表现"

## 部署到 ModelScope MCP 广场

魔搭 MCP 广场支持将本服务器**托管部署**为云端 MCP 服务。

1. 进入 [创建页](https://modelscope.cn/mcp/servers/create?template=customize)，选择「自定义创建」
2. 托管类型选择「可托管部署」，`command` 填 `npx`
3. 服务配置：

```json
{
  "mcpServers": {
    "redfox-mcp-server-douyin": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-douyin@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

4. 环境变量：`REDFOX_API_KEY`（连接时由用户填写自己的 Key）
5. 部署检测通过后，获得专属 Remote URL：`https://mcp-<uuid>.api-inference.modelscope.cn/sse`

## 工具清单（12 个）

| 分类 | 工具 |
|------|------|
| 热点趋势 | `douyin-hot-trend` 热门话题趋势、`douyin-daily-hot` 每日爆款、`douyin-weekly-surge` 每周爆款、`douyin-content-surge` 内容飙升榜、`douyin-rise-ranking` 上升榜 |
| 账号分析 | `douyin-search` 视频搜索、`douyin-top-account` 涨粉榜、`douyin-similar-account` 对标账号、`douyin-account-diagnosis` 账号诊断 |
| 内容合规 | `douyin-prohibited-word` 违禁词检测 |
| 订阅推送 | `douyin-subscribe` 关键词订阅、`douyin-ai-feed` AI 信息流 |

## 架构

本包是红狐 MCP 集群的独立分类包，核心逻辑复用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server)：

```
redfox-mcp-server-douyin（server.js，仅 4KB）
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
A: 红狐 MCP 集群还提供小红书（`redfox-mcp-server-xiaohongshu`）、公众号（`redfox-mcp-server-wechat`）独立包，以及全平台综合包 `redfox-mcp-server`。

## License

MIT
