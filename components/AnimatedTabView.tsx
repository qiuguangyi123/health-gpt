import React, { useEffect, useRef } from "react"
import { Animated, Dimensions, StyleSheet } from "react-native"

interface AnimatedTabViewProps {
  children: React.ReactNode
  isActive: boolean
  animationType?: "slide" | "fade" | "scale" | "rotate"
}

const { width: screenWidth } = Dimensions.get("window")

export function AnimatedTabView({
  children,
  isActive,
  animationType = "slide",
}: AnimatedTabViewProps) {
  const slideAnim = useRef(
    new Animated.Value(isActive ? 0 : screenWidth)
  ).current
  const fadeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.8)).current
  const rotateAnim = useRef(new Animated.Value(isActive ? 0 : 1)).current

  useEffect(() => {
    const duration = 300
    const easing = Animated.Easing.out(Animated.Easing.cubic)

    switch (animationType) {
      case "slide":
        Animated.timing(slideAnim, {
          toValue: isActive ? 0 : screenWidth,
          duration,
          easing,
          useNativeDriver: true,
        }).start()
        break

      case "fade":
        Animated.timing(fadeAnim, {
          toValue: isActive ? 1 : 0,
          duration,
          easing,
          useNativeDriver: true,
        }).start()
        break

      case "scale":
        Animated.timing(scaleAnim, {
          toValue: isActive ? 1 : 0.8,
          duration,
          easing,
          useNativeDriver: true,
        }).start()
        break

      case "rotate":
        Animated.timing(rotateAnim, {
          toValue: isActive ? 0 : 1,
          duration,
          easing,
          useNativeDriver: true,
        }).start()
        break
    }
  }, [isActive, animationType])

  const getAnimatedStyle = () => {
    switch (animationType) {
      case "slide":
        return {
          transform: [{ translateX: slideAnim }],
        }
      case "fade":
        return {
          opacity: fadeAnim,
        }
      case "scale":
        return {
          transform: [{ scale: scaleAnim }],
        }
      case "rotate":
        const rotate = rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        })
        return {
          transform: [{ rotate }],
        }
      default:
        return {}
    }
  }

  return (
    <Animated.View style={[styles.container, getAnimatedStyle()]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
