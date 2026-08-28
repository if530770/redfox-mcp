# AI 工具 MCP Server（redfox-mcp-server-ai）

基于**红狐数据**（redfox.hk）封装的专业 AI 工具 MCP 服务器，聚合 **DeepSeek / 豆包 / Kimi 联网搜索、Seedance 视频生成、VisualOps 图片写作、视频提示词专家**等 **6 个 AI 工具**。

- **AI 搜索**：DeepSeek 联网搜索、豆包联网搜索、Kimi 联网搜索
- **AI 生成**：Seedance 视频生成、VisualOps 图片写作
- **提示词**：视频提示词专家

属于红狐 MCP 服务器集群的 AI 工具分类包。如需全平台 91 个工具，请使用 [redfox-mcp-server](https://www.npmjs.com/package/redfox-mcp-server) 综合包。

## 快速开始

### 1. 获取 API Key

前往 [红狐hub](https://redfox.hk/settings/api-keys) 获取 `REDFOX_API_KEY`。

### 2. 配置到 MCP 客户端

```json
{
  "mcpServers": {
    "ai-tools-mcp": {
      "command": "npx",
      "args": ["-y", "redfox-mcp-server-ai@latest"],
      "env": { "REDFOX_API_KEY": "your-api-key-here" }
    }
  }
}
```

### 3. 开始使用

- "用 DeepSeek 搜索最新的 AI 新闻"
- "生成一段 15 秒的视频"
- "帮我写一个视频生成的提示词"

## 工具清单（6 个）

| 分类 | 工具 |
|------|------|
| AI 搜索 | `deepseek-websearch` DeepSeek 联网搜索、`doubao-websearch` 豆包联网搜索、`kimi-websearch` Kimi 联网搜索 |
| AI 生成 | `seedance-video-gen` 视频生成、`visual-ops-writer` 图片写作 |
| 提示词 | `video-prompt-expert` 视频提示词专家 |

## 常见问题

**Q: 工具调用返回 `[NO_API_KEY]`？** A: 未设置 `REDFOX_API_KEY` 环境变量。
**Q: 返回 `[BIZ_ERROR]`？** A: API Key 无效或权限不足。
**Q: 想用平台数据？** 红狐 MCP 集群还提供 [抖音](https://www.npmjs.com/package/redfox-mcp-server-douyin)、[小红书](https://www.npmjs.com/package/redfox-mcp-server-xiaohongshu)、[公众号](https://www.npmjs.com/package/redfox-mcp-server-wechat) 等数据包及全平台综合包。

## License

MIT