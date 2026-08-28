# 微博数据 MCP Server（redfox-mcp-server-weibo）

基于**红狐数据**（redfox.hk）微博 API 封装的专业微博数据 MCP 服务器，提供 **4 个微博数据工具**。

- **实时热点**：微博热搜榜
- **内容搜索**：实时搜索、文章搜索
- **互动分析**：评论搜索

属于红狐 MCP 服务器集群的微博分类包。如需全平台 91 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys?source=modelscope) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "redfox-mcp-server-weibo": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-weibo@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

### 3. 开始使用

- "查一下微博热搜榜"
- "搜索关于'芯片'的微博"
- "搜索微博评论中的关键词"

## 工具清单（4 个）

| 分类 | 工具 |
|------|------|
| 实时热点 | `weibo-hot-search` 热搜榜 |
| 内容搜索 | `weibo-realtime-search` 实时搜索、`weibo-post-search` 文章搜索 |
| 互动分析 | `weibo-comment-search` 评论搜索 |

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？** A: 未设置 `REDFOX_API_KEY` 环境变量。
**Q: 返回 `[BIZ_ERROR]`？** A: API Key 无效或权限不足。
**Q: 想用其他平台？** 红狐 MCP 集群还提供 [抖音](https://www.npmjs.com/package/redfox-mcp-server-douyin)、[小红书](https://www.npmjs.com/package/redfox-mcp-server-xiaohongshu)、[公众号](https://www.npmjs.com/package/redfox-mcp-server-wechat) 等独立包及全平台综合包。

## License

MIT