import React, { useEffect } from "react"
import { StyleSheet } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { verticalScale } from "react-native-size-matters"

interface WaveformBarProps {
  index: number
  color: string
}

/**
 * 波形条组件 - 使用连续循环动画，避免闪烁
 *
 * 优化要点：
 * 1. 使用 React.memo 避免不必要的重新渲染
 * 2. 所有尺寸值在组件外计算（worklet 优化）
 * 3. 随机值在 useEffect 中一次性计算（避免重复计算）
 * 4. 使用 withRepeat(-1) 创建无限循环的流畅动画
 * 5. 动画完全运行在 UI 线程，保证 60fps 性能
 */
const WaveformBar = React.memo(({ index, color }: WaveformBarProps) => {
  const minBarHeight = verticalScale(4)
  const maxBarHeight = verticalScale(50)

  const animatedHeight = useSharedValue(minBarHeight)

  useEffect(() => {
    // 每个条形使用独立的循环动画，创建波浪效果
    // 随机持续时间：800-1200ms，创建不规则的波动效果
    const duration = 300 + Math.random() * 400

    // 交错延迟：基于索引，创建从左到右的波浪扩散效果
    const delay = index * 50

    // 随机高度倍数：0.3-1.0，让每个条形有不同的最大高度
    const heightMultiplier = 0.3 + Math.random() * 0.7

    animatedHeight.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(maxBarHeight * heightMultiplier, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease), // 缓入缓出，更自然
          }),
          withTiming(minBarHeight, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // 无限循环
        false // 不反转动画方向
      )
    )

    // 清理函数：组件卸载时取消动画
    return () => {
      animatedHeight.value = minBarHeight
    }
  }, [index]) // 只依赖 index，确保动画稳定

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    minHeight: minBarHeight,
  }))

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  )
})

WaveformBar.displayName = "WaveformBar"

const styles = StyleSheet.create({
  bar: {
    width: verticalScale(2.5),
    borderRadius: verticalScale(1.25),
  },
})

export default WaveformBar
