import { useState, useCallback } from 'react'
import { transcribeWithRetry, getASRToken, ASRError } from '@/services/alibabaASR'
import { deleteAudioFile } from '@/services/audioStorage'
import type {
  TranscriptionStatus,
  TranscriptionError,
} from '@/types/voice'

/**
 * 阿里云 ASR Hook
 * Alibaba Cloud ASR Hook
 *
 * 管理语音转文字的完整流程:
 * 1. Token 获取
 * 2. 音频上传和识别
 * 3. 重试逻辑
 * 4. 错误处理
 * 5. 音频文件清理
 *
 * Manages complete speech-to-text workflow:
 * 1. Token retrieval
 * 2. Audio upload and recognition
 * 3. Retry logic
 * 4. Error handling
 * 5. Audio file cleanup
 *
 * @example
 * ```tsx
 * const {
 *   status,
 *   transcription,
 *   error,
 *   transcribe,
 *   retry,
 *   cancel,
 * } = useAlibabaASR()
 *
 * // 转录音频
 * const result = await transcribe(audioUri)
 * if (result.success) {
 *   console.log('转录结果:', result.text)
 * }
 * ```
 */

// ============================================
// 类型定义 (Type Definitions)
// ============================================

/**
 * 转录结果
 * Transcription result
 */
export interface TranscriptionResult {
  /** 转录文本 */
  text: string | null
  /** 是否成功 */
  success: boolean
  /** 处理耗时（毫秒） */
  processingTime: number
  /** 错误信息 */
  error?: TranscriptionError
  /** 任务ID */
  taskId?: string
}

/**
 * Hook 返回值
 * Hook return value
 */
export interface UseAlibabaASRReturn {
  /** 当前转录状态 */
  status: TranscriptionStatus
  /** 转录文本 */
  transcription: string | null
  /** 是否正在转录 */
  isTranscribing: boolean
  /** 错误信息 */
  error: TranscriptionError | null
  /** 处理耗时（毫秒） */
  processingTime: number
  /** 重试次数 */
  retryCount: number
  /** 开始转录 */
  transcribe: (audioUri: string, deleteAfter?: boolean) => Promise<TranscriptionResult>
  /** 重试转录 */
  retry: (audioUri: string) => Promise<TranscriptionResult>
  /** 取消转录 */
  cancel: () => void
  /** 重置状态 */
  reset: () => void
}

// ============================================
// Hook 实现 (Hook Implementation)
// ============================================

export const useAlibabaASR = (): UseAlibabaASRReturn => {
  // ========== 状态管理 ==========
  const [status, setStatus] = useState<TranscriptionStatus>('pending')
  const [transcription, setTranscription] = useState<string | null>(null)
  const [error, setError] = useState<TranscriptionError | null>(null)
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [retryCount, setRetryCount] = useState<number>(0)
  const [currentAudioUri, setCurrentAudioUri] = useState<string | null>(null)

  // ========== 计算属性 ==========
  const isTranscribing = status === 'uploading' || status === 'processing'

  // ========== 转录控制 ==========

  /**
   * 开始转录
   * Start transcription
   *
   * @param audioUri - 音频文件 URI
   * @param deleteAfter - 转录后是否删除音频文件（默认 true）
   * @returns 转录结果
   */
  const transcribe = useCallback(
    async (
      audioUri: string,
      deleteAfter: boolean = true
    ): Promise<TranscriptionResult> => {
      const startTime = Date.now()

      try {
        console.log('[useAlibabaASR] Starting transcription...')
        setStatus('uploading')
        setError(null)
        setTranscription(null)
        setProcessingTime(0)
        setCurrentAudioUri(audioUri)

        // 1. 获取 ASR Token
        let token: string
        try {
          token = await getASRToken()
        } catch (err) {
          throw new ASRError(
            'TOKEN_MISSING',
            'Failed to get ASR token',
            undefined
          )
        }

        // 2. 上传并转录
        setStatus('processing')
        const text = await transcribeWithRetry(audioUri, token)

        // 3. 计算处理耗时
        const elapsed = Date.now() - startTime
        setProcessingTime(elapsed)

        // 4. 转录成功，删除音频文件（如果需要）
        if (deleteAfter) {
          await deleteAudioFile(audioUri)
          console.log(
            '[useAlibabaASR] Audio file deleted after successful transcription'
          )
        }

        // 5. 更新状态
        setStatus('completed')
        setTranscription(text)
        setCurrentAudioUri(null)

        console.log(
          `[useAlibabaASR] Transcription completed in ${elapsed}ms: "${text}"`
        )

        return {
          text,
          success: true,
          processingTime: elapsed,
        }
      } catch (err) {
        const elapsed = Date.now() - startTime
        setProcessingTime(elapsed)

        console.error('[useAlibabaASR] Transcription failed:', err)

        // 处理 ASRError
        if (err instanceof ASRError) {
          const transcriptionError: TranscriptionError = {
            code: typeof err.code === 'string' ? err.code : `ASR_${err.code}`,
            message: err.message,
            userMessage: err.getUserMessage(),
            retryable: err.isRetriable(),
            timestamp: Date.now(),
          }

          setError(transcriptionError)
          setStatus('failed')

          // 如果不可重试，删除音频文件
          if (!err.isRetriable() && deleteAfter) {
            await deleteAudioFile(audioUri)
            console.log(
              '[useAlibabaASR] Audio file deleted after non-retriable error'
            )
          }

          return {
            text: null,
            success: false,
            processingTime: elapsed,
            error: transcriptionError,
            taskId: err.taskId,
          }
        }

        // 处理其他错误
        const errorMessage = err instanceof Error ? err.message : String(err)
        const genericError: TranscriptionError = {
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
          userMessage: '转录失败，请重试',
          retryable: true,
          timestamp: Date.now(),
        }

        setError(genericError)
        setStatus('failed')

        return {
          text: null,
          success: false,
          processingTime: elapsed,
          error: genericError,
        }
      }
    },
    []
  )

  /**
   * 重试转录
   * Retry transcription
   *
   * 使用相同的音频文件重试转录
   * Retry transcription with the same audio file
   *
   * @param audioUri - 音频文件 URI
   * @returns 转录结果
   */
  const retry = useCallback(
    async (audioUri: string): Promise<TranscriptionResult> => {
      console.log(`[useAlibabaASR] Retrying transcription (attempt ${retryCount + 1})...`)
      setRetryCount((prev) => prev + 1)
      return transcribe(audioUri, true)
    },
    [retryCount, transcribe]
  )

  /**
   * 取消转录
   * Cancel transcription
   *
   * 注意：实际的网络请求无法取消，此函数仅重置状态
   * Note: Actual network requests cannot be cancelled, this only resets state
   */
  const cancel = useCallback(() => {
    console.log('[useAlibabaASR] Cancelling transcription...')
    setStatus('pending')
    setError(null)
    setTranscription(null)
    setProcessingTime(0)
    setCurrentAudioUri(null)
  }, [])

  /**
   * 重置状态
   * Reset state
   */
  const reset = useCallback(() => {
    console.log('[useAlibabaASR] Resetting state...')
    setStatus('pending')
    setError(null)
    setTranscription(null)
    setProcessingTime(0)
    setRetryCount(0)
    setCurrentAudioUri(null)
  }, [])

  // ========== 返回值 ==========

  return {
    status,
    transcription,
    isTranscribing,
    error,
    processingTime,
    retryCount,
    transcribe,
    retry,
    cancel,
    reset,
  }
}
