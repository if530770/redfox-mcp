# 全网内容数据 MCP Server（redfox-mcp-server-content）

红狐全网内容数据 MCP Server，提供 **9 个工具**：短剧爆款榜与文旅信息源（公众号/抖音/小红书/B站）双垂类内容查询，外加多平台官方违禁词检测。数据每日15:00更新前一天。

- **公众号/抖音/小红书/B站短剧爆款榜**
- **文旅公众号文章/抖音作品/小红书笔记/B站视频查询**
- **多平台官方违禁词检测（公众号/小红书/抖音/B站/快手）**

属于红狐 MCP 服务器集群的内容数据分类包。如需全平台 88 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "content-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-content@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

## 工具清单

| 工具 | 说明 |
|------|------|
| `cultural-tourism-bilibili-feed` | 文旅B站信息源查询：按关键词与日期获取文旅类B站热门视频(点赞量排序) |
| `cultural-tourism-douyin-feed` | 文旅抖音信息源查询：按关键词与日期获取文旅类抖音热门作品(点赞量排序) |
| `cultural-tourism-wechat-feed` | 文旅公众号信息源查询：按关键词与日期获取文旅类公众号热门文章(阅读量排序) |
| `cultural-tourism-xiaohongshu-feed` | 文旅小红书信息源查询：按关键词与日期获取文旅类小红书热门笔记(点赞量排序) |
| `multi-wordcheck` | 多平台违禁词检测，检查文案中的敏感词并返回检测结果 |
| `playlet-bili-feed` | B站短剧爆款榜查询：按日期获取B站短剧作品(点赞量排序) |
| `playlet-douyin-feed` | 抖音短剧爆款榜查询：按日期获取抖音短剧作品(点赞量排序) |
| `playlet-wechat-feed` | 公众号短剧爆款榜查询：按日期获取公众号短剧文章(阅读量排序) |
| `playlet-xiaohongshu-feed` | 小红书短剧爆款榜查询：按日期获取小红书短剧笔记(互动量排序) |

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？** A: 未设置 `REDFOX_API_KEY` 环境变量。
**Q: 返回 `[BIZ_ERROR]`？** A: API Key 无效或权限不足。
**Q: 想用其他平台/主题？** 红狐 MCP 集群还提供 [A股财经](https://www.npmjs.com/package/redfox-mcp-server-astock)、[公众号](https://www.npmjs.com/package/redfox-mcp-server-wechat)、[抖音](https://www.npmjs.com/package/redfox-mcp-server-douyin)、[小红书](https://www.npmjs.com/package/redfox-mcp-server-xiaohongshu) 等独立包及全平台综合包。

## License

MIT
