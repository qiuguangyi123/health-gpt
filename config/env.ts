/**
 * 环境配置管理
 * Environment Configuration Management
 *
 * 统一管理所有环境变量的访问
 * Centralized access to all environment variables
 */

import Constants from 'expo-constants'

// ============================================
// 类型定义 (Type Definitions)
// ============================================

/**
 * 环境类型
 * Environment types
 */
export type Environment = 'development' | 'uat' | 'production'

/**
 * 环境配置接口
 * Environment configuration interface
 */
export interface EnvConfig {
  /**
   * 当前环境
   * Current environment
   */
  environment: Environment

  /**
   * 是否为开发环境
   * Whether in development environment
   */
  isDevelopment: boolean

  /**
   * 是否为 UAT 环境
   * Whether in UAT environment
   */
  isUAT: boolean

  /**
   * 是否为生产环境
   * Whether in production environment
   */
  isProduction: boolean

  /**
   * 阿里云 ASR 配置
   * Alibaba Cloud ASR configuration
   */
  alibaba: {
    asrToken: string
    asrApiUrl: string
  }

  /**
   * API 配置
   * API configuration
   */
  api: {
    baseUrl: string
    timeout: number
  }

  /**
   * 功能开关
   * Feature flags
   */
  features: {
    enableLogging: boolean
    enableAnalytics: boolean
  }
}

// ============================================
// 环境变量访问 (Environment Variable Access)
// ============================================

/**
 * 从 expo-constants 获取环境变量
 * Get environment variables from expo-constants
 */
const expoExtra = Constants.expoConfig?.extra || {}

/**
 * 获取环境变量值
 * Get environment variable value with fallback
 *
 * @param key 环境变量键名
 * @param fallback 默认值
 * @returns 环境变量值或默认值
 */
function getEnvVar(key: string, fallback: string = ''): string {
  // 优先从 process.env 读取（构建时注入）
  // First try to read from process.env (injected at build time)
  const processEnvKey = `EXPO_PUBLIC_${key}`
  if (process.env[processEnvKey]) {
    return process.env[processEnvKey] as string
  }

  // 从 expo-constants extra 读取（运行时配置）
  // Read from expo-constants extra (runtime configuration)
  return expoExtra[key] || fallback
}

/**
 * 获取布尔类型环境变量
 * Get boolean environment variable
 *
 * @param key 环境变量键名
 * @param fallback 默认值
 * @returns 布尔值
 */
function getBooleanEnvVar(key: string, fallback: boolean = false): boolean {
  const value = getEnvVar(key, String(fallback))
  return value === 'true' || value === '1'
}

/**
 * 获取数字类型环境变量
 * Get number environment variable
 *
 * @param key 环境变量键名
 * @param fallback 默认值
 * @returns 数字值
 */
function getNumberEnvVar(key: string, fallback: number = 0): number {
  const value = getEnvVar(key, String(fallback))
  return parseInt(value, 10) || fallback
}

// ============================================
// 环境配置 (Environment Configuration)
// ============================================

/**
 * 获取当前环境
 * Get current environment
 */
function getCurrentEnvironment(): Environment {
  const env = getEnvVar('APP_ENV', 'development')

  // 标准化环境名称
  if (env === 'dev' || env === 'development') {
    return 'development'
  }
  if (env === 'uat') {
    return 'uat'
  }
  if (env === 'prod' || env === 'production') {
    return 'production'
  }

  // 默认为开发环境
  return 'development'
}

/**
 * 环境配置对象
 * Environment configuration object
 */
export const env: EnvConfig = {
  // 环境信息
  environment: getCurrentEnvironment(),
  isDevelopment: getCurrentEnvironment() === 'development',
  isUAT: getCurrentEnvironment() === 'uat',
  isProduction: getCurrentEnvironment() === 'production',

  // 阿里云 ASR 配置
  alibaba: {
    asrToken: getEnvVar('ALIBABA_ASR_TOKEN', ''),
    asrApiUrl: getEnvVar(
      'ALIBABA_ASR_API_URL',
      'https://nls-gateway.cn-shanghai.aliyuncs.com'
    ),
  },

  // API 配置
  api: {
    baseUrl: getEnvVar('API_BASE_URL', 'http://localhost:3000'),
    timeout: getNumberEnvVar('API_TIMEOUT', 15000),
  },

  // 功能开关
  features: {
    enableLogging: getBooleanEnvVar('ENABLE_LOGGING', __DEV__),
    enableAnalytics: getBooleanEnvVar('ENABLE_ANALYTICS', false),
  },
}

// ============================================
// 开发环境日志 (Development Logging)
// ============================================

if (__DEV__ && env.features.enableLogging) {
  console.log('📦 Environment Configuration:', {
    environment: env.environment,
    alibaba: {
      asrApiUrl: env.alibaba.asrApiUrl,
      asrTokenPresent: !!env.alibaba.asrToken,
    },
    api: env.api,
    features: env.features,
  })
}

// ============================================
// 导出 (Exports)
// ============================================

/**
 * 默认导出环境配置
 * Default export environment configuration
 */
export default env
