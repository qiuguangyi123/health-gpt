import AsyncStorage from "@react-native-async-storage/async-storage"
import { router } from "expo-router"
import React, { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  name: string
  email: string
  token: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      const userData = await AsyncStorage.getItem("userData")

      if (token && userData) {
        const user = JSON.parse(userData)
        setUser(user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("检查登录状态失败:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      // 使用模拟API
      const { mockLoginApi } = await import("@/utils/mockApi")
      const result = await mockLoginApi(email, password)

      if (result.success && result.data) {
        const user = {
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          token: result.data.token,
        }

        await AsyncStorage.setItem("userToken", result.data.token)
        await AsyncStorage.setItem("userData", JSON.stringify(user))
        setUser(user)

        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error("登录错误:", error)
      return { success: false, error: "网络错误" }
    }
  }

  const logout = async () => {
    try {
      console.log("开始登出...")

      // 先清除存储
      await AsyncStorage.removeItem("userToken")
      await AsyncStorage.removeItem("userData")

      // 立即跳转到登录页
      router.replace("/login")

      // 然后更新状态
      setUser(null)
      console.log("登出完成")
    } catch (error) {
      console.error("登出错误:", error)
      // 即使清除存储失败，也要跳转和更新状态
      router.replace("/login")
      setUser(null)
    }
  }

  const refreshAuth = async () => {
    setIsLoading(true)
    await checkAuthStatus()
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
