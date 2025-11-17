import { useEffect, useState } from 'react'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'

/**
 * 网络状态 Hook
 * Network Status Hook
 *
 * 实时监听网络连接状态,提供:
 * 1. 在线/离线状态
 * 2. 网络类型 (WiFi/Cellular/Ethernet/None)
 * 3. 详细的网络信息
 *
 * Real-time network connection monitoring, provides:
 * 1. Online/offline status
 * 2. Network type (WiFi/Cellular/Ethernet/None)
 * 3. Detailed network information
 *
 * @example
 * ```tsx
 * const { isOnline, networkType, isConnected } = useNetworkStatus()
 *
 * if (!isOnline) {
 *   return <Text>无网络连接</Text>
 * }
 *
 * if (networkType === 'cellular') {
 *   return <Text>正在使用移动数据</Text>
 * }
 * ```
 */

// ============================================
// 类型定义 (Type Definitions)
// ============================================

/**
 * 网络类型
 * Network type
 */
export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown'

/**
 * 网络状态信息
 * Network status information
 */
export interface NetworkStatus {
  /** 是否在线 (已连接且可访问互联网) */
  isOnline: boolean
  /** 是否已连接到网络 */
  isConnected: boolean
  /** 网络类型 */
  networkType: NetworkType
  /** 是否可以访问互联网 */
  isInternetReachable: boolean | null
  /** 详细的网络信息 */
  details: NetInfoState | null
}

// ============================================
// Hook 实现 (Hook Implementation)
// ============================================

/**
 * 使用网络状态监听
 * Use network status monitoring
 *
 * @returns 网络状态信息
 */
export const useNetworkStatus = (): NetworkStatus => {
  // 初始状态假设在线,避免首次加载时出现误报
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null)
  const [isOnline, setIsOnline] = useState<boolean>(true)

  useEffect(() => {
    // 立即获取一次网络状态
    NetInfo.fetch().then((state) => {
      setNetworkState(state)
      updateOnlineStatus(state)
    })

    // 订阅网络状态变化
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState(state)
      updateOnlineStatus(state)
    })

    // 组件卸载时取消订阅
    return () => {
      unsubscribe()
    }
  }, [])

  /**
   * 更新在线状态
   * Update online status
   *
   * 在线定义: isConnected === true && isInternetReachable !== false
   * Online definition: isConnected === true && isInternetReachable !== false
   */
  const updateOnlineStatus = (state: NetInfoState) => {
    const online =
      state.isConnected === true && state.isInternetReachable !== false
    setIsOnline(online)

    // 记录网络状态变化
    if (online) {
      console.log('[NetworkStatus] Network online:', state.type)
    } else {
      console.log('[NetworkStatus] Network offline')
    }
  }

  // 解析网络类型
  const networkType: NetworkType = networkState
    ? (networkState.type as NetworkType)
    : 'unknown'

  return {
    isOnline,
    isConnected: networkState?.isConnected ?? true,
    networkType,
    isInternetReachable: networkState?.isInternetReachable ?? null,
    details: networkState,
  }
}

// ============================================
// 工具函数 (Utility Functions)
// ============================================

/**
 * 检查网络连接 (一次性检查)
 * Check network connection (one-time check)
 *
 * 用于在特定操作前验证网络状态
 * Used to verify network status before specific operations
 *
 * @returns Promise<boolean> - 是否在线
 *
 * @example
 * ```tsx
 * const handleStartRecording = async () => {
 *   const online = await checkNetworkConnection()
 *   if (!online) {
 *     Alert.alert('无网络连接', '语音转文字需要网络连接')
 *     return
 *   }
 *   // 继续录音...
 * }
 * ```
 */
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch()
    return state.isConnected === true && state.isInternetReachable !== false
  } catch (error) {
    console.error('[NetworkStatus] Failed to check network:', error)
    // 检查失败时假设在线,避免误判
    return true
  }
}

/**
 * 获取网络类型 (一次性获取)
 * Get network type (one-time fetch)
 *
 * @returns Promise<NetworkType> - 网络类型
 */
export const getNetworkType = async (): Promise<NetworkType> => {
  try {
    const state = await NetInfo.fetch()
    return (state.type as NetworkType) || 'unknown'
  } catch (error) {
    console.error('[NetworkStatus] Failed to get network type:', error)
    return 'unknown'
  }
}

/**
 * 检查是否使用移动数据
 * Check if using cellular data
 *
 * 用于在使用移动数据时给用户提示
 * Used to warn users when using cellular data
 *
 * @returns Promise<boolean> - 是否使用移动数据
 *
 * @example
 * ```tsx
 * const handleUpload = async () => {
 *   if (await isUsingCellularData()) {
 *     Alert.alert(
 *       '移动数据提醒',
 *       '您正在使用移动数据,继续上传可能产生流量费用',
 *       [
 *         { text: '取消', style: 'cancel' },
 *         { text: '继续', onPress: () => uploadFile() }
 *       ]
 *     )
 *     return
 *   }
 *   uploadFile()
 * }
 * ```
 */
export const isUsingCellularData = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch()
    return state.type === 'cellular' && state.isConnected === true
  } catch (error) {
    console.error('[NetworkStatus] Failed to check cellular status:', error)
    return false
  }
}

/**
 * 等待网络连接恢复
 * Wait for network connection to restore
 *
 * @param timeoutMs - 超时时间（毫秒）,默认 30 秒
 * @returns Promise<boolean> - 是否在超时前恢复连接
 *
 * @example
 * ```tsx
 * const retryWithNetworkWait = async () => {
 *   console.log('等待网络恢复...')
 *   const restored = await waitForNetworkRestore(10000) // 等待 10 秒
 *
 *   if (restored) {
 *     console.log('网络已恢复,重试上传')
 *     return uploadFile()
 *   } else {
 *     console.log('网络恢复超时')
 *     throw new Error('NETWORK_TIMEOUT')
 *   }
 * }
 * ```
 */
export const waitForNetworkRestore = async (
  timeoutMs: number = 30000
): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now()

    // 定时检查网络状态
    const checkInterval = setInterval(async () => {
      const online = await checkNetworkConnection()

      if (online) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 1000) // 每秒检查一次
  })
}

// ============================================
// 网络状态描述 (Network Status Description)
// ============================================

/**
 * 获取网络状态的中文描述
 * Get Chinese description of network status
 *
 * @param status - 网络状态
 * @returns 中文描述字符串
 *
 * @example
 * ```tsx
 * const status = useNetworkStatus()
 * const description = getNetworkStatusDescription(status)
 * // "WiFi 已连接" 或 "移动数据已连接" 或 "无网络连接"
 * ```
 */
export const getNetworkStatusDescription = (status: NetworkStatus): string => {
  if (!status.isOnline) {
    return '无网络连接'
  }

  switch (status.networkType) {
    case 'wifi':
      return 'WiFi 已连接'
    case 'cellular':
      return '移动数据已连接'
    case 'ethernet':
      return '以太网已连接'
    default:
      return '网络已连接'
  }
}

/**
 * 获取网络类型图标名称 (用于 UI 显示)
 * Get network type icon name (for UI display)
 *
 * @param networkType - 网络类型
 * @returns Material Icons 图标名称
 */
export const getNetworkTypeIcon = (networkType: NetworkType): string => {
  switch (networkType) {
    case 'wifi':
      return 'wifi'
    case 'cellular':
      return 'signal-cellular-alt'
    case 'ethernet':
      return 'ethernet'
    case 'none':
      return 'wifi-off'
    default:
      return 'help-outline'
  }
}
