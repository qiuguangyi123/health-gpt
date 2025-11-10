/**
 * 语音识别功能类型定义
 * Voice Recognition Type Definitions
 *
 * 本文件定义语音录制、转录和消息相关的TypeScript类型
 * 设计基于 specs/001-voice-recognition/data-model.md
 *
 * 同时包含聊天界面的通用消息类型（从 app/(tabs)/index.tsx 抽离）
 */

// ============================================
// 录音相关类型 (Recording Types)
// ============================================

/**
 * 录音状态枚举
 * Recording status enumeration
 */
export type RecordingStatus =
  | 'idle' // 未开始
  | 'preparing' // 准备中
  | 'recording' // 录音中
  | 'stopping' // 停止中
  | 'completed' // 录音完成
  | 'cancelled' // 已取消
  | 'failed' // 录音失败

/**
 * 录音错误信息
 * Recording error information
 */
export interface RecordingError {
  /**
   * 错误码
   * 如 'TOO_SHORT', 'DEVICE_NOT_SUPPORTED', 'PERMISSION_DENIED'
   */
  code: string

  /**
   * 错误描述（技术性）
   * Technical error description
   */
  message: string

  /**
   * 错误发生时间戳（毫秒）
   * Error timestamp in milliseconds
   */
  timestamp: number
}

/**
 * 录音会话
 * Voice recording session
 *
 * 表示一次完整的音频录制会话
 * 生命周期: 创建 → 准备 → 录音 → 停止 → 完成/取消/失败 → 清理
 */
export interface VoiceRecording {
  // ========== 唯一标识 ==========

  /**
   * 录音会话ID
   * 格式: "rec_<timestamp>_<random>"
   */
  id: string

  // ========== 录音数据 ==========

  /**
   * 音频文件本地URI
   * 存储位置: FileSystem.cacheDirectory
   */
  uri: string

  /**
   * 录音时长（秒）
   * 范围: 0.5 - 60
   */
  duration: number

  /**
   * 文件大小（字节）
   */
  fileSize: number

  /**
   * 音频格式
   * 固定为 AAC
   */
  format: 'aac'

  // ========== 录音配置 ==========

  /**
   * 采样率（Hz）
   * 固定为 16000（阿里云 ASR 要求）
   */
  sampleRate: 16000

  /**
   * 声道数
   * 固定为 1（单声道，阿里云 ASR 要求）
   */
  channels: 1

  /**
   * 比特率（bps）
   */
  bitRate: number

  // ========== 时间戳 ==========

  /**
   * 开始录音时间戳（毫秒）
   */
  startedAt: number

  /**
   * 停止录音时间戳（毫秒）
   * 可选，仅在录音结束后设置
   */
  stoppedAt?: number

  // ========== 状态 ==========

  /**
   * 录音状态
   * 见 RecordingStatus 类型定义
   */
  status: RecordingStatus

  /**
   * 录音错误信息
   * 仅在 status 为 'failed' 时存在
   */
  error?: RecordingError
}

// ============================================
// 转录相关类型 (Transcription Types)
// ============================================

/**
 * 转录状态枚举
 * Transcription status enumeration
 */
export type TranscriptionStatus =
  | 'pending' // 等待处理
  | 'uploading' // 上传音频中
  | 'processing' // 服务器处理中
  | 'completed' // 转录成功
  | 'failed' // 转录失败

/**
 * 转录错误信息
 * Transcription error information
 */
export interface TranscriptionError {
  /**
   * 错误码
   * 如 'NETWORK_UNAVAILABLE', 'ASR_40000001'
   */
  code: string

  /**
   * 错误描述（技术性）
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
   * Whether the error is retriable (can retry)
   */
  retriable: boolean

  /**
   * 错误发生时间戳（毫秒）
   * Error timestamp in milliseconds
   */
  timestamp: number
}

/**
 * 转录结果
 * Transcription result
 *
 * 表示一次语音转文字处理的结果
 * 生命周期: 创建 → 上传 → 处理 → 完成/失败 → (失败时可重试)
 */
export interface Transcription {
  // ========== 唯一标识 ==========

  /**
   * 转录ID
   * 格式: "trans_<timestamp>_<random>"
   */
  id: string

  /**
   * 关联的录音会话ID
   * 引用 VoiceRecording.id
   */
  recordingId: string

  // ========== 转录结果 ==========

  /**
   * 识别出的文本内容（中文）
   */
  text: string

  /**
   * 置信度（0-1）
   * 可选，取决于 ASR API 返回
   */
  confidence?: number

  /**
   * 语言代码
   * 固定为 'zh-CN'（中文普通话）
   */
  languageCode: 'zh-CN'

  // ========== ASR 服务信息 ==========

  /**
   * 服务提供商
   * 固定为 'alibaba-asr'
   */
  provider: 'alibaba-asr'

  /**
   * ASR 任务ID
   * 可选，用于调试和问题追踪
   */
  taskId?: string

  // ========== 时间信息 ==========

  /**
   * 发起转录请求时间戳（毫秒）
   */
  requestedAt: number

  /**
   * 转录完成时间戳（毫秒）
   * 可选，仅在转录完成后设置
   */
  completedAt?: number

  /**
   * 处理耗时（毫秒）
   * 可选，从 requestedAt 到 completedAt 的时间差
   */
  processingTime?: number

  // ========== 状态 ==========

  /**
   * 转录状态
   * 见 TranscriptionStatus 类型定义
   */
  status: TranscriptionStatus

  /**
   * 转录错误信息
   * 仅在 status 为 'failed' 时存在
   */
  error?: TranscriptionError

  /**
   * 重试次数
   * 初始为 0，每次重试递增
   */
  retryCount: number
}

// ============================================
// 消息相关类型 (Message Types)
// ============================================

/**
 * 语音消息
 * Voice message
 *
 * 表示聊天界面中的一条语音消息
 * 生命周期: 转录完成 → 创建消息 → 添加到聊天历史 → 持久化存储
 */
export interface VoiceMessage {
  // ========== 唯一标识 ==========

  /**
   * 消息ID
   * 格式: "msg_<timestamp>_<random>"
   */
  id: string

  // ========== 消息内容 ==========

  /**
   * 转录后的文本内容（中文）
   */
  text: string

  /**
   * 标记为语音消息
   * 固定为 true，用于与普通文本消息区分
   */
  isVoice: true

  // ========== 元数据 ==========

  /**
   * 原始录音时长（秒）
   * 从 VoiceRecording.duration 传递
   */
  recordingDuration: number

  /**
   * 转录耗时（毫秒）
   * 从 Transcription.processingTime 传递
   */
  transcriptionTime: number

  // ========== 时间信息 ==========

  /**
   * 消息创建时间戳（毫秒）
   */
  createdAt: number

  // ========== 用户信息 ==========

  /**
   * 发送者角色
   * 语音消息固定为 'user'
   */
  role: 'user' | 'assistant'

  // ========== 显示控制 ==========

  /**
   * 是否正在流式显示（转录中）
   * 可选，用于显示加载动画
   */
  isStreaming?: boolean
}

// ============================================
// 辅助类型 (Utility Types)
// ============================================

/**
 * 录音终态
 * Final recording states (no further transitions)
 */
export type RecordingFinalStatus = 'completed' | 'cancelled' | 'failed'

/**
 * 转录终态
 * Final transcription states (no further transitions)
 */
export type TranscriptionFinalStatus = 'completed' | 'failed'

/**
 * 录音活跃状态
 * Active recording states (can transition to other states)
 */
export type RecordingActiveStatus = 'preparing' | 'recording' | 'stopping'

/**
 * 转录活跃状态
 * Active transcription states (can transition to other states)
 */
export type TranscriptionActiveStatus = 'uploading' | 'processing'

// ============================================
// 聊天消息类型 (Chat Message Types)
// ============================================

/**
 * 输入模式
 * Input mode for chat interface
 */
export type InputMode = 'voice' | 'text'

/**
 * 消息发送者类型
 * Message sender type
 */
export type MessageRole = 'user' | 'assistant'

/**
 * 卡片类型
 * Card type for special message content
 */
export type CardType = 'prescription' | 'appointment' | 'normal'

/**
 * 药物信息
 * Medication information for prescription
 */
export interface Medication {
  /**
   * 药物名称
   */
  medicationName: string

  /**
   * 用药剂量
   * 如 "每次2粒，每粒0.25g"
   */
  dosage: string

  /**
   * 用药频次
   * 如 "每日3次"
   */
  frequency: string

  /**
   * 疗程时长
   * 如 "7天"
   */
  duration: string

  /**
   * 第三方应用 Deep Link（可选）
   * 用于跳转到第三方购药应用
   */
  deepLink?: string
}

/**
 * 处方数据
 * Prescription data containing multiple medications
 */
export interface PrescriptionData {
  /**
   * 药物列表
   * 支持多个药物
   */
  medications: Medication[]
}

/**
 * 预约卡片
 * Appointment card information
 */
export interface AppointmentCard {
  /**
   * 预约标题
   */
  title: string

  /**
   * 预约日期
   */
  date: string

  /**
   * 预约地点
   */
  location: string

  /**
   * 第三方应用 Deep Link（可选）
   */
  deepLink?: string
}

/**
 * 聊天消息
 * Chat message in conversation
 *
 * 这是聊天界面的通用消息类型，支持文本、语音、卡片等多种内容
 * 从 app/(tabs)/index.tsx 抽离并增强
 */
export interface ChatMessage {
  // ========== 唯一标识 ==========

  /**
   * 消息ID
   * 格式: 时间戳字符串或自定义ID
   */
  id: string

  // ========== 消息类型和发送者 ==========

  /**
   * 发送者类型
   * 'user' - 用户消息, 'assistant' - AI助手消息
   */
  type: MessageRole

  // ========== 消息内容 ==========

  /**
   * 消息文本内容
   */
  content: string

  // ========== 语音相关（可选）==========

  /**
   * 是否为语音消息
   * 默认为 false（文本消息）
   */
  isVoice?: boolean

  /**
   * 语音时长（秒）
   * 仅当 isVoice 为 true 时存在
   */
  duration?: number

  // ========== 时间信息 ==========

  /**
   * 消息时间戳
   * 使用 Date 对象便于格式化显示
   */
  timestamp: Date

  // ========== 特殊状态 ==========

  /**
   * 是否正在思考中
   * 用于显示 AI 正在生成回复的加载状态
   */
  isThinking?: boolean

  // ========== 卡片相关（可选）==========

  /**
   * 卡片类型
   * 用于显示特殊的结构化内容（如处方、预约等）
   */
  cardType?: CardType

  /**
   * 卡片数据
   * 根据 cardType 的不同，可能是 PrescriptionData 或 AppointmentCard
   */
  cardData?: PrescriptionData | AppointmentCard
}

// ============================================
// 类型守卫 (Type Guards)
// ============================================

/**
 * 检查消息是否为语音消息
 * Check if message is a voice message
 */
export function isVoiceMessage(message: ChatMessage): boolean {
  return message.isVoice === true && typeof message.duration === 'number'
}

/**
 * 检查消息是否包含处方卡片
 * Check if message contains prescription card
 */
export function hasPrescriptionCard(
  message: ChatMessage
): message is ChatMessage & { cardData: PrescriptionData } {
  return message.cardType === 'prescription' && message.cardData !== undefined
}

/**
 * 检查消息是否包含预约卡片
 * Check if message contains appointment card
 */
export function hasAppointmentCard(
  message: ChatMessage
): message is ChatMessage & { cardData: AppointmentCard } {
  return message.cardType === 'appointment' && message.cardData !== undefined
}

/**
 * 检查录音状态是否为终态
 * Check if recording status is final
 */
export function isRecordingFinal(status: RecordingStatus): status is RecordingFinalStatus {
  return status === 'completed' || status === 'cancelled' || status === 'failed'
}

/**
 * 检查转录状态是否为终态
 * Check if transcription status is final
 */
export function isTranscriptionFinal(
  status: TranscriptionStatus
): status is TranscriptionFinalStatus {
  return status === 'completed' || status === 'failed'
}
