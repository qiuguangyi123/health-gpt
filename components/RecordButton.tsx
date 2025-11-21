import type { RecordingStatus } from "@/types/voice"
import { MaterialIcons } from "@expo/vector-icons"
import React, { useCallback } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { scale, verticalScale } from "react-native-size-matters"

/**
 * 录音按钮组件
 * Record Button Component
 *
 * 按住录音按钮，松开停止录音
 * Press and hold to record, release to stop
 *
 * 特性:
 * - 按压缩放动画（Spring 物理）
 * - 录音状态指示
 * - 波形动画（录音中）
 * - 触觉反馈集成
 *
 * Features:
 * - Press scale animation (Spring physics)
 * - Recording status indication
 * - Waveform animation (while recording)
 * - Haptic feedback integration
 *
 * @example
 * ```tsx
 * <RecordButton
 *   status={status}
 *   duration={duration}
 *   onPressIn={startRecording}
 *   onPressOut={stopRecording}
 *   disabled={!canRecord}
 * />
 * ```
 */

// ============================================
// 类型定义 (Type Definitions)
// ============================================

export interface RecordButtonProps {
  /** 录音状态 */
  status: RecordingStatus
  /** 录音时长（秒） */
  duration: number
  /** 按下按钮时的回调 */
  onPressIn: () => void | Promise<void>
  /** 松开按钮时的回调 */
  onPressOut: () => void | Promise<void>
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义样式 */
  style?: any
}

// ============================================
// 主组件 (Main Component)
// ============================================

export const RecordButton: React.FC<RecordButtonProps> = ({
  status,
  duration,
  onPressIn,
  onPressOut,
  disabled = false,
  style,
}) => {
  // ========== 动画值 ==========
  const pressScale = useSharedValue(1)
  const pulseScale = useSharedValue(1)

  // ========== 计算属性 ==========
  const isRecording = status === "recording"
  const isPreparing = status === "preparing"
  const isStopping = status === "stopping"
  const isDisabled = disabled || isPreparing || isStopping

  // ========== 动画样式 ==========

  /**
   * 按压动画样式
   * Press animation style
   */
  const pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }))

  /**
   * 脉冲动画样式（录音中）
   * Pulse animation style (while recording)
   */
  const pulseAnimatedStyle = useAnimatedStyle(() => {
    // 仅在录音时显示脉冲效果
    const opacity = interpolate(pulseScale.value, [1, 1.2], [0.3, 0])

    return {
      opacity,
      transform: [{ scale: pulseScale.value }],
    }
  })

  // ========== 事件处理 ==========

  /**
   * 按下按钮
   * Press in
   */
  const handlePressIn = useCallback(() => {
    if (isDisabled) return

    // 按压缩放动画
    pressScale.value = withSpring(0.95, {
      damping: 12,
      stiffness: 200,
    })

    onPressIn()
  }, [isDisabled, onPressIn, pressScale])

  /**
   * 松开按钮
   * Press out
   */
  const handlePressOut = useCallback(() => {
    if (isDisabled && !isRecording) return

    // 恢复缩放
    pressScale.value = withSpring(1, {
      damping: 12,
      stiffness: 200,
    })

    onPressOut()
  }, [isDisabled, isRecording, onPressOut, pressScale])

  // ========== 录音状态处理 ==========

  // 录音中的脉冲动画
  React.useEffect(() => {
    if (isRecording) {
      // 启动脉冲动画
      const interval = setInterval(() => {
        pulseScale.value = withSpring(1.2, {
          damping: 10,
          stiffness: 100,
        })
        setTimeout(() => {
          pulseScale.value = withSpring(1, {
            damping: 10,
            stiffness: 100,
          })
        }, 500)
      }, 1000)

      return () => clearInterval(interval)
    } else {
      // 停止脉冲
      pulseScale.value = 1
    }
  }, [isRecording, pulseScale])

  // ========== 渲染 ==========

  return (
    <View style={[styles.container, style]}>
      {/* 脉冲圆环（录音中） */}
      {isRecording && (
        <Animated.View style={[styles.pulseRing, pulseAnimatedStyle]} />
      )}

      {/* 主按钮 */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
      >
        <Animated.View
          style={[
            styles.button,
            isRecording && styles.buttonRecording,
            isPreparing && styles.buttonPreparing,
            isDisabled && styles.buttonDisabled,
            pressAnimatedStyle,
          ]}
        >
          {/* 麦克风图标 */}
          <MaterialIcons
            name={isRecording ? "mic" : "mic-none"}
            size={scale(32)}
            color={isRecording ? "#FFFFFF" : "#E74C3C"}
          />

          {/* 状态文本 */}
          {isRecording && (
            <Text style={styles.statusText}>{formatDuration(duration)}</Text>
          )}

          {isPreparing && <Text style={styles.statusText}>准备中...</Text>}
        </Animated.View>
      </Pressable>

      {/* 提示文本 */}
      {!isRecording && !isPreparing && (
        <Text style={styles.hintText}>按住说话</Text>
      )}
    </View>
  )
}

// ============================================
// 工具函数 (Utility Functions)
// ============================================

/**
 * 格式化时长显示
 * Format duration display
 *
 * @param seconds - 秒数
 * @returns 格式化的字符串（如 "0:05"）
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// ============================================
// 样式 (Styles)
// ============================================

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  button: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    backgroundColor: "#FFFFFF",
    borderWidth: scale(3),
    borderColor: "#E74C3C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: scale(3.84),
    elevation: 5,
  },
  buttonRecording: {
    backgroundColor: "#E74C3C",
    borderColor: "#E74C3C",
  },
  buttonPreparing: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  pulseRing: {
    position: "absolute",
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    borderWidth: scale(2),
    borderColor: "#E74C3C",
    backgroundColor: "transparent",
  },
  statusText: {
    marginTop: verticalScale(4),
    fontSize: scale(10),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  hintText: {
    marginTop: verticalScale(8),
    fontSize: scale(12),
    color: "#7F8C8D",
  },
})

// ============================================
// 导出 (Exports)
// ============================================

export default RecordButton
