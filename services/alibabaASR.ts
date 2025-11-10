/**
 * 阿里云语音识别服务
 * Alibaba Cloud ASR Service
 *
 * 提供一句话识别功能，支持60秒以内的短音频转文字
 * API 文档: specs/001-voice-recognition/contracts/alibaba-asr-api.md
 */

import {
  ASR_MAX_RETRIES,
  ASR_RETRY_DELAY,
  SAMPLE_RATE,
} from "@/constants/voice"
import type { ASRResponse, ASRStatusCode, NetworkErrorType } from "@/types/asr"
import {
  getUserMessage,
  isASRSuccess,
  isRetriable,
  ASRStatusCode as StatusCode,
} from "@/types/asr"
import { asrClient } from "@/utils/request"
import * as FileSystem from "expo-file-system"

// ============================================
// ASR 错误类 (ASR Error Class)
// ============================================

/**
 * ASR 错误类
 * Custom error class for ASR operations
 *
 * 封装阿里云 ASR API 错误和网络错误
 * 提供错误码、用户提示和重试判断
 */
export class ASRError extends Error {
  /**
   * 错误码
   * ASR 状态码或网络错误类型
   */
  public readonly code: ASRStatusCode | NetworkErrorType

  /**
   * 技术性错误描述
   * Technical error description from API
   */
  public readonly statusText: string

  /**
   * 用户友好的错误提示（中文）
   * User-friendly error message in Chinese
   */
  public readonly userMessage: string

  /**
   * 是否可重试
   * Whether this error is retriable
   */
  public readonly retriable: boolean

  /**
   * 任务ID（可选）
   * Task ID from API response, for debugging
   */
  public readonly taskId?: string

  /**
   * 创建 ASR 错误实例
   * @param code 错误码
   * @param statusText 技术性错误描述
   * @param taskId 任务ID（可选）
   */
  constructor(
    code: ASRStatusCode | NetworkErrorType,
    statusText: string,
    taskId?: string
  ) {
    // 设置错误消息为 ASR_错误码 格式
    const errorName = typeof code === "string" ? code : `ASR_${code}`
    super(errorName)

    this.name = "ASRError"
    this.code = code
    this.statusText = statusText
    this.taskId = taskId

    // 从映射表获取用户提示和可重试标记
    this.userMessage = getUserMessage(code)
    this.retriable = isRetriable(code)

    // 维护正确的原型链（TypeScript 继承 Error 的最佳实践）
    Object.setPrototypeOf(this, ASRError.prototype)
  }

  /**
   * 检查是否可重试
   * Check if this error can be retried
   */
  isRetriable(): boolean {
    return this.retriable
  }

  /**
   * 获取用户友好提示
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.userMessage
  }

  /**
   * 检查是否为网络错误
   * Check if this is a network error
   */
  isNetworkError(): boolean {
    return typeof this.code === "string"
  }

  /**
   * 检查是否为服务器错误
   * Check if this is a server error (5xxxx)
   */
  isServerError(): boolean {
    return (
      typeof this.code === "number" &&
      this.code >= 50000000 &&
      this.code < 60000000
    )
  }

  /**
   * 检查是否为客户端错误
   * Check if this is a client error (4xxxx)
   */
  isClientError(): boolean {
    return (
      typeof this.code === "number" &&
      this.code >= 40000000 &&
      this.code < 50000000
    )
  }

  /**
   * 转换为 JSON 对象（用于日志记录）
   * Convert to JSON object for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusText: this.statusText,
      userMessage: this.userMessage,
      retriable: this.retriable,
      taskId: this.taskId,
    }
  }
}

// ============================================
// Token 管理 (Token Management)
// ============================================

/**
 * 获取 ASR Token
 * Get ASR authentication token
 *
 * 注意：这是一个占位符函数
 * 实际项目中应该通过后端 API 获取 token
 *
 * @returns ASR token 字符串
 * @throws {ASRError} 如果 token 获取失败
 */
export async function getASRToken(): Promise<string> {
  // TODO: 实现实际的 token 获取逻辑
  // 应该调用后端 API: GET /api/asr/token
  // 返回: { token: string, expireTime: number }

  // 临时实现：从环境配置读取（仅用于开发）
  const { env } = await import('@/config/env')
  const token = env.alibaba.asrToken

  if (!token) {
    throw new ASRError(
      StatusCode.TOKEN_MISSING,
      "ASR token not configured in environment",
      undefined
    )
  }

  return token
}

// ============================================
// 音频转录 (Audio Transcription)
// ============================================

/**
 * 调用阿里云一句话识别 API
 * Call Alibaba Cloud ASR API for audio transcription
 *
 * @param audioUri 音频文件本地 URI
 * @param token ASR 认证 token
 * @returns 识别结果文本
 * @throws {ASRError} 如果转录失败
 */
export async function transcribeAudio(
  audioUri: string,
  token: string
): Promise<string> {
  // 1. 读取音频文件为 Base64
  const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  // 2. 发送请求到阿里云 ASR API（使用 axios）
  const data = (await asrClient.post<ASRResponse>(
    "/stream/v1/asr",
    audioBase64,
    {
      headers: {
        "Content-Type": `audio/aac;samplerate=${SAMPLE_RATE}`,
        "X-NLS-Token": token,
      },
    }
  )) as unknown as ASRResponse

  // 3. 检查 ASR 状态码
  if (!isASRSuccess(data)) {
    throw new ASRError(
      data.header.status,
      data.header.status_text,
      data.header.task_id
    )
  }

  // 4. 返回识别结果
  return data.payload.result
}
// ============================================
// 重试逻辑 (Retry Logic)
// ============================================

/**
 * 带指数退避重试的转录函数
 * Transcribe audio with exponential backoff retry
 *
 * @param audioUri 音频文件本地 URI
 * @param token ASR 认证 token
 * @param maxRetries 最大重试次数（默认 3 次）
 * @returns 识别结果文本
 * @throws {ASRError} 如果所有重试都失败
 */
export async function transcribeWithRetry(
  audioUri: string,
  token: string,
  maxRetries: number = ASR_MAX_RETRIES
): Promise<string> {
  let lastError: ASRError

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 尝试转录
      return await transcribeAudio(audioUri, token)
    } catch (error) {
      // 只处理 ASRError
      if (!(error instanceof ASRError)) {
        throw error
      }

      lastError = error

      // 如果不可重试，立即抛出错误
      if (!error.isRetriable()) {
        throw error
      }

      // 如果是最后一次尝试，抛出错误
      if (attempt >= maxRetries - 1) {
        break
      }

      // 指数退避：1s, 2s, 4s
      const delay = Math.pow(2, attempt) * ASR_RETRY_DELAY
      await new Promise(resolve => setTimeout(resolve, delay))

      // 可选：记录重试日志
      console.log(`ASR 重试 ${attempt + 1}/${maxRetries}，延迟 ${delay}ms`)
    }
  }

  // 所有重试都失败，抛出最后一个错误
  throw lastError!
}

// ============================================
// 导出 (Exports)
// ============================================

/**
 * 默认导出转录函数（带重试）
 * Default export with retry
 */
export default transcribeWithRetry
