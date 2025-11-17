import * as FileSystem from 'expo-file-system'
import {
  AUDIO_CACHE_DIR,
  AUDIO_FILE_PREFIX,
  AUDIO_FILE_EXPIRY_HOURS,
} from '@/constants/voice'

/**
 * 音频存储服务
 * Audio Storage Service
 *
 * 负责管理临时音频文件的生命周期:
 * 1. 生成唯一文件名
 * 2. 删除音频文件
 * 3. 清理过期文件
 *
 * Manages the lifecycle of temporary audio files:
 * 1. Generate unique filenames
 * 2. Delete audio files
 * 3. Clean up expired files
 */

// ============================================
// 类型定义 (Type Definitions)
// ============================================

/**
 * 音频文件信息
 * Audio file information
 */
export interface AudioFileInfo {
  uri: string // 文件 URI
  exists: boolean // 文件是否存在
  size?: number // 文件大小（字节）
  modificationTime?: number // 最后修改时间（毫秒时间戳）
  isDirectory?: boolean // 是否为目录
}

/**
 * 清理结果
 * Cleanup result
 */
export interface CleanupResult {
  deletedCount: number // 删除的文件数量
  deletedFiles: string[] // 删除的文件列表
  errors: Array<{ file: string; error: string }> // 错误列表
}

// ============================================
// 文件路径管理 (File Path Management)
// ============================================

/**
 * 获取音频缓存目录路径
 * Get audio cache directory path
 *
 * @returns 缓存目录完整路径
 */
export const getAudioCacheDirectory = (): string => {
  const cacheDir = FileSystem.cacheDirectory
  if (!cacheDir) {
    throw new Error('Cache directory is not available')
  }
  return `${cacheDir}${AUDIO_CACHE_DIR}/`
}

/**
 * 生成唯一的音频文件名
 * Generate unique audio filename
 *
 * 格式: recording_<timestamp>_<random>.m4a
 * Format: recording_<timestamp>_<random>.m4a
 *
 * @returns 文件名（不含路径）
 */
export const generateAudioFileName = (): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${AUDIO_FILE_PREFIX}${timestamp}_${random}.m4a`
}

/**
 * 生成完整的音频文件 URI
 * Generate complete audio file URI
 *
 * @returns 音频文件完整路径
 */
export const generateAudioFileUri = (): string => {
  const fileName = generateAudioFileName()
  return `${getAudioCacheDirectory()}${fileName}`
}

// ============================================
// 目录管理 (Directory Management)
// ============================================

/**
 * 确保音频缓存目录存在
 * Ensure audio cache directory exists
 *
 * 如果目录不存在则创建
 * Creates directory if it doesn't exist
 */
export const ensureAudioCacheDirectoryExists = async (): Promise<void> => {
  const dirUri = getAudioCacheDirectory()
  const dirInfo = await FileSystem.getInfoAsync(dirUri)

  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true })
    console.log('[AudioStorage] Created audio cache directory:', dirUri)
  }
}

// ============================================
// 文件操作 (File Operations)
// ============================================

/**
 * 获取音频文件信息
 * Get audio file information
 *
 * @param uri - 文件 URI
 * @returns 文件信息
 */
export const getAudioFileInfo = async (
  uri: string
): Promise<AudioFileInfo> => {
  try {
    const info = await FileSystem.getInfoAsync(uri)
    return {
      uri,
      exists: info.exists,
      size: info.exists ? info.size : undefined,
      modificationTime: info.exists ? info.modificationTime : undefined,
      isDirectory: info.exists ? info.isDirectory : undefined,
    }
  } catch (error) {
    console.error('[AudioStorage] Failed to get file info:', error)
    return {
      uri,
      exists: false,
    }
  }
}

/**
 * 删除音频文件
 * Delete audio file
 *
 * 使用 idempotent: true 确保即使文件不存在也不会报错
 * Uses idempotent: true to ensure no error if file doesn't exist
 *
 * @param uri - 文件 URI
 * @returns 是否成功删除
 */
export const deleteAudioFile = async (uri: string): Promise<boolean> => {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true })
    console.log('[AudioStorage] Deleted audio file:', uri)
    return true
  } catch (error) {
    console.error('[AudioStorage] Failed to delete audio file:', uri, error)
    return false
  }
}

/**
 * 删除多个音频文件
 * Delete multiple audio files
 *
 * @param uris - 文件 URI 数组
 * @returns 成功删除的文件数量
 */
export const deleteAudioFiles = async (uris: string[]): Promise<number> => {
  let deletedCount = 0

  for (const uri of uris) {
    const success = await deleteAudioFile(uri)
    if (success) {
      deletedCount++
    }
  }

  return deletedCount
}

// ============================================
// 清理机制 (Cleanup Mechanisms)
// ============================================

/**
 * 获取音频缓存目录中的所有文件
 * Get all files in audio cache directory
 *
 * @returns 文件名数组（不含路径）
 */
const listAudioFiles = async (): Promise<string[]> => {
  try {
    const dirUri = getAudioCacheDirectory()
    const dirInfo = await FileSystem.getInfoAsync(dirUri)

    if (!dirInfo.exists) {
      return []
    }

    const files = await FileSystem.readDirectoryAsync(dirUri)
    // 只返回以前缀开头的音频文件
    return files.filter((file) => file.startsWith(AUDIO_FILE_PREFIX))
  } catch (error) {
    console.error('[AudioStorage] Failed to list audio files:', error)
    return []
  }
}

/**
 * 清理过期的音频文件
 * Clean up expired audio files
 *
 * 策略2: 应用启动时清理超过 AUDIO_FILE_EXPIRY_HOURS 的旧文件
 * Strategy 2: Clean up files older than AUDIO_FILE_EXPIRY_HOURS on app startup
 *
 * @returns 清理结果
 */
export const cleanupOldAudioFiles = async (): Promise<CleanupResult> => {
  const result: CleanupResult = {
    deletedCount: 0,
    deletedFiles: [],
    errors: [],
  }

  try {
    const files = await listAudioFiles()
    if (files.length === 0) {
      console.log('[AudioStorage] No audio files to clean up')
      return result
    }

    const now = Date.now()
    const expiryMs = AUDIO_FILE_EXPIRY_HOURS * 60 * 60 * 1000
    const dirUri = getAudioCacheDirectory()

    for (const file of files) {
      const uri = `${dirUri}${file}`

      try {
        const info = await FileSystem.getInfoAsync(uri)

        if (info.exists && !info.isDirectory) {
          const fileAge = now - (info.modificationTime || 0) * 1000

          if (fileAge > expiryMs) {
            // 文件过期，删除
            const success = await deleteAudioFile(uri)
            if (success) {
              result.deletedCount++
              result.deletedFiles.push(file)
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        result.errors.push({ file, error: errorMessage })
        console.error('[AudioStorage] Error processing file:', file, error)
      }
    }

    console.log(
      `[AudioStorage] Cleanup completed: ${result.deletedCount} files deleted`
    )
  } catch (error) {
    console.error('[AudioStorage] Cleanup failed:', error)
  }

  return result
}

/**
 * 清理所有音频文件
 * Clean up all audio files
 *
 * 警告: 此函数会删除所有音频文件，包括未过期的
 * Warning: This function deletes all audio files, including non-expired ones
 *
 * 用于测试或重置场景
 * Used for testing or reset scenarios
 *
 * @returns 清理结果
 */
export const cleanupAllAudioFiles = async (): Promise<CleanupResult> => {
  const result: CleanupResult = {
    deletedCount: 0,
    deletedFiles: [],
    errors: [],
  }

  try {
    const files = await listAudioFiles()
    if (files.length === 0) {
      console.log('[AudioStorage] No audio files to clean up')
      return result
    }

    const dirUri = getAudioCacheDirectory()

    for (const file of files) {
      const uri = `${dirUri}${file}`

      try {
        const success = await deleteAudioFile(uri)
        if (success) {
          result.deletedCount++
          result.deletedFiles.push(file)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        result.errors.push({ file, error: errorMessage })
      }
    }

    console.log(
      `[AudioStorage] Cleanup all completed: ${result.deletedCount} files deleted`
    )
  } catch (error) {
    console.error('[AudioStorage] Cleanup all failed:', error)
  }

  return result
}

// ============================================
// 初始化 (Initialization)
// ============================================

/**
 * 初始化音频存储服务
 * Initialize audio storage service
 *
 * 在应用启动时调用:
 * 1. 确保缓存目录存在
 * 2. 清理过期的音频文件
 *
 * Called on app startup:
 * 1. Ensure cache directory exists
 * 2. Clean up expired audio files
 */
export const initializeAudioStorage = async (): Promise<void> => {
  try {
    console.log('[AudioStorage] Initializing audio storage service...')

    // 确保目录存在
    await ensureAudioCacheDirectoryExists()

    // 清理过期文件
    const result = await cleanupOldAudioFiles()
    console.log(
      `[AudioStorage] Initialization complete. Deleted ${result.deletedCount} expired files.`
    )

    if (result.errors.length > 0) {
      console.warn(
        `[AudioStorage] Initialization completed with ${result.errors.length} errors`
      )
    }
  } catch (error) {
    console.error('[AudioStorage] Initialization failed:', error)
    throw error
  }
}

// ============================================
// 工具函数 (Utility Functions)
// ============================================

/**
 * 计算音频文件的估算大小（字节）
 * Calculate estimated audio file size in bytes
 *
 * 基于配置的比特率和时长
 * Based on configured bit rate and duration
 *
 * @param durationSeconds - 音频时长（秒）
 * @param bitRate - 比特率（默认 128000 bps）
 * @returns 估算的文件大小（字节）
 */
export const estimateAudioFileSize = (
  durationSeconds: number,
  bitRate: number = 128000
): number => {
  // 文件大小 = (比特率 / 8) * 时长
  // File size = (bit rate / 8) * duration
  return Math.ceil((bitRate / 8) * durationSeconds)
}

/**
 * 格式化文件大小
 * Format file size
 *
 * @param bytes - 字节数
 * @returns 格式化后的字符串（如 "1.2 MB"）
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}
