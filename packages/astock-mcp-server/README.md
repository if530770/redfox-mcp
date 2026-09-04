# A股财经数据 MCP Server（redfox-mcp-server-astock）

红狐 A股财经数据 MCP Server，提供 **4 个股票内容工具**：公众号A股大V榜、大V文章查询、跨平台A股舆情资讯。

- **A股公众号大V榜**
- **公众号A股大V文章查询（猫笔刀/格兰投研等）**
- **跨平台A股资讯检索**
- **投资博主文章素材采集**

属于红狐 MCP 服务器集群的A股财经分类包。如需全平台 88 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "astock-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-astock@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

## 工具清单

| 工具 | 说明 |
|------|------|
| `gzh-astock-top` | 公众号A股大V榜，按关键词搜索公众号账号排行（默认A股领域，返回账号与最新文章数据） |
| `investor-distiller` | 公众号投资大V文章列表查询(蒸馏器素材采集)：按公众号微信号分页拉取文章列表，支持用文章UUID精确获取单篇 |
| `stock-analysis` | 公众号A股大V文章查询：按公众号微信号获取其历史文章(发布时间倒序)，供复盘/选股素材采集 |
| `stock-feed` | 股票内容资讯查询，跨平台搜索股票相关爆款内容 |

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？** A: 未设置 `REDFOX_API_KEY` 环境变量。
**Q: 返回 `[BIZ_ERROR]`？** A: API Key 无效或权限不足。
**Q: 想用其他平台/主题？** 红狐 MCP 集群还提供 [公众号](https://www.npmjs.com/package/redfox-mcp-server-wechat)、[抖音](https://www.npmjs.com/package/redfox-mcp-server-douyin)、[小红书](https://www.npmjs.com/package/redfox-mcp-server-xiaohongshu)、[短剧](https://www.npmjs.com/package/redfox-mcp-server-playlet) 等独立包及全平台综合包。

## License

MIT
