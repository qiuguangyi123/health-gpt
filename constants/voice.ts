import { AudioQuality, IOSOutputFormat, RecordingOptions } from "expo-audio"

/**
 * 语音录制配置常量
 * Voice Recording Configuration Constants
 */

// ============================================
// 录音参数 (Recording Parameters)
// ============================================

/**
 * 最大录音时长（秒）
 * Maximum recording duration in seconds
 */
export const MAX_DURATION = 60

/**
 * 最小录音时长（秒）
 * 低于此时长的录音将被取消
 * Minimum recording duration in seconds
 * Recordings shorter than this will be cancelled
 */
export const MIN_DURATION = 0.5

/**
 * 采样率（Hz）
 * Sample rate in Hz
 *
 * 注意：iOS 设备最兼容的采样率是 44100 Hz
 * 虽然阿里云 ASR 推荐 16kHz，但 44.1kHz 也支持
 * 在实际应用中，ASR 服务会自动进行重采样
 *
 * Note: iOS devices are most compatible with 44100 Hz
 * While Alibaba Cloud ASR recommends 16kHz, 44.1kHz is also supported
 * The ASR service will automatically resample as needed
 */
export const SAMPLE_RATE = 44100

/**
 * 音频比特率（bps）
 * Audio bit rate in bits per second
 */
export const BIT_RATE = 128000

/**
 * 音频声道数
 * Number of audio channels
 *
 * 注意：使用立体声（2）以获得更好的设备兼容性
 * 即使 ASR 推荐单声道，多数服务也支持立体声输入
 *
 * Note: Use stereo (2) for better device compatibility
 * Even though ASR recommends mono, most services support stereo input
 */
export const NUMBER_OF_CHANNELS = 2

/**
 * Expo Audio 录音预设配置
 * Expo Audio recording preset configuration
 *
 * RecordingOptions 包含两部分：
 * 1. 通用配置（顶层）: extension, sampleRate, numberOfChannels, bitRate
 * 2. 平台特定配置: android, ios, web
 *
 * 注意：为了保证在 iOS 真机上的兼容性，使用简化的配置
 * Note: Using simplified config for iOS device compatibility
 */
export const ASR_RECORDING_PRESET: RecordingOptions = {
  // 通用配置（所有平台共享）
  isMeteringEnabled: true, // 启用音频电平监测
  extension: ".m4a",
  sampleRate: SAMPLE_RATE, // 44100 Hz (iPhone 13 标准采样率)
  numberOfChannels: NUMBER_OF_CHANNELS, // 2 (立体声，更好的兼容性)
  bitRate: BIT_RATE, // 128000
  // Android 平台配置
  android: {
    extension: ".m4a",
    outputFormat: 2 as any, // AndroidOutputFormat.MPEG_4
    audioEncoder: 3 as any, // AndroidAudioEncoder.AAC
    sampleRate: SAMPLE_RATE,
  },
  // iOS 平台配置（简化，只保留必需参数）
  ios: {
    extension: ".m4a",
    outputFormat: IOSOutputFormat.MPEG4AAC, // AAC 格式
    audioQuality: AudioQuality.HIGH, // 使用 HIGH，更稳定
  },
  // Web 平台配置
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: BIT_RATE,
  },
}

// ============================================
// 阿里云 ASR API 配置 (Alibaba Cloud ASR API Configuration)
// ============================================

/**
 * ASR API 基础 URL
 * ASR API base URL
 * 注意: 实际项目中应从环境变量读取
 * Note: Should be read from environment variables in production
 */
export const ASR_API_BASE_URL = "https://nls-gateway.cn-shanghai.aliyuncs.com"

/**
 * ASR API 请求超时时间（毫秒）
 * ASR API request timeout in milliseconds
 */
export const ASR_API_TIMEOUT = 15000

/**
 * ASR API 最大重试次数
 * Maximum number of retry attempts for ASR API
 */
export const ASR_MAX_RETRIES = 3

/**
 * ASR API 重试初始延迟（毫秒）
 * Initial retry delay in milliseconds (exponential backoff)
 */
export const ASR_RETRY_DELAY = 1000

/**
 * ASR API 应用 Key
 * 注意: 实际项目中应从环境变量读取
 * ASR API app key
 * Note: Should be read from environment variables in production
 */
export const ASR_APP_KEY = process.env.EXPO_PUBLIC_ALIBABA_ASR_APP_KEY || ""

// ============================================
// 文件存储配置 (File Storage Configuration)
// ============================================

/**
 * 音频文件存储目录名称
 * Audio file storage directory name
 */
export const AUDIO_CACHE_DIR = "voice_recordings"

/**
 * 音频文件命名前缀
 * Audio file name prefix
 */
export const AUDIO_FILE_PREFIX = "recording_"

/**
 * 音频文件过期时间（小时）
 * 应用启动时删除超过此时间的旧文件
 * Audio file expiration time in hours
 * Old files exceeding this time will be deleted on app startup
 */
export const AUDIO_FILE_EXPIRY_HOURS = 24

// ============================================
// UI 反馈配置 (UI Feedback Configuration)
// ============================================

/**
 * 录音启动延迟目标（毫秒）
 * Target recording start latency in milliseconds
 */
export const RECORDING_START_LATENCY_TARGET = 200

/**
 * 取消录音反馈延迟（毫秒）
 * Cancellation feedback delay in milliseconds
 */
export const CANCELLATION_FEEDBACK_DELAY = 100

/**
 * 波形动画帧率（fps）
 * Waveform animation frame rate
 */
export const WAVEFORM_ANIMATION_FPS = 60

/**
 * 波形条数量
 * Number of waveform bars
 */
export const WAVEFORM_BAR_COUNT = 5

/**
 * 录音时长显示更新间隔（毫秒）
 * Recording duration display update interval in milliseconds
 */
export const DURATION_UPDATE_INTERVAL = 100

/**
 * 接近时长限制的警告阈值（秒）
 * Warning threshold when approaching duration limit in seconds
 */
export const DURATION_WARNING_THRESHOLD = 55

// ============================================
// 性能目标 (Performance Targets)
// ============================================

/**
 * 转录完成时间目标（秒）
 * Target transcription completion time in seconds
 */
export const TRANSCRIPTION_TARGET_TIME = 5

/**
 * 完整工作流程时间目标（秒）
 * Total workflow time target in seconds
 */
export const TOTAL_WORKFLOW_TARGET_TIME = 10

/**
 * 转录准确率目标（百分比）
 * Transcription accuracy target percentage
 */
export const TRANSCRIPTION_ACCURACY_TARGET = 90

/**
 * 录音成功率目标（百分比）
 * Recording success rate target percentage
 */
export const RECORDING_SUCCESS_RATE_TARGET = 95

// ============================================
// 错误消息常量 (Error Message Constants)
// ============================================

/**
 * 错误信息接口
 * Error information interface
 */
export interface ErrorMessage {
  title: string // 错误标题
  message: string // 错误描述
  action: string // 主要操作按钮文本
  secondaryAction?: string // 次要操作按钮文本（可选）
}

/**
 * 权限错误消息
 * Permission error messages
 */
export const PERMISSION_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  MICROPHONE_DENIED: {
    title: "需要麦克风权限",
    message: "请在设置中允许应用访问麦克风",
    action: "去设置",
  },
  MICROPHONE_BLOCKED: {
    title: "麦克风被占用",
    message: "其他应用正在使用麦克风，请关闭后重试",
    action: "知道了",
  },
  MICROPHONE_UNAVAILABLE: {
    title: "麦克风不可用",
    message: "无法访问设备麦克风，请检查设备设置",
    action: "知道了",
  },
}

/**
 * 录音错误消息
 * Recording error messages
 */
export const RECORDING_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  TOO_SHORT: {
    title: "录音时间过短",
    message: "请至少录制0.5秒以上的语音",
    action: "重新录制",
  },
  TOO_LONG: {
    title: "录音时间过长",
    message: "单次录音最长60秒，已自动停止",
    action: "确定",
  },
  DEVICE_NOT_SUPPORTED: {
    title: "设备不支持",
    message: "您的设备不支持录音功能",
    action: "知道了",
  },
  RECORDING_FAILED: {
    title: "录音失败",
    message: "录音过程中出现错误，请重试",
    action: "重试",
  },
  RECORDING_INTERRUPTED: {
    title: "录音中断",
    message: "录音被系统中断，请重新录制",
    action: "重新录制",
  },
  STORAGE_FULL: {
    title: "存储空间不足",
    message: "设备存储空间不足，无法保存录音",
    action: "知道了",
  },
}

/**
 * 网络错误消息
 * Network error messages
 */
export const NETWORK_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  OFFLINE: {
    title: "无网络连接",
    message: "语音转文字需要网络连接，请检查网络后重试",
    action: "重试",
  },
  TIMEOUT: {
    title: "请求超时",
    message: "网络连接不稳定，请稍后重试",
    action: "重试",
  },
  SERVER_ERROR: {
    title: "服务暂时不可用",
    message: "服务器出现错误，请稍后重试",
    action: "重试",
  },
  NETWORK_UNSTABLE: {
    title: "网络不稳定",
    message: "当前网络连接不稳定，可能影响识别效果",
    action: "继续",
    secondaryAction: "取消",
  },
}

/**
 * ASR (语音识别) 错误消息
 * ASR (Automatic Speech Recognition) error messages
 */
export const ASR_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  AUTH_FAILED: {
    title: "服务认证失败",
    message: "服务暂时不可用，请稍后重试",
    action: "知道了",
  },
  INVALID_AUDIO: {
    title: "音频格式不支持",
    message: "请重新录制语音",
    action: "重新录制",
  },
  AUDIO_TOO_LONG: {
    title: "音频过长",
    message: "请控制录音时间在60秒内",
    action: "知道了",
  },
  AUDIO_TOO_SHORT: {
    title: "音频过短",
    message: "未能识别到有效语音，请重新录制",
    action: "重新录制",
  },
  POOR_QUALITY: {
    title: "音频质量较差",
    message: "识别置信度较低，建议在安静环境重新录制",
    action: "查看结果",
    secondaryAction: "重新录制",
  },
  NO_SPEECH_DETECTED: {
    title: "未检测到语音",
    message: "录音中没有检测到有效的语音内容",
    action: "重新录制",
  },
  LANGUAGE_NOT_SUPPORTED: {
    title: "语言不支持",
    message: "当前仅支持中文（普通话）识别",
    action: "知道了",
  },
  RATE_LIMIT_EXCEEDED: {
    title: "请求过于频繁",
    message: "请稍后再试",
    action: "知道了",
  },
  SERVICE_UNAVAILABLE: {
    title: "识别服务不可用",
    message: "语音识别服务暂时不可用，请稍后重试",
    action: "重试",
  },
}

/**
 * 通用错误消息
 * General error messages
 */
export const GENERAL_ERROR_MESSAGES: Record<string, ErrorMessage> = {
  UNKNOWN_ERROR: {
    title: "操作失败",
    message: "出现未知错误，请重试",
    action: "重试",
  },
  CANCELLED: {
    title: "已取消",
    message: "操作已取消",
    action: "知道了",
  },
  FILE_NOT_FOUND: {
    title: "文件未找到",
    message: "音频文件不存在或已被删除",
    action: "知道了",
  },
  INVALID_STATE: {
    title: "状态错误",
    message: "当前无法执行此操作",
    action: "知道了",
  },
}

/**
 * 根据错误码获取错误消息
 * Get error message by error code
 *
 * @param errorCode - 错误码
 * @returns 错误消息对象
 */
export const getErrorMessage = (errorCode: string): ErrorMessage => {
  // 按优先级查找错误消息
  return (
    PERMISSION_ERROR_MESSAGES[errorCode] ||
    RECORDING_ERROR_MESSAGES[errorCode] ||
    NETWORK_ERROR_MESSAGES[errorCode] ||
    ASR_ERROR_MESSAGES[errorCode] ||
    GENERAL_ERROR_MESSAGES[errorCode] ||
    GENERAL_ERROR_MESSAGES.UNKNOWN_ERROR
  )
}
