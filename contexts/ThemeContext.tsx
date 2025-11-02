import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { createContext, useContext, useEffect, useState } from "react"
import { useColorScheme } from "react-native"

type ThemeMode = "light" | "dark" | "auto"

interface ThemeContextType {
  themeMode: ThemeMode
  isDark: boolean
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = "@theme_mode"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>("auto")
  const [isLoaded, setIsLoaded] = useState(false)

  // 计算当前是否为暗色主题
  const isDark =
    themeMode === "dark" ||
    (themeMode === "auto" && systemColorScheme === "dark")

  // 加载保存的主题设置
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode)
        }
      } catch (error) {
        console.log("加载主题设置失败:", error)
      } finally {
        setIsLoaded(true)
      }
    }
    loadTheme()
  }, [])

  // 保存主题设置
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode)
      setThemeModeState(mode)
    } catch (error) {
      console.log("保存主题设置失败:", error)
    }
  }
  // 切换主题
  const toggleTheme = () => {
    if (themeMode === "light") {
      setThemeMode("dark")
    } else if (themeMode === "dark") {
      setThemeMode("auto")
    } else {
      setThemeMode("light")
    }
  }

  // 如果主题还未加载完成，显示加载状态
  if (!isLoaded) {
    return null
  }

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
