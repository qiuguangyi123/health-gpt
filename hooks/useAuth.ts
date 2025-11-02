import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"

interface User {
  id: string
  name: string
  email: string
  token: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // 检查登录
  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      const userData = await AsyncStorage.getItem("userData")

      if (token && userData) {
        const user = JSON.parse(userData)
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    } catch (error) {
      console.error("检查登录状态失败:", error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    try {
      // 使用模拟API进行测试
      const { mockLoginApi } = await import("@/utils/mockApi")
      const result = await mockLoginApi(email, password)

      if (result.success && result.data) {
        const user = {
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          token: result.data.token,
        }

        // 保存到本地存储
        await AsyncStorage.setItem("userToken", result.data.token)
        await AsyncStorage.setItem("userData", JSON.stringify(user))

        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })

        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error("登录错误:", error)
      return { success: false, error: "网络错误" }
    }
  }

  // 登出
  const logout = async () => {
    try {
      // 先更新状态，再清除存储
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })

      // 清除存储
      await AsyncStorage.removeItem("userToken")
      await AsyncStorage.removeItem("userData")

      console.log("登出成功，状态已更新")
    } catch (error) {
      console.error("登出错误:", error)
      // 即使清除存储失败，也要确保状态更新
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  // 组件挂载时检查登录状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  return {
    ...authState,
    login,
    logout,
    checkAuthStatus,
  }
}
