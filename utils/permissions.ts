import { Alert, Linking, Platform } from 'react-native'
import { Audio } from 'expo-av'
import { PERMISSION_ERROR_MESSAGES } from '@/constants/voice'

/**
 * 权限工具函数
 * Permission Utility Functions
 *
 * 提供统一的权限请求和检查接口:
 * 1. 麦克风权限请求
 * 2. 权限状态检查
 * 3. 权限被拒绝后的引导
 *
 * Provides unified permission request and check interface:
 * 1. Microphone permission request
 * 2. Permission status check
 * 3. Guidance after permission denial
 */

// ============================================
// 类型定义 (Type Definitions)
// ============================================

/**
 * 权限状态
 * Permission status
 */
export enum PermissionStatus {
  /** 未确定 - 从未请求过权限 */
  UNDETERMINED = 'undetermined',
  /** 已授予 - 用户已授予权限 */
  GRANTED = 'granted',
  /** 已拒绝 - 用户拒绝了权限但可以再次请求 */
  DENIED = 'denied',
  /** 永久拒绝 - 用户选择"不再询问"后拒绝 */
  BLOCKED = 'blocked',
}

/**
 * 权限检查结果
 * Permission check result
 */
export interface PermissionCheckResult {
  /** 权限状态 */
  status: PermissionStatus
  /** 是否已授予权限 */
  granted: boolean
  /** 是否可以请求权限 */
  canAskAgain: boolean
  /** 错误信息（如果有） */
  error?: string
}

/**
 * 权限请求结果
 * Permission request result
 */
export interface PermissionRequestResult {
  /** 权限状态 */
  status: PermissionStatus
  /** 是否已授予权限 */
  granted: boolean
  /** 是否应该显示说明 */
  shouldShowRationale?: boolean
  /** 错误信息（如果有） */
  error?: string
}

// ============================================
// 麦克风权限 (Microphone Permission)
// ============================================

/**
 * 检查麦克风权限状态
 * Check microphone permission status
 *
 * @returns Promise<PermissionCheckResult> - 权限检查结果
 *
 * @example
 * ```tsx
 * const result = await checkMicrophonePermission()
 * if (result.granted) {
 *   console.log('麦克风权限已授予')
 * } else {
 *   console.log('麦克风权限未授予:', result.status)
 * }
 * ```
 */
export const checkMicrophonePermission =
  async (): Promise<PermissionCheckResult> => {
    try {
      const { status, canAskAgain } =
        await Audio.getPermissionsAsync()

      const permissionStatus = mapExpoStatusToPermissionStatus(
        status,
        canAskAgain
      )

      return {
        status: permissionStatus,
        granted: status === 'granted',
        canAskAgain: canAskAgain ?? true,
      }
    } catch (error) {
      console.error('[Permissions] Failed to check microphone permission:', error)
      return {
        status: PermissionStatus.UNDETERMINED,
        granted: false,
        canAskAgain: true,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

/**
 * 请求麦克风权限
 * Request microphone permission
 *
 * @returns Promise<PermissionRequestResult> - 权限请求结果
 *
 * @example
 * ```tsx
 * const result = await requestMicrophonePermission()
 * if (result.granted) {
 *   startRecording()
 * } else if (result.status === PermissionStatus.BLOCKED) {
 *   showSettingsAlert()
 * }
 * ```
 */
export const requestMicrophonePermission =
  async (): Promise<PermissionRequestResult> => {
    try {
      const { status, canAskAgain, granted } =
        await Audio.requestPermissionsAsync()

      const permissionStatus = mapExpoStatusToPermissionStatus(
        status,
        canAskAgain
      )

      console.log('[Permissions] Microphone permission request result:', {
        status: permissionStatus,
        granted,
        canAskAgain,
      })

      return {
        status: permissionStatus,
        granted: granted,
        shouldShowRationale: !canAskAgain && !granted,
      }
    } catch (error) {
      console.error(
        '[Permissions] Failed to request microphone permission:',
        error
      )
      return {
        status: PermissionStatus.DENIED,
        granted: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

/**
 * 确保麦克风权限已授予
 * Ensure microphone permission is granted
 *
 * 如果权限未授予，会自动请求权限
 * If permission is not granted, will automatically request permission
 *
 * @param showAlert - 是否在权限被拒绝时显示提示（默认 true）
 * @returns Promise<boolean> - 权限是否已授予
 *
 * @example
 * ```tsx
 * const handleStartRecording = async () => {
 *   const granted = await ensureMicrophonePermission()
 *   if (!granted) {
 *     return
 *   }
 *   // 继续录音...
 * }
 * ```
 */
export const ensureMicrophonePermission = async (
  showAlert: boolean = true
): Promise<boolean> => {
  // 首先检查当前权限状态
  const checkResult = await checkMicrophonePermission()

  if (checkResult.granted) {
    return true
  }

  // 如果权限被永久拒绝，引导用户去设置
  if (checkResult.status === PermissionStatus.BLOCKED) {
    if (showAlert) {
      await showPermissionBlockedAlert()
    }
    return false
  }

  // 请求权限
  const requestResult = await requestMicrophonePermission()

  if (!requestResult.granted) {
    if (showAlert) {
      if (requestResult.status === PermissionStatus.BLOCKED) {
        await showPermissionBlockedAlert()
      } else {
        await showPermissionDeniedAlert()
      }
    }
    return false
  }

  return true
}

// ============================================
// 权限提示对话框 (Permission Alert Dialogs)
// ============================================

/**
 * 显示权限被拒绝提示
 * Show permission denied alert
 *
 * 用于首次拒绝权限时的提示
 * Used for first-time permission denial
 */
export const showPermissionDeniedAlert = async (): Promise<void> => {
  const errorMessage = PERMISSION_ERROR_MESSAGES.MICROPHONE_DENIED

  return new Promise((resolve) => {
    Alert.alert(errorMessage.title, errorMessage.message, [
      {
        text: '取消',
        style: 'cancel',
        onPress: () => resolve(),
      },
      {
        text: errorMessage.action,
        onPress: async () => {
          await openAppSettings()
          resolve()
        },
      },
    ])
  })
}

/**
 * 显示权限被永久拒绝提示
 * Show permission blocked alert
 *
 * 用于权限被永久拒绝（不再询问）时的提示
 * Used when permission is permanently blocked (don't ask again)
 */
export const showPermissionBlockedAlert = async (): Promise<void> => {
  const errorMessage = PERMISSION_ERROR_MESSAGES.MICROPHONE_DENIED

  return new Promise((resolve) => {
    Alert.alert(
      errorMessage.title,
      '您已拒绝麦克风权限。请在设置中手动开启麦克风权限。',
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: () => resolve(),
        },
        {
          text: errorMessage.action,
          onPress: async () => {
            await openAppSettings()
            resolve()
          },
        },
      ]
    )
  })
}

/**
 * 显示权限说明对话框
 * Show permission rationale dialog
 *
 * 在请求权限前向用户解释为什么需要此权限
 * Explain to users why this permission is needed before requesting
 *
 * @param onConfirm - 用户确认后的回调
 * @param onCancel - 用户取消后的回调
 */
export const showPermissionRationale = (
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  Alert.alert(
    '需要麦克风权限',
    '为了录制语音消息，应用需要访问您的麦克风。我们不会在未经您同意的情况下录制任何内容。',
    [
      {
        text: '取消',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: '允许',
        onPress: onConfirm,
      },
    ]
  )
}

// ============================================
// 系统设置跳转 (Open System Settings)
// ============================================

/**
 * 打开应用系统设置页面
 * Open app system settings page
 *
 * 引导用户手动开启权限
 * Guide users to manually enable permissions
 *
 * @returns Promise<boolean> - 是否成功打开设置
 */
export const openAppSettings = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: 打开应用设置页面
      await Linking.openSettings()
      return true
    } else if (Platform.OS === 'android') {
      // Android: 打开应用详情页面
      await Linking.openSettings()
      return true
    }
    return false
  } catch (error) {
    console.error('[Permissions] Failed to open app settings:', error)
    return false
  }
}

/**
 * 检查是否可以打开系统设置
 * Check if can open system settings
 *
 * @returns Promise<boolean> - 是否支持打开设置
 */
export const canOpenSettings = async (): Promise<boolean> => {
  try {
    return await Linking.canOpenURL('app-settings:')
  } catch (error) {
    return false
  }
}

// ============================================
// 工具函数 (Utility Functions)
// ============================================

/**
 * 映射 Expo 权限状态到自定义权限状态
 * Map Expo permission status to custom permission status
 *
 * @param expoStatus - Expo 返回的权限状态
 * @param canAskAgain - 是否可以再次请求
 * @returns PermissionStatus - 自定义权限状态
 */
const mapExpoStatusToPermissionStatus = (
  expoStatus: string,
  canAskAgain?: boolean
): PermissionStatus => {
  switch (expoStatus) {
    case 'granted':
      return PermissionStatus.GRANTED
    case 'denied':
      // 如果 canAskAgain 为 false，说明用户选择了"不再询问"
      return canAskAgain === false
        ? PermissionStatus.BLOCKED
        : PermissionStatus.DENIED
    case 'undetermined':
      return PermissionStatus.UNDETERMINED
    default:
      return PermissionStatus.UNDETERMINED
  }
}

/**
 * 获取权限状态的中文描述
 * Get Chinese description of permission status
 *
 * @param status - 权限状态
 * @returns 中文描述
 */
export const getPermissionStatusDescription = (
  status: PermissionStatus
): string => {
  switch (status) {
    case PermissionStatus.GRANTED:
      return '已授予'
    case PermissionStatus.DENIED:
      return '已拒绝'
    case PermissionStatus.BLOCKED:
      return '已永久拒绝'
    case PermissionStatus.UNDETERMINED:
      return '未确定'
    default:
      return '未知'
  }
}

/**
 * 判断是否应该显示权限说明
 * Determine if should show permission rationale
 *
 * 在 Android 上，如果用户之前拒绝过权限，再次请求前应该显示说明
 * On Android, should show rationale before requesting again if user previously denied
 *
 * @param status - 权限状态
 * @returns boolean - 是否应该显示说明
 */
export const shouldShowPermissionRationale = (
  status: PermissionStatus
): boolean => {
  // 仅在 Android 上且权限被拒绝（但未永久拒绝）时返回 true
  return Platform.OS === 'android' && status === PermissionStatus.DENIED
}
