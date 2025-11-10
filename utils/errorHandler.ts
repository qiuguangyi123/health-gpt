/**
 * 全局错误处理配置
 * Global Error Handler Configuration
 * 
 * 用于统一管理应用中的错误提示
 */

import { setGlobalErrorHandler, RequestError } from './request'

/**
 * Snackbar/Toast 回调函数类型
 */
type ErrorMessageCallback = (message: string, type?: 'error' | 'warning' | 'info') => void

/**
 * 全局错误消息回调
 */
let globalErrorMessageCallback: ErrorMessageCallback | null = null

/**
 * 设置全局错误消息回调
 * 通常在应用入口（App.tsx 或 _layout.tsx）中调用
 * 
 * @param callback 错误消息回调函数
 * 
 * @example
 * ```typescript
 * // 在 App.tsx 中
 * import { setErrorMessageCallback } from '@/utils/errorHandler'
 * 
 * function App() {
 *   const [snackbarVisible, setSnackbarVisible] = useState(false)
 *   const [snackbarMessage, setSnackbarMessage] = useState('')
 * 
 *   useEffect(() => {
 *     setErrorMessageCallback((message) => {
 *       setSnackbarMessage(message)
 *       setSnackbarVisible(true)
 *     })
 *   }, [])
 * 
 *   return (
 *     <>
 *       <YourApp />
 *       <Snackbar
 *         visible={snackbarVisible}
 *         onDismiss={() => setSnackbarVisible(false)}
 *         duration={3000}
 *       >
 *         {snackbarMessage}
 *       </Snackbar>
 *     </>
 *   )
 * }
 * ```
 */
export function setErrorMessageCallback(callback: ErrorMessageCallback): void {
  globalErrorMessageCallback = callback
  
  // 设置全局请求错误处理器
  setGlobalErrorHandler((error: RequestError) => {
    // 调用注册的回调函数显示错误
    if (globalErrorMessageCallback) {
      globalErrorMessageCallback(error.userMessage, 'error')
    }
    
    // 开发环境输出详细错误信息
    if (__DEV__) {
      console.error('🔴 Request Error:', {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        status: error.status,
      })
    }
  })
}

/**
 * 手动显示错误消息
 * 用于非 HTTP 请求的错误提示
 * 
 * @param message 错误消息
 * @param type 消息类型
 * 
 * @example
 * ```typescript
 * import { showErrorMessage } from '@/utils/errorHandler'
 * 
 * try {
 *   // 某些操作
 *   if (!isValid) {
 *     showErrorMessage('数据验证失败')
 *   }
 * } catch (error) {
 *   showErrorMessage('操作失败，请重试')
 * }
 * ```
 */
export function showErrorMessage(
  message: string,
  type: 'error' | 'warning' | 'info' = 'error'
): void {
  if (globalErrorMessageCallback) {
    globalErrorMessageCallback(message, type)
  } else {
    // 如果没有设置回调，使用 console 输出
    console.warn('⚠️ Error message callback not set:', message)
  }
}

/**
 * 显示成功消息
 * 
 * @param message 成功消息
 * 
 * @example
 * ```typescript
 * import { showSuccessMessage } from '@/utils/errorHandler'
 * 
 * await saveData()
 * showSuccessMessage('保存成功')
 * ```
 */
export function showSuccessMessage(message: string): void {
  if (globalErrorMessageCallback) {
    globalErrorMessageCallback(message, 'info')
  }
}

