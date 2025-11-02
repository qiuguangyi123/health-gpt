import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React from "react"
import { ActivityIndicator } from "react-native"
import "react-native-reanimated"

import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext"
import { useColorScheme } from "@/hooks/useColorScheme"
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider,
  useTheme as usePaperTheme,
} from "react-native-paper"
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
    <Provider theme={isDark ? MD3DarkTheme : MD3LightTheme}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "red" }}
        edges={["top", "left", "right"]}
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
    </Provider>
  )
}

export default function RootLayout() {
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
