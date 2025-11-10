/**
 * 通用 HTTP 请求封装
 * Universal HTTP Request Wrapper
 *
 * 基于 axios 封装，提供请求/响应拦截器和统一错误处理
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"
import { Alert } from "react-native"

// ============================================
// 请求配置 (Request Configuration)
// ============================================

/**
 * 扩展的请求配置（支持错误提示选项）
 */
export interface ExtendedRequestConfig extends AxiosRequestConfig {
  /**
   * 是否显示错误提示
   * @default true
   */
  showErrorMessage?: boolean

  /**
   * 自定义错误提示处理函数
   */
  errorMessageHandler?: (error: RequestError) => void
}

/**
 * 默认请求配置
 */
const defaultConfig: AxiosRequestConfig = {
  baseURL: "", // 基础 URL，根据不同服务动态设置
  timeout: 15000, // 默认超时 15 秒
  headers: {
    "Content-Type": "application/json",
  },
}

/**
 * 全局错误提示处理函数
 * 可以通过 setGlobalErrorHandler 自定义
 */
let globalErrorHandler: ((error: RequestError) => void) | null = null

/**
 * 设置全局错误提示处理函数
 * @param handler 自定义错误处理函数
 */
export function setGlobalErrorHandler(
  handler: (error: RequestError) => void
): void {
  globalErrorHandler = handler
}

/**
 * 默认错误提示处理函数
 * 使用 React Native Alert 显示错误
 */
function showErrorAlert(error: RequestError): void {
  Alert.alert(
    "请求失败",
    error.userMessage || error.message,
    [{ text: "确定", style: "cancel" }],
    { cancelable: true }
  )
}

// ============================================
// 错误响应接口 (Error Response Interface)
// ============================================

/**
 * 统一错误响应格式
 */
export interface ErrorResponse {
  /**
   * 错误码
   */
  code: string | number

  /**
   * 技术性错误描述
   */
  message: string

  /**
   * 用户友好的错误提示（中文）
   */
  userMessage: string

  /**
   * HTTP 状态码
   */
  status?: number

  /**
   * 原始错误对象（用于调试）
   */
  originalError?: any
}

/**
 * 请求错误类
 * Custom error class for HTTP requests
 */
export class RequestError extends Error {
  public readonly code: string | number
  public readonly userMessage: string
  public readonly status?: number
  public readonly originalError?: any

  constructor(errorResponse: ErrorResponse) {
    super(errorResponse.message)
    this.name = "RequestError"
    this.code = errorResponse.code
    this.userMessage = errorResponse.userMessage
    this.status = errorResponse.status
    this.originalError = errorResponse.originalError

    Object.setPrototypeOf(this, RequestError.prototype)
  }
}

// ============================================
// 创建 Axios 实例 (Create Axios Instance)
// ============================================

/**
 * 创建 axios 实例
 * @param config 自定义配置（支持错误提示选项）
 * @param config.showErrorMessage 是否显示错误提示（默认 true）
 * @param config.errorMessageHandler 自定义错误提示处理函数
 */
export function createRequest(config?: ExtendedRequestConfig): AxiosInstance {
  const {
    showErrorMessage = true,
    errorMessageHandler,
    ...axiosConfig
  } = config || {}

  const instance = axios.create({
    ...defaultConfig,
    ...axiosConfig,
  })

  // ========== 请求拦截器 ==========
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 请求发送前的处理
      // 可以在这里添加 token、timestamp 等

      // 日志记录（开发环境）
      if (__DEV__) {
        console.log("📤 Request:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: config.headers,
        })
      }

      return config
    },
    (error: AxiosError) => {
      // 请求错误处理
      console.error("❌ Request Error:", error)
      return Promise.reject(error)
    }
  )

  // ========== 响应拦截器 ==========
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 响应成功处理
      if (__DEV__) {
        console.log("📥 Response:", {
          status: response.status,
          url: response.config.url,
          data: response.data,
        })
      }

      // 直接返回数据
      return response.data
    },
    (error: AxiosError) => {
      // 响应错误处理
      const requestError = handleResponseError(error)

      // 显示错误提示
      if (showErrorMessage) {
        if (errorMessageHandler) {
          // 使用自定义错误处理函数
          errorMessageHandler(requestError)
        } else if (globalErrorHandler) {
          // 使用全局错误处理函数
          globalErrorHandler(requestError)
        } else {
          // 使用默认错误提示
          showErrorAlert(requestError)
        }
      }

      return Promise.reject(requestError)
    }
  )

  return instance
}

// ============================================
// 错误处理 (Error Handling)
// ============================================

/**
 * 处理响应错误
 * Handle response errors and convert to user-friendly messages
 */
function handleResponseError(error: AxiosError): RequestError {
  let errorResponse: ErrorResponse

  if (error.response) {
    // 服务器返回了错误响应（状态码 >= 400）
    const { status, data } = error.response

    switch (status) {
      case 400:
        errorResponse = {
          code: "BAD_REQUEST",
          message: "Invalid request parameters",
          userMessage: "请求参数错误，请检查后重试",
          status,
          originalError: error,
        }
        break

      case 401:
        errorResponse = {
          code: "UNAUTHORIZED",
          message: "Authentication required",
          userMessage: "登录已过期，请重新登录",
          status,
          originalError: error,
        }
        break

      case 403:
        errorResponse = {
          code: "FORBIDDEN",
          message: "Access denied",
          userMessage: "没有权限访问此资源",
          status,
          originalError: error,
        }
        break

      case 404:
        errorResponse = {
          code: "NOT_FOUND",
          message: "Resource not found",
          userMessage: "请求的资源不存在",
          status,
          originalError: error,
        }
        break

      case 408:
        errorResponse = {
          code: "TIMEOUT",
          message: "Request timeout",
          userMessage: "请求超时，请检查网络后重试",
          status,
          originalError: error,
        }
        break

      case 429:
        errorResponse = {
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded",
          userMessage: "请求过于频繁，请稍后重试",
          status,
          originalError: error,
        }
        break

      case 500:
        errorResponse = {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
          userMessage: "服务器内部错误，请稍后重试",
          status,
          originalError: error,
        }
        break

      case 502:
        errorResponse = {
          code: "BAD_GATEWAY",
          message: "Bad gateway",
          userMessage: "网关错误，请稍后重试",
          status,
          originalError: error,
        }
        break

      case 503:
        errorResponse = {
          code: "SERVICE_UNAVAILABLE",
          message: "Service unavailable",
          userMessage: "服务暂时不可用，请稍后重试",
          status,
          originalError: error,
        }
        break

      case 504:
        errorResponse = {
          code: "GATEWAY_TIMEOUT",
          message: "Gateway timeout",
          userMessage: "网关超时，请检查网络后重试",
          status,
          originalError: error,
        }
        break

      default:
        errorResponse = {
          code: `HTTP_${status}`,
          message: error.message || "Unknown server error",
          userMessage: `服务器错误（${status}），请稍后重试`,
          status,
          originalError: error,
        }
    }
  } else if (error.request) {
    // 请求已发出，但没有收到响应（网络错误）
    if (error.code === "ECONNABORTED") {
      errorResponse = {
        code: "TIMEOUT",
        message: "Request timeout",
        userMessage: "请求超时，请检查网络后重试",
        originalError: error,
      }
    } else if (error.message === "Network Error") {
      errorResponse = {
        code: "NETWORK_ERROR",
        message: "Network connection failed",
        userMessage: "网络连接失败，请检查网络后重试",
        originalError: error,
      }
    } else {
      errorResponse = {
        code: "NO_RESPONSE",
        message: "No response from server",
        userMessage: "无法连接到服务器，请检查网络",
        originalError: error,
      }
    }
  } else {
    // 请求配置错误或其他错误
    errorResponse = {
      code: "REQUEST_SETUP_ERROR",
      message: error.message || "Unknown error",
      userMessage: "请求配置错误，请稍后重试",
      originalError: error,
    }
  }

  // 日志记录（开发环境）
  if (__DEV__) {
    console.error("❌ HTTP Error:", {
      code: errorResponse.code,
      message: errorResponse.message,
      userMessage: errorResponse.userMessage,
      status: errorResponse.status,
    })
  }

  return new RequestError(errorResponse)
}

// ============================================
// 默认实例 (Default Instance)
// ============================================

/**
 * 默认请求实例
 * 可以直接使用，也可以通过 createRequest 创建新实例
 */
const request = createRequest()

export default request
