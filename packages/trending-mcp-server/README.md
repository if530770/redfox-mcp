# 全网热点研究 MCP Server（redfox-mcp-server-trending）

红狐全网热点研究 MCP Server，提供 **5 个跨平台工具**：7大平台热搜聚合、全网TOP10热词回溯、今日头条搜索、近30天话题舆情研究与内容出海Top50榜单。

- **多平台热搜聚合（抖音/微博/B站/快手/知乎/头条/百度）**
- **全网热点TOP10回溯**
- **今日头条作品搜索**
- **近30天跨平台话题舆情研究（小红书/抖音/公众号）**
- **全网内容出海Top50（公众号/抖音/视频号/小红书/快手/B站）**

属于红狐 MCP 服务器集群的热点研究分类包。如需全平台 88 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys?source=mcp) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "trending-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-trending@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

## 工具清单

| 工具 | 说明 |
|------|------|
| `cn-last30days` | 全网多平台近30天内容搜索，按关键词跨平台查询爆款内容 |
| `multi-content-feed` | 全网内容出海Top50榜单查询：按日期获取公众号/抖音/视频号/小红书/快手/B站内容出海爆款作品 |
| `toutiao-search` | 今日头条作品搜索，按关键词查询头条爆款内容 |
| `trending-hub` | 全网热点聚合查询，按平台和关键词获取热门话题 |
| `trending-hub-top10` | 全网热搜关键词 TOP10 查询 |

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？** A: 未设置 `REDFOX_API_KEY` 环境变量。
**Q: 返回 `[BIZ_ERROR]`？** A: API Key 无效或权限不足。
**Q: 想用其他平台/主题？** 红狐 MCP 集群还提供 [A股财经](https://www.npmjs.com/package/redfox-mcp-server-astock)、[公众号](https://www.npmjs.com/package/redfox-mcp-server-wechat)、[抖音](https://www.npmjs.com/package/redfox-mcp-server-douyin)、[小红书](https://www.npmjs.com/package/redfox-mcp-server-xiaohongshu) 等独立包及全平台综合包。

## License

MIT
