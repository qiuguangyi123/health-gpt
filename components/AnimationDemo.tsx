import React, { useState } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Card } from "react-native-paper"
import { AnimatedTabIcon } from "./AnimatedTabIcon"

export function AnimationDemo() {
  const [focusedIcon, setFocusedIcon] = useState<string | null>(null)

  const animations = [
    { type: "bounce" as const, name: "Bounce", icon: "house.fill" },
    { type: "pulse" as const, name: "Pulse", icon: "star.fill" },
    { type: "rotate" as const, name: "Rotate", icon: "paperplane.fill" },
    { type: "scale" as const, name: "Scale", icon: "heart.fill" },
  ]

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>Tab 动画效果演示</Text>
        <Text style={styles.subtitle}>点击下面的按钮查看不同的动画效果</Text>

        <View style={styles.animationGrid}>
          {animations.map(animation => (
            <TouchableOpacity
              key={animation.type}
              style={styles.animationItem}
              onPress={() =>
                setFocusedIcon(
                  focusedIcon === animation.type ? null : animation.type
                )
              }
            >
              <AnimatedTabIcon
                size={40}
                name={animation.icon}
                color={focusedIcon === animation.type ? "#007AFF" : "#666"}
                focused={focusedIcon === animation.type}
                animationType={animation.type}
              />
              <Text
                style={[
                  styles.animationLabel,
                  {
                    color: focusedIcon === animation.type ? "#007AFF" : "#666",
                  },
                ]}
              >
                {animation.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>已实现的动画效果：</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Bounce</Text> - 弹跳动画（首页图标）
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Rotate</Text> - 旋转动画（探索页面图标）
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Pulse</Text> - 脉冲动画（Todo页面图标）
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Scale</Text> - 缩放动画（通用）
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Tab 点击</Text> - 按钮缩放反馈
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>页面切换</Text> - 淡入淡出/滑动动画
          </Text>
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  animationGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  animationItem: {
    alignItems: "center",
    padding: 10,
  },
  animationLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  info: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "bold",
  },
})
