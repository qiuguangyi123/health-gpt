import { useTheme } from "@/contexts/ThemeContext"
import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { Card, useTheme as usePaperTheme } from "react-native-paper"

export function ThemeInfo() {
  const { themeMode, isDark } = useTheme()
  const paperTheme = usePaperTheme()

  const getThemeDescription = () => {
    switch (themeMode) {
      case "light":
        return "浅色主题 - 始终使用浅色模式"
      case "dark":
        return "深色主题 - 始终使用深色模式"
      case "auto":
        return "自动主题 - 跟随系统设置"
      default:
        return "未知主题"
    }
  }

  const getThemeIcon = () => {
    switch (themeMode) {
      case "light":
        return "☀️"
      case "dark":
        return "🌙"
      case "auto":
        return "⚙️"
      default:
        return "❓"
    }
  }

  return (
    <Card
      style={[styles.container, { backgroundColor: paperTheme.colors.surface }]}
    >
      <Card.Content>
        <Text style={[styles.title, { color: paperTheme.colors.onSurface }]}>
          主题设置
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.icon}>{getThemeIcon()}</Text>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.description,
                { color: paperTheme.colors.onSurface },
              ]}
            >
              {getThemeDescription()}
            </Text>
            <Text style={[styles.status, { color: paperTheme.colors.primary }]}>
              当前状态: {isDark ? "深色模式" : "浅色模式"}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.tip, { color: paperTheme.colors.onSurfaceVariant }]}
        >
          💡 点击上方的主题切换按钮来更改主题设置
        </Text>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
  },
  tip: {
    fontSize: 14,
    fontStyle: "italic",
  },
})
