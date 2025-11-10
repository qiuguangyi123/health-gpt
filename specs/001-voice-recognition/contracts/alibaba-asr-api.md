# API合约: 阿里云语音识别服务

**功能**: 001-voice-recognition | **日期**: 2025-11-10 | **Phase**: 1
**规格**: [spec.md](../spec.md) | **研究**: [research.md](../research.md)

## 概述

本文档定义与阿里云智能语音交互(ISI)服务的API集成合约,具体使用**一句话识别**功能实现60秒以内的短音频转文字。

**API类型**: RESTful一句话识别
**适用场景**: 60秒以内的短音频识别
**语言支持**: 中文普通话(zh-CN)

---

## API端点

### 基础信息

```
方法: POST
端点: https://nls-gateway-{region}.aliyuncs.com/stream/v1/asr
协议: HTTPS
```

**区域(Region)选择**:
- `cn-shanghai`: 中国(上海)
- `cn-beijing`: 中国(北京)
- `cn-shenzhen`: 中国(深圳)

**推荐**: 使用`cn-shanghai`以获得最佳延迟和稳定性

---

## 认证方式

### 方案1: Token认证 (推荐用于客户端)

**获取Token**:
```typescript
// 通过后端API获取临时token
const response = await fetch('YOUR_BACKEND_API/asr/token', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${userAuthToken}`
  }
})

const { token, expireTime } = await response.json()
```

**使用Token**:
```http
POST /stream/v1/asr
Host: nls-gateway-cn-shanghai.aliyuncs.com
Content-Type: audio/aac;samplerate=16000
X-NLS-Token: {token}
```

### 方案2: AccessKey签名 (用于后端)

**签名算法**: HMAC-SHA1

**签名流程**:
1. 构建待签名字符串
2. 使用AccessKey Secret进行HMAC-SHA1签名
3. Base64编码签名结果
4. 添加到Authorization header

**示例代码**:
```typescript
import crypto from 'crypto'

const generateSignature = (
  accessKeyId: string,
  accessKeySecret: string,
  timestamp: string
) => {
  const stringToSign = `POST\napplication/json\n${timestamp}`
  const signature = crypto
    .createHmac('sha1', accessKeySecret)
    .update(stringToSign)
    .digest('base64')

  return `acs ${accessKeyId}:${signature}`
}
```

---

## 请求格式

### HTTP Headers

| Header名称 | 值 | 必填 | 说明 |
|-----------|---|------|------|
| Content-Type | audio/aac;samplerate=16000 | ✅ | 音频格式和采样率 |
| X-NLS-Token | {token} | ✅ | 认证token |
| Accept | application/json | ❌ | 响应格式,默认JSON |

**Content-Type格式**:
```
audio/{format};samplerate={rate}
```

**支持的格式**:
- `audio/aac` - AAC编码(推荐)
- `audio/mpeg` - MP3编码
- `audio/wav` - WAV格式
- `audio/pcm` - PCM原始格式

### HTTP Body

**格式**: 二进制音频数据

**要求**:
- 最大文件大小: 2MB
- 最大音频时长: 60秒
- 最小音频时长: 0.5秒

**编码方式**:
```typescript
// 方式1: 直接上传文件(推荐)
const audioData = await FileSystem.readAsStringAsync(audioUri, {
  encoding: FileSystem.EncodingType.Base64
})

const response = await fetch(API_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'audio/aac;samplerate=16000',
    'X-NLS-Token': token,
  },
  body: audioData,  // Base64字符串
})

// 方式2: FormData(不推荐)
const formData = new FormData()
formData.append('audio', {
  uri: audioUri,
  type: 'audio/aac',
  name: 'recording.m4a',
})
```

---

## 响应格式

### 成功响应

**HTTP Status**: 200 OK

**Content-Type**: application/json

**响应体结构**:
```typescript
interface ASRSuccessResponse {
  header: {
    namespace: 'SpeechTranscriber'
    name: 'TranscriptionResultChanged' | 'TranscriptionCompleted'
    status: 20000000                    // 成功状态码
    message_id: string                  // 消息ID
    task_id: string                     // 任务ID(用于问题追踪)
    status_text: 'OK'                   // 状态文本
  }
  payload: {
    result: string                      // 识别结果文本
    index: number                       // 句子索引,从1开始
    time: number                        // 时间戳(ms)
    confidence?: number                 // 置信度(0-1),可选
  }
}
```

**示例**:
```json
{
  "header": {
    "namespace": "SpeechTranscriber",
    "name": "TranscriptionCompleted",
    "status": 20000000,
    "message_id": "4f7d91c4e52b4f0aa3b8c3d2e1f0a9b8",
    "task_id": "task_20250110_123456789",
    "status_text": "OK"
  },
  "payload": {
    "result": "今天天气真不错",
    "index": 1,
    "time": 1500,
    "confidence": 0.98
  }
}
```

### 失败响应

**HTTP Status**: 200 OK (注意:阿里云ASR即使失败也返回200)

**响应体结构**:
```typescript
interface ASRErrorResponse {
  header: {
    namespace: 'SpeechTranscriber'
    name: 'TaskFailed'
    status: number                      // 错误码(非20000000)
    message_id: string
    task_id?: string
    status_text: string                 // 错误描述
  }
  payload?: {}                          // 通常为空
}
```

**示例**:
```json
{
  "header": {
    "namespace": "SpeechTranscriber",
    "name": "TaskFailed",
    "status": 40000003,
    "message_id": "error_msg_123",
    "status_text": "Invalid audio format"
  }
}
```

---

## 错误码定义

### 成功状态码

| 状态码 | 含义 | 处理方式 |
|--------|------|----------|
| 20000000 | 识别成功 | 提取payload.result作为转录文本 |

### 客户端错误 (4xxxx)

| 状态码 | 含义 | 用户提示 | 可重试 |
|--------|------|----------|--------|
| 40000001 | Token无效或过期 | "服务暂时不可用,请稍后重试" | ✅ |
| 40000002 | Token缺失 | "服务暂时不可用,请稍后重试" | ❌ |
| 40000003 | 参数错误(音频格式不支持) | "音频格式不支持,请重新录制" | ❌ |
| 40000004 | 请求体过大 | "音频文件过大,请重新录制" | ❌ |
| 40000013 | 音频时长超过限制(>60s) | "录音时间过长,请控制在60秒内" | ❌ |
| 40000014 | 音频时长过短(<0.5s) | "录音时间过短,请重新录制" | ✅ |
| 40000015 | 音频质量太差,无法识别 | "音频质量较差,建议在安静环境重新录制" | ✅ |
| 40000100 | 并发请求超限 | "服务繁忙,请稍后重试" | ✅ |

### 服务器错误 (5xxxx)

| 状态码 | 含义 | 用户提示 | 可重试 |
|--------|------|----------|--------|
| 50000000 | 服务器内部错误 | "服务暂时不可用,请稍后重试" | ✅ |
| 50000001 | 服务器超时 | "服务响应超时,请重试" | ✅ |
| 50000003 | 服务不可用 | "服务维护中,请稍后重试" | ✅ |

### 网络错误 (非ASR错误码)

| 错误类型 | 触发条件 | 用户提示 | 可重试 |
|---------|---------|----------|--------|
| NETWORK_UNAVAILABLE | fetch()失败,无网络连接 | "无网络连接,请检查网络后重试" | ✅ |
| TIMEOUT | 请求超时(>15秒) | "请求超时,请检查网络后重试" | ✅ |
| PARSE_ERROR | JSON解析失败 | "服务返回数据异常,请重试" | ✅ |

---

## 使用示例

### 完整请求示例

```typescript
/**
 * 调用阿里云一句话识别API
 */
const transcribeAudio = async (
  audioUri: string,
  token: string
): Promise<string> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    // 1. 读取音频文件为Base64
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // 2. 发送请求
    const response = await fetch(
      'https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/aac;samplerate=16000',
          'X-NLS-Token': token,
          'Accept': 'application/json',
        },
        body: audioBase64,
        signal: controller.signal,
      }
    )

    clearTimeout(timeout)

    // 3. 解析响应
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: ASRSuccessResponse | ASRErrorResponse = await response.json()

    // 4. 检查状态码
    if (data.header.status !== 20000000) {
      throw new ASRError(
        data.header.status,
        data.header.status_text
      )
    }

    // 5. 返回识别结果
    return data.payload.result

  } catch (error) {
    clearTimeout(timeout)

    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT')
    }

    if (error instanceof ASRError) {
      throw error
    }

    throw new Error('NETWORK_UNAVAILABLE')
  }
}
```

### 错误处理示例

```typescript
/**
 * ASR错误类
 */
class ASRError extends Error {
  constructor(
    public code: number,
    public statusText: string
  ) {
    super(`ASR_${code}`)
    this.name = 'ASRError'
  }

  /**
   * 是否可重试
   */
  isRetryable(): boolean {
    // Token错误和服务器错误可重试
    return this.code === 40000001 ||
           this.code === 40000014 ||
           this.code === 40000015 ||
           this.code === 40000100 ||
           this.code >= 50000000
  }

  /**
   * 获取用户友好提示
   */
  getUserMessage(): string {
    const messages: Record<number, string> = {
      40000001: '服务暂时不可用,请稍后重试',
      40000003: '音频格式不支持,请重新录制',
      40000013: '录音时间过长,请控制在60秒内',
      40000014: '录音时间过短,请重新录制',
      40000015: '音频质量较差,建议在安静环境重新录制',
      40000100: '服务繁忙,请稍后重试',
      50000000: '服务暂时不可用,请稍后重试',
      50000001: '服务响应超时,请重试',
    }

    return messages[this.code] || '语音识别失败,请重试'
  }
}
```

### 重试逻辑示例

```typescript
/**
 * 带重试的转录函数
 */
const transcribeWithRetry = async (
  audioUri: string,
  token: string,
  maxRetries: number = 3
): Promise<string> => {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await transcribeAudio(audioUri, token)
    } catch (error) {
      lastError = error

      // 只对可重试的错误进行重试
      if (error instanceof ASRError && !error.isRetryable()) {
        throw error
      }

      // 指数退避: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
```

---

## 性能指标

### 预期性能

| 指标 | 目标值 | 备注 |
|------|--------|------|
| API响应时间 | < 3秒 | 2秒音频的识别时间 |
| 音频上传时间 | < 1秒 | 480KB文件在4G网络 |
| 总转录时间 | < 5秒 | 包含上传+处理 |
| 准确率 | > 90% | 清晰普通话环境 |

### 性能监控

```typescript
/**
 * 监控API性能
 */
const monitorASRPerformance = async (
  audioUri: string,
  token: string
) => {
  const startTime = performance.now()

  try {
    const result = await transcribeAudio(audioUri, token)

    const duration = performance.now() - startTime

    // 上报性能数据
    Analytics.logEvent('asr_transcription_success', {
      duration_ms: duration,
      audio_size_kb: fileSize / 1024,
    })

    return result
  } catch (error) {
    const duration = performance.now() - startTime

    Analytics.logEvent('asr_transcription_failed', {
      duration_ms: duration,
      error_code: error.code || 'UNKNOWN',
    })

    throw error
  }
}
```

---

## 配额和限制

### API限制

| 限制项 | 值 | 说明 |
|--------|---|------|
| 单次音频最大时长 | 60秒 | 超过返回40000013 |
| 单次音频最小时长 | 0.5秒 | 少于返回40000014 |
| 最大文件大小 | 2MB | 超过返回40000004 |
| 并发请求数 | 取决于账号配额 | 超过返回40000100 |
| QPS限制 | 取决于账号配额 | 通常为10-100 |

### Token管理

| 属性 | 值 | 说明 |
|------|---|------|
| Token有效期 | 24小时 | 过期后需重新获取 |
| 提前刷新时间 | 提前1小时 | 避免过期 |
| 获取Token频率 | 最多每分钟1次 | 避免频繁请求 |

---

## 安全建议

### ✅ 推荐做法

1. **Token通过后端获取**
   - 前端不直接存储AccessKey
   - 后端生成临时token并设置过期时间
   - 前端定期刷新token

2. **HTTPS传输**
   - 所有请求必须使用HTTPS
   - 验证服务器证书

3. **错误信息过滤**
   - 不向用户暴露技术细节
   - 使用友好的中文提示

4. **请求限流**
   - 客户端限制请求频率
   - 避免被限流或封禁

### ❌ 不推荐做法

1. ❌ 前端硬编码AccessKey
2. ❌ 使用HTTP协议传输
3. ❌ 直接展示API错误消息给用户
4. ❌ 无限制自动重试

---

## 测试用例

### 正常场景

```typescript
describe('阿里云ASR API', () => {
  it('应该成功识别清晰的中文语音', async () => {
    const audioUri = 'path/to/clear_chinese_audio.m4a'
    const token = 'valid_token'

    const result = await transcribeAudio(audioUri, token)

    expect(result).toContain('今天天气')
    expect(result.length).toBeGreaterThan(0)
  })
})
```

### 错误场景

```typescript
describe('阿里云ASR API错误处理', () => {
  it('应该抛出TIMEOUT错误', async () => {
    const audioUri = 'path/to/audio.m4a'
    const token = 'valid_token'

    // 模拟慢速网络
    jest.setTimeout(20000)

    await expect(
      transcribeAudio(audioUri, token)
    ).rejects.toThrow('TIMEOUT')
  })

  it('应该抛出ASR错误40000014(音频过短)', async () => {
    const audioUri = 'path/to/short_audio_0.3s.m4a'
    const token = 'valid_token'

    await expect(
      transcribeAudio(audioUri, token)
    ).rejects.toThrow(ASRError)

    // 验证错误码
    try {
      await transcribeAudio(audioUri, token)
    } catch (error) {
      expect(error.code).toBe(40000014)
      expect(error.isRetryable()).toBe(true)
    }
  })
})
```

---

## 更新日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2025-11-10 | 初始版本,定义API合约 |

---

**合约版本**: 1.0.0
**维护人**: Claude (AI Assistant)
**审核状态**: 待审核
**下一步**: 创建快速开始指南 (quickstart.md)
