import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React, { useEffect } from "react"
import { ActivityIndicator, Platform } from "react-native"
import "react-native-reanimated"

import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import { useColorScheme } from "@/hooks/useColorScheme"
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  setIsAudioActiveAsync,
} from "expo-audio"
import { useTheme as usePaperTheme } from "react-native-paper"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"

function RootLayoutContent() {
  const colorScheme = useColorScheme()
  const { isAuthenticated, isLoading, user } = useAuth()
  const { isDark } = useTheme()
  const themeToken = usePaperTheme()

  // 添加更详细的调试信息
  console.log("=== RootLayout Render ===")
  console.log("Auth Debug:", { isAuthenticated, isLoading, user })
  console.log("Theme Debug:", { isDark, colorScheme })
  console.log("Timestamp:", new Date().toISOString())

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  })

  // 显示加载状态
  if (!loaded || isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: themeToken.colors.background }}
      // edges={["top", "left", "right"]}
    >
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: themeToken.colors.background }, // 设置所有页面的背景色
          headerStyle: { backgroundColor: themeToken.colors.background }, // 设置头部背景色
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  )
}

export default function RootLayout() {
  // 在应用启动时初始化音频系统
  // 必须在任何录音器创建之前完成
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        console.log("[RootLayout] Initializing audio system...")

        // 步骤 1: 配置 Audio Mode（必须在激活音频会话之前）
        console.log("[RootLayout] Step 1: Configuring audio mode...")
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: Platform.OS === "ios",
          // iOS 特定配置
          ...(Platform.OS === "ios"
            ? {
                shouldPlayInBackground: false,
                staysActiveInBackground: false,
              }
            : {}),
        })

        // 步骤 2: 激活音频会话
        console.log("[RootLayout] Step 2: Activating audio session...")
        await setIsAudioActiveAsync(true)

        // 步骤 3: 请求录音权限
        console.log("[RootLayout] Step 3: Requesting recording permissions...")
        const { status, granted } = await requestRecordingPermissionsAsync()
        console.log("[RootLayout] Recording permission:", { status, granted })

        console.log("[RootLayout] ✅ Audio system initialized successfully")
      } catch (error) {
        console.error(
          "[RootLayout] ❌ Failed to initialize audio system:",
          error
        )
      }
    }

    initializeAudio()
  }, [])

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
