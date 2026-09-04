/**
 * RedFox API 统一客户端
 * - 支持 X-API-KEY / REDFOX_API_KEY 两种请求头
 * - POST/GET JSON 请求
 * - 统一错误处理（HTTP 错误、业务码、网络错误）
 * - 异步任务轮询（提交 -> 查询结果）
 */
'use strict';

const BASE_URL = 'https://redfox.hk';

class RedFoxApiError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'RedFoxApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * 发送请求
 * @param {object} opts
 * @param {string} opts.url - 完整 URL
 * @param {string} [opts.method='POST']
 * @param {object} [opts.body] - JSON body
 * @param {string} [opts.headerName] - 请求头名（X-API-KEY / REDFOX_API_KEY），默认双发
 * @param {number} [opts.timeout=60000]
 */
async function request({ url, method = 'POST', body, headerName, timeout = 60000 }) {
  const apiKey = process.env.REDFOX_API_KEY || process.env.REDFOX_API_KEY_FALLBACK;
  if (!apiKey) {
    throw new RedFoxApiError('未配置 REDFOX_API_KEY 环境变量，请先设置红狐 API Key', 'NO_API_KEY');
  }

  // 仓库脚本两种请求头都有使用，双发保证兼容
  const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'REDFOX_API_KEY': apiKey,
  };
  if (headerName && !headers[headerName]) headers[headerName] = apiKey;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let resp;
  try {
    resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw new RedFoxApiError(`请求超时(${timeout}ms): ${url}`, 'TIMEOUT');
    throw new RedFoxApiError(`网络请求失败: ${e.message}`, 'NETWORK');
  } finally {
    clearTimeout(timer);
  }

  const text = await resp.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* 非 JSON 响应 */ }

  if (!resp.ok) {
    throw new RedFoxApiError(`HTTP ${resp.status}: ${text.slice(0, 300)}`, 'HTTP_ERROR', { url, status: resp.status });
  }

  // 业务码：200/2000 为成功
  if (json && typeof json === 'object') {
    const code = json.code;
    if (code !== undefined && code !== 200 && code !== 2000) {
      throw new RedFoxApiError(`接口返回错误: code=${code}, msg=${json.msg || json.message || '未知'}`, 'BIZ_ERROR', json);
    }
  }
  return json ?? text;
}

/**
 * 提交异步任务并轮询结果
 * @param {object} opts
 * @param {string} opts.submitUrl - 提交端点
 * @param {string} opts.resultUrl - 结果端点（支持 {taskId} 占位符）
 * @param {object} opts.submitBody - 提交参数
 * @param {string} [opts.taskIdField='taskId'] - 提交响应中任务ID字段（支持点路径如 data.taskId）
 * @param {string} [opts.headerName='X-API-KEY']
 * @param {number} [opts.intervalMs=3000]
 * @param {number} [opts.maxAttempts=30]
 */
async function submitAndPoll({ submitUrl, resultUrl, submitBody, taskIdField = 'taskId', headerName = 'X-API-KEY', intervalMs = 3000, maxAttempts = 30 }) {
  const submitResp = await request({ url: submitUrl, body: submitBody, headerName });

  // 提取任务 ID（支持 data.taskId / taskId / data.task_id 等）
  const taskId = dig(submitResp, taskIdField) || dig(submitResp, 'data.taskId') || dig(submitResp, 'taskId') || dig(submitResp, 'data.task_id');
  if (!taskId) {
    // 可能同步返回了结果
    if (submitResp && submitResp.data && (submitResp.data.status === 'success' || submitResp.data.status === 'done' || submitResp.data.result)) {
      return { submitted: submitResp, result: submitResp.data };
    }
    throw new RedFoxApiError('提交任务成功但未获取到任务ID', 'NO_TASK_ID', submitResp);
  }

  let lastError = null;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    try {
      const resultUrlFinal = resultUrl.replace('{taskId}', encodeURIComponent(taskId));
      const r = await request({ url: resultUrlFinal, method: 'POST', body: { taskId }, headerName });
      const status = String(dig(r, 'data.status') || dig(r, 'status') || '').toLowerCase();
      if (status === 'success' || status === 'done' || status === 'completed' || status === 'finished' || status === 'succeeded' || dig(r, 'data.result')) {
        return { taskId, submitted: submitResp, result: r };
      }
      if (status === 'failed' || status === 'error' || status === 'fail') {
        throw new RedFoxApiError(`任务处理失败: ${dig(r, 'data.msg') || dig(r, 'msg') || '未知错误'}`, 'TASK_FAILED', r);
      }
      lastError = null;
    } catch (e) {
      if (e instanceof RedFoxApiError && (e.code === 'TASK_FAILED' || e.code === 'HTTP_ERROR' || e.code === 'BIZ_ERROR')) throw e;
      lastError = e;
    }
  }
  throw new RedFoxApiError(`任务轮询超时（${maxAttempts} 次，每次 ${intervalMs}ms），taskId=${taskId}`, 'POLL_TIMEOUT', { taskId, lastError: lastError?.message });
}

/** 按点路径取值 */
function dig(obj, path) {
  if (!obj) return undefined;
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = { request, submitAndPoll, dig, RedFoxApiError, BASE_URL };
