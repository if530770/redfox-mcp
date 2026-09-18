# 快手数据 MCP Server（redfox-mcp-server-kuaishou）

基于**红狐数据**（redfox.hk）快手 API 封装的专业快手数据 MCP 服务器，提供 **5 个快手数据工具**。

- **内容发现**：关键词搜索、账号搜索、作品详情
- **互动分析**：评论获取
- **素材获取**：快手视频提取

属于红狐 MCP 服务器集群的快手分类包。如需全平台 91 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys?source=mcp) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "kuaishou-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-kuaishou@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

### 3. 开始使用

- "搜索快手关于'美食'的视频"
- "获取这个快手账号的作品列表"
- "下载这个快手视频"

## 工具清单（5 个）

| 分类 | 工具 |
|------|------|
| 内容发现 | `kuaishou-search` 视频搜索、`kuaishou-accounts` 账号搜索、`kuaishou-account-works` 作品详情 |
| 互动分析 | `kuaishou-comment` 评论获取 |
| 素材获取 | `kuaishou-video-extract` 视频提取 |

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？** A: 未设置 `REDFOX_API_KEY` 环境变量。
**Q: 返回 `[BIZ_ERROR]`？** A: API Key 无效或权限不足。
**Q: 想用其他平台？** 红狐 MCP 集群还提供 [抖音](https://www.npmjs.com/package/redfox-mcp-server-douyin)、[小红书](https://www.npmjs.com/package/redfox-mcp-server-xiaohongshu)、[公众号](https://www.npmjs.com/package/redfox-mcp-server-wechat) 等独立包及全平台综合包。

## License

MIT