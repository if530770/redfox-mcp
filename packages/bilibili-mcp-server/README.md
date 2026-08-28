# B站数据 MCP Server（redfox-mcp-server-bilibili）

基于**红狐数据**（redfox.hk）B站 API 封装的专业 B站数据 MCP 服务器，提供 **6 个 B站数据工具**。

- **内容发现**：关键词搜索、账号搜索、作品集搜索
- **互动分析**：评论获取、搜索结果下载
- **素材获取**：B站视频下载

属于红狐 MCP 服务器集群的 B站分类包。如需全平台 91 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-bilibili@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

### 3. 开始使用

- "搜索 B站上关于'深度学习'的视频"
- "获取这个 UP 主的最新作品列表"
- "下载这个 B站视频"

## 工具清单（6 个）

| 分类 | 工具 |
|------|------|
| 内容发现 | `bilibili-keywords-search` 关键词搜索、`bilibili-keywords-accounts` 账号搜索、`bilibili-portfolio-search` 作品集搜索 |
| 互动分析 | `bilibili-comment` 评论获取、`bilibili-search-download` 搜索结果下载 |
| 素材获取 | `bilibili-video-downloader` 视频下载 |

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？** A: 未设置 `REDFOX_API_KEY` 环境变量。
**Q: 返回 `[BIZ_ERROR]`？** A: API Key 无效或权限不足。
**Q: 想用其他平台？** 红狐 MCP 集群还提供 [抖音](https://www.npmjs.com/package/redfox-mcp-server-douyin)、[小红书](https://www.npmjs.com/package/redfox-mcp-server-xiaohongshu)、[公众号](https://www.npmjs.com/package/redfox-mcp-server-wechat) 等独立包及全平台综合包。

## License

MIT