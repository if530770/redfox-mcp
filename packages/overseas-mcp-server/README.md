# 海外平台 MCP Server（redfox-mcp-server-overseas）

基于**红狐数据**（redfox.hk）封装的专业海外平台数据 MCP 服务器，聚合 **YouTube / Twitter / TikTok / Instagram** 四平台数据工具，共 **7 个工具**。

- **YouTube**：视频摘要、评论获取、视频下载
- **Twitter**：评论获取、视频下载
- **TikTok**：视频下载
- **Instagram**：视频下载

属于红狐 MCP 服务器集群的海外分类包。如需全平台 91 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "overseas-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-overseas@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

### 3. 开始使用

- "总结这个 YouTube 视频的内容"
- "获取这条推文的评论"
- "下载这个 TikTok 视频"

## 工具清单（7 个）

| 平台 | 工具 |
|------|------|
| YouTube | `youtube-digest` 视频摘要、`youtube-comment` 评论获取、`youtube-video-downloader` 视频下载 |
| Twitter | `twitter-comment` 评论获取、`twitter-video-downloader` 视频下载 |
| TikTok | `tiktok-video-downloader` 视频下载 |
| Instagram | `instagram-video-downloader` 视频下载 |

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？** A: 未设置 `REDFOX_API_KEY` 环境变量。
**Q: 返回 `[BIZ_ERROR]`？** A: API Key 无效或权限不足。
**Q: 想用国内平台？** 红狐 MCP 集群还提供 [抖音](https://www.npmjs.com/package/redfox-mcp-server-douyin)、[小红书](https://www.npmjs.com/package/redfox-mcp-server-xiaohongshu)、[公众号](https://www.npmjs.com/package/redfox-mcp-server-wechat) 等独立包及全平台综合包。

## License

MIT