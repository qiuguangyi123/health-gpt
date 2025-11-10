import { RecordingOptions, AudioQuality, IOSOutputFormat } from 'expo-audio'

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
 * 阿里云 ASR 要求 16kHz
 * Sample rate in Hz
 * Alibaba Cloud ASR requires 16kHz
 */
export const SAMPLE_RATE = 16000

/**
 * 音频比特率（bps）
 * Audio bit rate in bits per second
 */
export const BIT_RATE = 128000

/**
 * 音频声道数
 * 1 = 单声道（阿里云 ASR 要求）
 * Number of audio channels
 * 1 = mono (required by Alibaba Cloud ASR)
 */
export const NUMBER_OF_CHANNELS = 1

/**
 * Expo Audio 录音预设配置
 * Expo Audio recording preset configuration
 *
 * RecordingOptions 包含两部分：
 * 1. 通用配置（顶层）: extension, sampleRate, numberOfChannels, bitRate
 * 2. 平台特定配置: android, ios, web
 */
export const ASR_RECORDING_PRESET: RecordingOptions = {
  // 通用配置（所有平台共享）
  isMeteringEnabled: true, // 启用音频电平监测
  extension: '.m4a',
  sampleRate: SAMPLE_RATE,
  numberOfChannels: NUMBER_OF_CHANNELS,
  bitRate: BIT_RATE,
  // Android 平台配置
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4', // MPEG_4 格式
    audioEncoder: 'aac', // AAC 编码器
    sampleRate: SAMPLE_RATE,
  },
  // iOS 平台配置
  ios: {
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC, // AAC 格式
    audioQuality: AudioQuality.MAX, // 最高质量（等同于最高比特率）
    sampleRate: SAMPLE_RATE,
  },
  // Web 平台配置
  web: {
    mimeType: 'audio/webm',
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
export const ASR_API_BASE_URL = 'https://nls-gateway.cn-shanghai.aliyuncs.com'

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
export const ASR_APP_KEY = process.env.EXPO_PUBLIC_ALIBABA_ASR_APP_KEY || ''

// ============================================
// 文件存储配置 (File Storage Configuration)
// ============================================

/**
 * 音频文件存储目录名称
 * Audio file storage directory name
 */
export const AUDIO_CACHE_DIR = 'voice_recordings'

/**
 * 音频文件命名前缀
 * Audio file name prefix
 */
export const AUDIO_FILE_PREFIX = 'recording_'

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
