import React, { useEffect, useRef } from "react"
import { Animated } from "react-native"
import { IconSymbol } from "./ui/IconSymbol"

interface AnimatedTabIconProps {
  name: string
  size: number
  color: string
  focused: boolean
  animationType?: "bounce" | "pulse" | "rotate" | "scale"
}

export function AnimatedTabIcon({
  name,
  size,
  color,
  focused,
  animationType = "bounce",
}: AnimatedTabIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    // 只在获得焦点时打印日志
    if (focused) {
      console.log(`🎯 ${animationType} 动画开始`)
    }
    if (focused) {
      switch (animationType) {
        case "bounce":
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 300,
              friction: 10,
            }),
          ]).start()
          break

        case "pulse":
          // 开始新的循环动画
          pulseLoopRef.current = Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 1.1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
            ])
          )
          pulseLoopRef.current.start()
          break

        case "rotate":
          // 重置旋转值并开始新的旋转
          console.log("🔄 开始旋转动画")
          rotateAnim.setValue(0)
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 500, // 增加持续时间，更容易看到效果
            useNativeDriver: true,
          }).start(finished => {
            console.log("✅ 旋转动画完成", finished)
          })
          break

        case "scale":
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }).start()
          break
      }
    } else {
      // 停止 pulse 循环动画
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop()
        pulseLoopRef.current = null
      }

      // 重置动画
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [focused, animationType])

  const getTransform = () => {
    const transforms = []

    if (animationType === "bounce" || animationType === "scale") {
      transforms.push({ scale: scaleAnim })
    }

    if (animationType === "pulse") {
      transforms.push({ scale: pulseAnim })
    }

    if (animationType === "rotate") {
      console.log("🔄 应用旋转变换")
      const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      })
      transforms.push({ rotate })
    }

    return transforms
  }

  return (
    <Animated.View style={{ transform: getTransform() }}>
      <IconSymbol size={size} name={name as any} color={color} />
    </Animated.View>
  )
}
