/**
 * 阿里云 ASR 类型定义
 * Alibaba Cloud ASR Type Definitions
 *
 * 本文件定义阿里云智能语音交互(ISI)服务的类型
 * 使用一句话识别功能实现60秒以内的短音频转文字
 *
 * API文档: specs/001-voice-recognition/contracts/alibaba-asr-api.md
 */

// ============================================
// ASR 响应类型 (ASR Response Types)
// ============================================

/**
 * ASR 响应头
 * ASR response header
 */
export interface ASRResponseHeader {
  /**
   * 命名空间
   * 固定为 'SpeechTranscriber'
   */
  namespace: 'SpeechTranscriber'

  /**
   * 响应名称
   * - TranscriptionResultChanged: 中间结果
   * - TranscriptionCompleted: 最终结果
   * - TaskFailed: 任务失败
   */
  name: 'TranscriptionResultChanged' | 'TranscriptionCompleted' | 'TaskFailed'

  /**
   * 状态码
   * - 20000000: 成功
   * - 4xxxxxxx: 客户端错误
   * - 5xxxxxxx: 服务器错误
   */
  status: number

  /**
   * 消息ID
   * 用于请求追踪
   */
  message_id: string

  /**
   * 任务ID
   * 可选，用于问题追踪和技术支持
   */
  task_id?: string

  /**
   * 状态文本描述
   * 成功时为 'OK'，失败时为错误描述
   */
  status_text: string
}

/**
 * ASR 成功响应载荷
 * ASR success response payload
 */
export interface ASRSuccessPayload {
  /**
   * 识别结果文本（中文）
   * Recognized text in Chinese
   */
  result: string

  /**
   * 句子索引
   * 从 1 开始
   */
  index: number

  /**
   * 时间戳（毫秒）
   * Timestamp in milliseconds
   */
  time: number

  /**
   * 置信度（0-1）
   * 可选，表示识别结果的可信程度
   * Confidence score (0-1), optional
   */
  confidence?: number
}

/**
 * ASR 成功响应
 * ASR success response
 */
export interface ASRSuccessResponse {
  /**
   * 响应头
   */
  header: ASRResponseHeader

  /**
   * 响应载荷
   */
  payload: ASRSuccessPayload
}

/**
 * ASR 失败响应
 * ASR error response
 *
 * 注意：阿里云 ASR 即使失败也返回 HTTP 200 OK
 * Note: Alibaba Cloud ASR returns HTTP 200 even for errors
 */
export interface ASRErrorResponse {
  /**
   * 响应头
   * status 字段为非 20000000 的错误码
   */
  header: ASRResponseHeader

  /**
   * 响应载荷
   * 失败时通常为空对象
   */
  payload?: Record<string, never>
}

/**
 * ASR 响应联合类型
 * Union type for ASR response
 */
export type ASRResponse = ASRSuccessResponse | ASRErrorResponse

// ============================================
// ASR 错误码 (ASR Error Codes)
// ============================================

/**
 * ASR 状态码
 * ASR status codes
 */
export enum ASRStatusCode {
  // ========== 成功状态码 ==========
  /**
   * 识别成功
   * Recognition successful
   */
  SUCCESS = 20000000,

  // ========== 客户端错误 (4xxxx) ==========

  /**
   * Token 无效或过期
   * Invalid or expired token
   */
  TOKEN_INVALID = 40000001,

  /**
   * Token 缺失
   * Token missing
   */
  TOKEN_MISSING = 40000002,

  /**
   * 参数错误（音频格式不支持）
   * Invalid parameter (unsupported audio format)
   */
  INVALID_PARAMETER = 40000003,

  /**
   * 请求体过大（>2MB）
   * Request body too large
   */
  REQUEST_TOO_LARGE = 40000004,

  /**
   * 音频时长超过限制（>60s）
   * Audio duration exceeds limit
   */
  AUDIO_TOO_LONG = 40000013,

  /**
   * 音频时长过短（<0.5s）
   * Audio duration too short
   */
  AUDIO_TOO_SHORT = 40000014,

  /**
   * 音频质量太差，无法识别
   * Audio quality too poor to recognize
   */
  AUDIO_QUALITY_POOR = 40000015,

  /**
   * 并发请求超限
   * Concurrent requests exceeded
   */
  CONCURRENT_LIMIT_EXCEEDED = 40000100,

  // ========== 服务器错误 (5xxxx) ==========

  /**
   * 服务器内部错误
   * Internal server error
   */
  SERVER_INTERNAL_ERROR = 50000000,

  /**
   * 服务器超时
   * Server timeout
   */
  SERVER_TIMEOUT = 50000001,

  /**
   * 服务不可用
   * Service unavailable
   */
  SERVICE_UNAVAILABLE = 50000003,
}

/**
 * 网络错误类型
 * Network error types
 *
 * 这些不是 ASR API 返回的错误码，而是客户端网络层的错误
 * These are not ASR API error codes, but client-side network errors
 */
export enum NetworkErrorType {
  /**
   * 无网络连接
   * No network connection
   */
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',

  /**
   * 请求超时（>15秒）
   * Request timeout
   */
  TIMEOUT = 'TIMEOUT',

  /**
   * JSON 解析失败
   * JSON parse error
   */
  PARSE_ERROR = 'PARSE_ERROR',
}

// ============================================
// 错误信息映射 (Error Message Mapping)
// ============================================

/**
 * ASR 错误信息
 * ASR error information
 */
export interface ASRErrorInfo {
  /**
   * 错误码（数字或字符串）
   * Error code (number for ASR codes, string for network errors)
   */
  code: ASRStatusCode | NetworkErrorType

  /**
   * 技术性错误描述
   * Technical error description
   */
  message: string

  /**
   * 用户友好的错误提示（中文）
   * User-friendly error message in Chinese
   */
  userMessage: string

  /**
   * 是否可重试
   * Whether the error is retriable
   */
  retriable: boolean
}

/**
 * ASR 错误码映射表
 * ASR error code mapping
 *
 * 将错误码映射到用户友好的中文提示和可重试标记
 */
export const ASR_ERROR_MAP: Record<ASRStatusCode, Omit<ASRErrorInfo, 'code'>> = {
  // 成功状态码
  [ASRStatusCode.SUCCESS]: {
    message: 'Recognition successful',
    userMessage: '识别成功',
    retriable: false,
  },

  // 客户端错误
  [ASRStatusCode.TOKEN_INVALID]: {
    message: 'Invalid or expired token',
    userMessage: '服务暂时不可用，请稍后重试',
    retriable: true, // Token 可以刷新后重试
  },

  [ASRStatusCode.TOKEN_MISSING]: {
    message: 'Token missing',
    userMessage: '服务暂时不可用，请稍后重试',
    retriable: false, // 客户端配置错误，不应重试
  },

  [ASRStatusCode.INVALID_PARAMETER]: {
    message: 'Invalid audio format',
    userMessage: '音频格式不支持，请重新录制',
    retriable: false, // 格式错误，重新录制也会失败
  },

  [ASRStatusCode.REQUEST_TOO_LARGE]: {
    message: 'Request body too large',
    userMessage: '音频文件过大，请重新录制',
    retriable: false, // 文件太大，需要重新录制
  },

  [ASRStatusCode.AUDIO_TOO_LONG]: {
    message: 'Audio duration exceeds 60 seconds',
    userMessage: '录音时间过长，请控制在60秒内',
    retriable: false, // 时长限制，需要重新录制
  },

  [ASRStatusCode.AUDIO_TOO_SHORT]: {
    message: 'Audio duration less than 0.5 seconds',
    userMessage: '录音时间过短，请重新录制',
    retriable: true, // 用户可以重新录制
  },

  [ASRStatusCode.AUDIO_QUALITY_POOR]: {
    message: 'Audio quality too poor',
    userMessage: '音频质量较差，建议在安静环境重新录制',
    retriable: true, // 环境因素，可以在更好的环境重试
  },

  [ASRStatusCode.CONCURRENT_LIMIT_EXCEEDED]: {
    message: 'Concurrent requests limit exceeded',
    userMessage: '服务繁忙，请稍后重试',
    retriable: true, // 稍后重试可能成功
  },

  // 服务器错误（都可重试）
  [ASRStatusCode.SERVER_INTERNAL_ERROR]: {
    message: 'Internal server error',
    userMessage: '服务暂时不可用，请稍后重试',
    retriable: true,
  },

  [ASRStatusCode.SERVER_TIMEOUT]: {
    message: 'Server timeout',
    userMessage: '服务响应超时，请重试',
    retriable: true,
  },

  [ASRStatusCode.SERVICE_UNAVAILABLE]: {
    message: 'Service unavailable',
    userMessage: '服务维护中，请稍后重试',
    retriable: true,
  },
}

/**
 * 网络错误映射表
 * Network error mapping
 */
export const NETWORK_ERROR_MAP: Record<NetworkErrorType, Omit<ASRErrorInfo, 'code'>> = {
  [NetworkErrorType.NETWORK_UNAVAILABLE]: {
    message: 'No network connection',
    userMessage: '无网络连接，请检查网络后重试',
    retriable: true,
  },

  [NetworkErrorType.TIMEOUT]: {
    message: 'Request timeout after 15 seconds',
    userMessage: '请求超时，请检查网络后重试',
    retriable: true,
  },

  [NetworkErrorType.PARSE_ERROR]: {
    message: 'Failed to parse server response',
    userMessage: '服务返回数据异常，请重试',
    retriable: true,
  },
}

// ============================================
// 类型守卫 (Type Guards)
// ============================================

/**
 * 检查响应是否为成功响应
 * Check if response is successful
 */
export function isASRSuccess(response: ASRResponse): response is ASRSuccessResponse {
  return (
    response.header.status === ASRStatusCode.SUCCESS &&
    response.payload !== undefined &&
    'result' in response.payload
  )
}

/**
 * 检查响应是否为错误响应
 * Check if response is error
 */
export function isASRError(response: ASRResponse): response is ASRErrorResponse {
  return response.header.status !== ASRStatusCode.SUCCESS
}

/**
 * 检查错误码是否可重试
 * Check if error code is retriable
 */
export function isRetriable(code: ASRStatusCode | NetworkErrorType): boolean {
  if (typeof code === 'string') {
    // 网络错误
    return NETWORK_ERROR_MAP[code]?.retriable ?? false
  }

  // ASR 错误码
  return ASR_ERROR_MAP[code]?.retriable ?? false
}

/**
 * 获取错误的用户提示消息
 * Get user-friendly error message
 */
export function getUserMessage(code: ASRStatusCode | NetworkErrorType): string {
  if (typeof code === 'string') {
    return NETWORK_ERROR_MAP[code]?.userMessage ?? '未知错误，请重试'
  }

  return ASR_ERROR_MAP[code]?.userMessage ?? '语音识别失败，请重试'
}

/**
 * 检查错误码是否为服务器错误
 * Check if error code is server error
 */
export function isServerError(code: ASRStatusCode): boolean {
  return code >= 50000000 && code < 60000000
}

/**
 * 检查错误码是否为客户端错误
 * Check if error code is client error
 */
export function isClientError(code: ASRStatusCode): boolean {
  return code >= 40000000 && code < 50000000
}
