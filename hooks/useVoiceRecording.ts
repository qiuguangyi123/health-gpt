import {
  ASR_RECORDING_PRESET,
  DURATION_UPDATE_INTERVAL,
  MAX_DURATION,
  MIN_DURATION,
} from "@/constants/voice"
import {
  deleteAudioFile,
  ensureAudioCacheDirectoryExists,
  getAudioFileInfo,
} from "@/services/audioStorage"
import type { RecordingError, RecordingStatus } from "@/types/voice"
import { ensureMicrophonePermission } from "@/utils/permissions"
import {
  AudioQuality,
  AudioRecorder,
  IOSOutputFormat,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioRecorder,
} from "expo-audio"
import * as Haptics from "expo-haptics"
import { useCallback, useEffect, useRef, useState } from "react"
import { Platform } from "react-native"

/**
 * 语音录制 Hook
 * Voice Recording Hook
 *
 * 管理完整的录音生命周期:
 * 1. 权限检查和请求
 * 2. 录音器准备和初始化
 * 3. 录音开始/停止控制
 * 4. 录音时长追踪
 * 5. 文件管理和清理
 * 6. 触觉反馈
 * 7. 错误处理
 *
 * Manages complete recording lifecycle:
 * 1. Permission check and request
 * 2. Recorder preparation and initialization
 * 3. Recording start/stop control
 * 4. Duration tracking
 * 5. File management and cleanup
 * 6. Haptic feedback
 * 7. Error handling
 *
 * @example
 * ```tsx
 * const {
 *   status,
 *   duration,
 *   audioUri,
 *   startRecording,
 *   stopRecording,
 *   cancelRecording,
 *   error,
 * } = useVoiceRecording()
 *
 * // 开始录音
 * await startRecording()
 *
 * // 停止录音
 * const result = await stopRecording()
 * if (result.audioUri) {
 *   console.log('录音成功:', result.audioUri)
 * }
 * ```
 */

// ============================================
// 类型定义 (Type Definitions)
// ============================================

/**
 * 录音结果
 * Recording result
 */
export interface RecordingResult {
  /** 音频文件 URI */
  audioUri: string | null
  /** 录音时长（秒） */
  duration: number
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: RecordingError
}

/**
 * Hook 返回值
 * Hook return value
 */
export interface UseVoiceRecordingReturn {
  /** 当前录音状态 */
  status: RecordingStatus
  /** 录音时长（秒） */
  duration: number
  /** 音频文件 URI */
  audioUri: string | null
  /** 是否正在录音 */
  isRecording: boolean
  /** 是否可以开始录音 */
  canStartRecording: boolean
  /** 错误信息 */
  error: RecordingError | null
  /** 开始录音 */
  startRecording: () => Promise<boolean>
  /** 停止录音 */
  stopRecording: () => Promise<RecordingResult>
  /** 取消录音 */
  cancelRecording: () => Promise<void>
  /** 清理当前录音 */
  cleanup: () => Promise<void>
}

// ============================================
// Hook 实现 (Hook Implementation)
// ============================================

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  // ========== 状态管理 ==========
  const [status, setStatus] = useState<RecordingStatus>("idle")
  const [duration, setDuration] = useState<number>(0)
  const [audioUri, setAudioUri] = useState<string | null>(null)
  const [error, setError] = useState<RecordingError | null>(null)

  // ========== Refs ==========
  const durationIntervalRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const recorderRef = useRef<AudioRecorder | null>(null)

  // ========== 初始化录音器（使用空配置，稍后在 prepare 时传入完整配置）==========
  // 注意：不直接传入配置，避免初始化时配置问题导致 native 对象创建失败
  const recorder = useAudioRecorder({
    extension: ".m4a",
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    android: {
      extension: ".m4a",
      outputFormat: "mpeg4" as any,
      audioEncoder: "aac" as any,
    },
    ios: {
      extension: ".m4a",
      outputFormat: IOSOutputFormat.MPEG4AAC,
      audioQuality: AudioQuality.HIGH,
    },
  })

  // 保存 recorder 引用
  useEffect(() => {
    recorderRef.current = recorder
  }, [recorder])

  // ========== 计算属性 ==========
  const isRecording = status === "recording"
  const canStartRecording =
    status === "idle" || status === "completed" || status === "cancelled"

  // ========== 清理函数 ==========

  /**
   * 清理时长计时器
   * Clear duration interval
   */
  const clearDurationInterval = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
  }, [])

  /**
   * 启动时长计时器
   * Start duration interval
   */
  const startDurationInterval = useCallback(() => {
    clearDurationInterval()

    durationIntervalRef.current = setInterval(async () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      setDuration(elapsed)

      // 达到最大时长，自动停止
      if (elapsed >= MAX_DURATION) {
        clearInterval(durationIntervalRef.current!)
        durationIntervalRef.current = null

        // 触觉反馈
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        )

        // 标记为即将停止
        console.log("[useVoiceRecording] Max duration reached, auto-stopping")
      }
    }, DURATION_UPDATE_INTERVAL)
  }, [clearDurationInterval])

  /**
   * 清理当前录音
   * Cleanup current recording
   */
  const cleanup = useCallback(async () => {
    // 清理计时器
    clearDurationInterval()

    // 停止录音（如果正在录音）
    if (recorder.isRecording) {
      try {
        await recorder.stop()
      } catch (error) {
        console.error("[useVoiceRecording] Failed to stop recorder:", error)
      }
    }

    // 删除音频文件
    if (audioUri) {
      await deleteAudioFile(audioUri)
      setAudioUri(null)
    }

    // 重置状态
    setStatus("idle")
    setDuration(0)
    setError(null)
  }, [audioUri, clearDurationInterval, recorder])

  // ========== 录音控制 ==========

  /**
   * 开始录音
   * Start recording
   *
   * @returns 是否成功开始录音
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[useVoiceRecording] Starting recording...")
      setStatus("preparing")
      setError(null)
      setDuration(0)

      // 1. 确保音频缓存目录存在
      await ensureAudioCacheDirectoryExists()

      // 2. 检查并请求麦克风权限
      const hasPermission = await ensureMicrophonePermission(true)
      console.log("[useVoiceRecording] Permission granted:", hasPermission)
      if (!hasPermission) {
        setError({
          code: "MICROPHONE_DENIED",
          message: "Microphone permission denied",
          timestamp: Date.now(),
        })
        setStatus("failed")
        return false
      }

      // 3. 重新配置音频会话（确保处于正确状态）
      // 这一步很重要，特别是在真机上
      console.log("[useVoiceRecording] Configuring audio session...")
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: Platform.OS === "ios",
          ...(Platform.OS === "ios"
            ? {
                shouldPlayInBackground: false,
                staysActiveInBackground: false,
              }
            : {}),
        })
        await setIsAudioActiveAsync(true)
        console.log("[useVoiceRecording] Audio session configured")
      } catch (audioError) {
        console.error(
          "[useVoiceRecording] Failed to configure audio session:",
          audioError
        )
        setError({
          code: "DEVICE_NOT_SUPPORTED",
          message:
            audioError instanceof Error
              ? audioError.message
              : "Failed to configure audio session",
          timestamp: Date.now(),
        })
        setStatus("failed")
        return false
      }

      // 4. 检查录音器当前状态
      const recorderStatus = recorder.getStatus()
      console.log("[useVoiceRecording] Recorder status:", recorderStatus)

      // 如果已经在录音，先停止
      if (recorder.isRecording) {
        console.warn(
          "[useVoiceRecording] Recorder is already recording, stopping first"
        )
        try {
          await recorder.stop()
        } catch (error) {
          console.error(
            "[useVoiceRecording] Failed to stop existing recording:",
            error
          )
        }
      }

      // 5. 准备录音器
      // 注意：prepareToRecordAsync() 每次录音前都需要调用
      // 这会重置录音器状态并准备新的录音
      // 重新传入配置以确保使用正确的录音参数
      console.log(
        "[useVoiceRecording] Recording config:",
        JSON.stringify(ASR_RECORDING_PRESET, null, 2)
      )
      try {
        await recorder.prepareToRecordAsync(ASR_RECORDING_PRESET)
        console.log("[useVoiceRecording] Recorder prepared successfully")

        // 再次检查状态
        const statusAfterPrepare = recorder.getStatus()
        console.log(
          "[useVoiceRecording] Recorder status after prepare:",
          statusAfterPrepare
        )

        if (!statusAfterPrepare.canRecord) {
          throw new Error(
            "Recorder prepared but canRecord is still false. This may indicate an incompatible audio configuration."
          )
        }
      } catch (prepareError) {
        console.error(
          "[useVoiceRecording] Failed to prepare recorder:",
          prepareError
        )
        setError({
          code: "DEVICE_NOT_SUPPORTED",
          message:
            prepareError instanceof Error
              ? prepareError.message
              : "Failed to prepare audio recorder",
          timestamp: Date.now(),
        })
        setStatus("failed")
        return false
      }

      // 6. 开始录音
      recorder.record()

      // 7. 等待录音器真正开始（最多等待 500ms）
      // 原因：recorder.record() 是同步调用，但内部启动是异步的
      // 需要等待 recorder.isRecording 变为 true
      let attempts = 0
      const maxAttempts = 10 // 10 * 50ms = 500ms 最大等待时间
      while (!recorder.isRecording && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 50))
        attempts++
      }

      // 检查录音器是否真正启动
      if (!recorder.isRecording) {
        console.error(
          `[useVoiceRecording] Recorder failed to start after ${
            attempts * 50
          }ms`
        )
        setError({
          code: "DEVICE_NOT_SUPPORTED",
          message: "Audio recorder failed to start",
          timestamp: Date.now(),
        })
        setStatus("failed")
        return false
      }

      console.log(
        `[useVoiceRecording] Recorder started after ${attempts * 50}ms`
      )

      // 8. 触觉反馈
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      // 9. 更新状态
      setStatus("recording")
      startTimeRef.current = Date.now()
      startDurationInterval()

      console.log("[useVoiceRecording] Recording started")
      return true
    } catch (err) {
      console.error("[useVoiceRecording] Failed to start recording:", err)

      const errorMessage = err instanceof Error ? err.message : String(err)
      setError({
        code: "RECORDING_FAILED",
        message: errorMessage,
        timestamp: Date.now(),
      })
      setStatus("failed")

      return false
    }
  }, [recorder, startDurationInterval])

  /**
   * 停止录音
   * Stop recording
   *
   * @returns 录音结果
   */
  const stopRecording = useCallback(async (): Promise<RecordingResult> => {
    try {
      console.log("[useVoiceRecording] Stopping recording...")

      // 1. 停止计时器
      clearDurationInterval()

      // 2. 检查是否真的在录音
      if (status !== "recording") {
        console.warn("[useVoiceRecording] Not in recording state:", status)
        return {
          audioUri: null,
          duration: 0,
          success: false,
          error: {
            code: "INVALID_STATE",
            message: "Not in recording state",
            timestamp: Date.now(),
          },
        }
      }

      setStatus("stopping")

      // 3. 计算实际时长
      const finalDuration = (Date.now() - startTimeRef.current) / 1000

      // 4. 停止录音器（如果还在录音中）
      // 注意：由于录音器启动是异步的，可能存在状态不一致的情况
      // 如果录音器还未真正开始，直接返回时长过短的错误
      if (!recorder.isRecording) {
        console.warn(
          `[useVoiceRecording] Recorder stopped before fully starting (duration: ${finalDuration}s)`
        )
        setStatus("cancelled")
        return {
          audioUri: null,
          duration: finalDuration,
          success: false,
          error: {
            code: "TOO_SHORT",
            message: `Recording stopped too quickly (${finalDuration}s)`,
            timestamp: Date.now(),
          },
        }
      }

      await recorder.stop()
      const uri = recorder.uri

      if (!uri) {
        throw new Error("No audio URI returned from recorder")
      }

      setAudioUri(uri)

      // 4. 触觉反馈
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      // 5. 检查时长是否满足最小要求
      if (finalDuration < MIN_DURATION) {
        console.log(
          `[useVoiceRecording] Recording too short: ${finalDuration}s < ${MIN_DURATION}s`
        )

        // 删除音频文件
        await deleteAudioFile(uri)

        // 触觉反馈（错误）
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

        setError({
          code: "TOO_SHORT",
          message: `Recording duration ${finalDuration}s is less than minimum ${MIN_DURATION}s`,
          timestamp: Date.now(),
        })
        setStatus("cancelled")
        setAudioUri(null)

        return {
          audioUri: null,
          duration: finalDuration,
          success: false,
          error: {
            code: "TOO_SHORT",
            message: "Recording too short",
            timestamp: Date.now(),
          },
        }
      }

      // 6. 验证音频文件存在
      const fileInfo = await getAudioFileInfo(uri)
      if (!fileInfo.exists) {
        throw new Error("Audio file does not exist after recording")
      }

      console.log(
        `[useVoiceRecording] Recording completed: ${finalDuration}s, ${fileInfo.size} bytes`
      )

      // 7. 更新状态
      setStatus("completed")
      setDuration(finalDuration)

      return {
        audioUri: uri,
        duration: finalDuration,
        success: true,
      }
    } catch (err) {
      console.error("[useVoiceRecording] Failed to stop recording:", err)

      const errorMessage = err instanceof Error ? err.message : String(err)
      setError({
        code: "RECORDING_FAILED",
        message: errorMessage,
        timestamp: Date.now(),
      })
      setStatus("failed")

      return {
        audioUri: null,
        duration: 0,
        success: false,
        error: {
          code: "RECORDING_FAILED",
          message: errorMessage,
          timestamp: Date.now(),
        },
      }
    }
  }, [recorder, clearDurationInterval, status])

  /**
   * 取消录音
   * Cancel recording
   */
  const cancelRecording = useCallback(async (): Promise<void> => {
    console.log("[useVoiceRecording] Canceling recording...")

    // 停止录音
    await stopRecording()

    // 触觉反馈（错误）
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

    // 清理
    await cleanup()

    setStatus("cancelled")
  }, [stopRecording, cleanup])

  // ========== 生命周期 ==========

  /**
   * 组件卸载时清理
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearDurationInterval()

      // 清理音频文件（异步，不阻塞卸载）
      if (audioUri) {
        deleteAudioFile(audioUri).catch(err =>
          console.error(
            "[useVoiceRecording] Failed to cleanup on unmount:",
            err
          )
        )
      }
    }
  }, [audioUri, clearDurationInterval])

  // ========== 返回值 ==========

  return {
    status,
    duration,
    audioUri,
    isRecording,
    canStartRecording,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    cleanup,
  }
}
