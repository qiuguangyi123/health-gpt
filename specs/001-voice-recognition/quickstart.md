# 快速开始指南: 语音识别与转文字功能

**功能**: 001-voice-recognition | **日期**: 2025-11-10 | **Phase**: 1
**规格**: [spec.md](./spec.md) | **研究**: [research.md](./research.md)

## 概述

本指南帮助开发者快速集成语音识别功能到现有的React Native + Expo项目中。完成本指南后,你将能够:

- ✅ 录制用户语音(最长60秒)
- ✅ 将语音转换为中文文本
- ✅ 显示实时波形动画
- ✅ 处理各种错误场景

**预计完成时间**: 30-45分钟

---

## 前置条件

### 环境要求

- **Node.js**: ≥ 18.x
- **npm/yarn**: 最新稳定版
- **Expo CLI**: ≥ 50.x
- **iOS**: iOS 14+ (开发需要Xcode)
- **Android**: API 23+ (开发需要Android Studio)

### 项目要求

- 已有React Native + Expo项目
- 项目使用TypeScript
- 已安装并配置`react-native-reanimated`

### 验证环境

```bash
# 检查Node.js版本
node --version
# 应该显示: v18.x.x 或更高

# 检查Expo CLI
npx expo --version
# 应该显示: ~50.x.x

# 检查项目依赖
cd /path/to/your/project
npm list react-native-reanimated
# 应该显示: ~3.17.4
```

---

## 第一步: 安装依赖

### 1.1 安装必需的npm包

```bash
# 进入项目目录
cd /path/to/your/project

# 安装音频录制库
npx expo install expo-audio

# 安装文件系统库
npx expo install expo-file-system

# 安装触觉反馈库
npx expo install expo-haptics

# 安装网络状态监听库
npm install @react-native-community/netinfo

# 安装HTTP客户端(如果未安装)
npm install axios
```

### 1.2 验证安装

```bash
# 检查package.json
cat package.json | grep -E "(expo-audio|expo-file-system|netinfo)"

# 应该看到:
# "expo-audio": "~14.1.0",
# "expo-file-system": "~18.1.0",
# "@react-native-community/netinfo": "^11.3.0"
```

### 1.3 配置权限

**iOS (ios/Podfile)**:
```ruby
# Expo自动配置,无需手动添加
```

**Android (android/app/src/main/AndroidManifest.xml)**:
```xml
<!-- Expo自动添加,无需手动配置 -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**app.json配置**:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-audio",
        {
          "microphonePermission": "允许 $(PRODUCT_NAME) 访问您的麦克风以录制语音消息"
        }
      ]
    ]
  }
}
```

---

## 第二步: 创建项目结构

### 2.1 创建必要的目录

```bash
# 在项目根目录执行
mkdir -p components hooks services types utils constants
```

### 2.2 创建常量文件

创建 `constants/voice.ts`:

```typescript
/**
 * 语音功能常量配置
 */

import {
  AndroidOutputFormat,
  AndroidAudioEncoder,
  IOSOutputFormat,
  IOSAudioQuality,
} from 'expo-audio'

// ==================== 录音配置 ====================

export const VOICE_CONFIG = {
  // 时长限制
  MAX_DURATION: 60,          // 最大60秒
  MIN_DURATION: 0.5,         // 最小0.5秒

  // 音频参数
  SAMPLE_RATE: 16000,        // 16kHz采样率(ASR优化)
  BIT_RATE: 64000,           // 64kbps比特率
  CHANNELS: 1,               // 单声道

  // 性能目标
  MAX_START_LATENCY: 200,    // 启动延迟 < 200ms
  MAX_TRANSCRIPTION_TIME: 5000, // 转录 < 5秒

  // 网络配置
  API_TIMEOUT: 15000,        // 15秒超时
  MAX_RETRIES: 3,            // 最多重试3次

  // 文件管理
  FILE_PREFIX: 'voice_',
  FILE_EXTENSION: '.m4a',
  MAX_FILE_AGE: 24 * 60 * 60 * 1000, // 24小时
}

// ==================== ASR优化录音预设 ====================

export const ASR_RECORDING_PRESET = {
  android: {
    extension: VOICE_CONFIG.FILE_EXTENSION,
    outputFormat: AndroidOutputFormat.MPEG_4,
    audioEncoder: AndroidAudioEncoder.AAC,
    sampleRate: VOICE_CONFIG.SAMPLE_RATE,
    numberOfChannels: VOICE_CONFIG.CHANNELS,
    bitRate: VOICE_CONFIG.BIT_RATE,
  },
  ios: {
    extension: VOICE_CONFIG.FILE_EXTENSION,
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: IOSAudioQuality.MEDIUM,
    sampleRate: VOICE_CONFIG.SAMPLE_RATE,
    numberOfChannels: VOICE_CONFIG.CHANNELS,
    bitRate: VOICE_CONFIG.BIT_RATE,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: VOICE_CONFIG.BIT_RATE,
  },
}

// ==================== API配置 ====================

export const ASR_API_CONFIG = {
  BASE_URL: 'https://nls-gateway-cn-shanghai.aliyuncs.com',
  ENDPOINT: '/stream/v1/asr',
  REGION: 'cn-shanghai',
  LANGUAGE: 'zh-CN',
}

// ==================== 错误消息 ====================

export const ERROR_MESSAGES = {
  // 权限错误
  MICROPHONE_DENIED: {
    title: '需要麦克风权限',
    message: '请在设置中允许应用访问麦克风',
    action: '去设置',
  },

  // 录音错误
  TOO_SHORT: {
    title: '录音时间过短',
    message: '请至少录制0.5秒以上的语音',
    action: '重新录制',
  },
  TOO_LONG: {
    title: '录音时间过长',
    message: '单次录音最长60秒,已自动停止',
    action: '确定',
  },

  // 网络错误
  OFFLINE: {
    title: '无网络连接',
    message: '语音转文字需要网络连接,请检查网络后重试',
    action: '重试',
  },
  TIMEOUT: {
    title: '请求超时',
    message: '网络连接不稳定,请稍后重试',
    action: '重试',
  },

  // ASR错误
  ASR_FAILED: {
    title: '识别失败',
    message: '语音识别出现错误,请重试',
    action: '重试',
  },
}
```

---

## 第三步: 实现核心服务

### 3.1 创建类型定义

创建 `types/voice.ts`:

```typescript
/**
 * 语音功能类型定义
 */

export type RecordingStatus =
  | 'idle'
  | 'preparing'
  | 'recording'
  | 'stopping'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type TranscriptionStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'

export interface VoiceRecording {
  id: string
  uri: string
  duration: number
  fileSize: number
  format: 'aac'
  sampleRate: 16000
  channels: 1
  bitRate: 64000
  startedAt: number
  stoppedAt?: number
  status: RecordingStatus
  error?: RecordingError
}

export interface RecordingError {
  code: string
  message: string
  timestamp: number
}

export interface Transcription {
  id: string
  recordingId: string
  text: string
  confidence?: number
  languageCode: 'zh-CN'
  provider: 'alibaba-asr'
  taskId?: string
  requestedAt: number
  completedAt?: number
  processingTime?: number
  status: TranscriptionStatus
  error?: TranscriptionError
  retryCount: number
}

export interface TranscriptionError {
  code: string
  message: string
  userMessage: string
  retryable: boolean
  timestamp: number
}

export interface VoiceMessage {
  id: string
  text: string
  isVoice: true
  recordingDuration: number
  transcriptionTime: number
  createdAt: number
  role: 'user' | 'assistant'
  isStreaming?: boolean
}
```

### 3.2 创建阿里云ASR服务

创建 `services/alibabaASR.ts`:

```typescript
/**
 * 阿里云ASR服务封装
 */

import * as FileSystem from 'expo-file-system'
import { ASR_API_CONFIG, VOICE_CONFIG } from '@/constants/voice'

interface ASRResponse {
  header: {
    status: number
    status_text: string
    task_id?: string
  }
  payload: {
    result: string
    confidence?: number
  }
}

export class ASRError extends Error {
  constructor(
    public code: number,
    public statusText: string
  ) {
    super(`ASR_${code}`)
    this.name = 'ASRError'
  }

  isRetryable(): boolean {
    return (
      this.code === 40000001 ||
      this.code === 40000014 ||
      this.code === 40000015 ||
      this.code === 40000100 ||
      this.code >= 50000000
    )
  }

  getUserMessage(): string {
    const messages: Record<number, string> = {
      40000001: '服务暂时不可用,请稍后重试',
      40000003: '音频格式不支持,请重新录制',
      40000013: '录音时间过长,请控制在60秒内',
      40000014: '录音时间过短,请重新录制',
      40000015: '音频质量较差,建议在安静环境重新录制',
      40000100: '服务繁忙,请稍后重试',
      50000000: '服务暂时不可用,请稍后重试',
      50000001: '服务响应超时,请重试',
    }

    return messages[this.code] || '语音识别失败,请重试'
  }
}

/**
 * 获取ASR Token(需要后端实现)
 */
const getASRToken = async (): Promise<string> => {
  // TODO: 实现从后端获取token的逻辑
  // const response = await fetch('YOUR_BACKEND_API/asr/token')
  // const { token } = await response.json()
  // return token

  throw new Error('请实现getASRToken函数,从后端获取阿里云ASR Token')
}

/**
 * 转录音频文件
 */
export const transcribeAudio = async (audioUri: string): Promise<string> => {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    VOICE_CONFIG.API_TIMEOUT
  )

  try {
    // 1. 获取Token
    const token = await getASRToken()

    // 2. 读取音频文件为Base64
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // 3. 发送请求
    const url = `${ASR_API_CONFIG.BASE_URL}${ASR_API_CONFIG.ENDPOINT}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': `audio/aac;samplerate=${VOICE_CONFIG.SAMPLE_RATE}`,
        'X-NLS-Token': token,
        'Accept': 'application/json',
      },
      body: audioBase64,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // 4. 解析响应
    const data: ASRResponse = await response.json()

    if (data.header.status !== 20000000) {
      throw new ASRError(data.header.status, data.header.status_text)
    }

    // 5. 返回识别结果
    return data.payload.result
  } catch (error) {
    clearTimeout(timeout)

    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT')
    }

    if (error instanceof ASRError) {
      throw error
    }

    throw new Error('NETWORK_UNAVAILABLE')
  }
}
```

---

## 第四步: 创建Hooks

### 4.1 创建录音Hook

创建 `hooks/useVoiceRecording.ts`:

```typescript
/**
 * 语音录制Hook
 */

import { useState, useEffect, useRef } from 'react'
import { useAudioRecorder } from 'expo-audio'
import * as Haptics from 'expo-haptics'
import * as FileSystem from 'expo-file-system'
import { ASR_RECORDING_PRESET, VOICE_CONFIG } from '@/constants/voice'
import type { VoiceRecording, RecordingStatus } from '@/types/voice'

export const useVoiceRecording = () => {
  const recorder = useAudioRecorder(ASR_RECORDING_PRESET)
  const [recording, setRecording] = useState<VoiceRecording | null>(null)
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<NodeJS.Timeout>()

  // 录音状态
  const isRecording = recording?.status === 'recording'

  /**
   * 开始录音
   */
  const startRecording = async () => {
    try {
      // 1. 请求权限
      const { status } = await recorder.getPermissionsAsync()
      if (status !== 'granted') {
        const { status: newStatus } = await recorder.requestPermissionsAsync()
        if (newStatus !== 'granted') {
          throw new Error('MICROPHONE_DENIED')
        }
      }

      // 2. 触觉反馈
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      // 3. 准备录音
      await recorder.prepareToRecordAsync()

      // 4. 开始录音
      recorder.record()

      // 5. 创建录音对象
      const newRecording: VoiceRecording = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        uri: '',
        duration: 0,
        fileSize: 0,
        format: 'aac',
        sampleRate: 16000,
        channels: 1,
        bitRate: 64000,
        startedAt: Date.now(),
        status: 'recording',
      }
      setRecording(newRecording)
      setDuration(0)

      // 6. 启动计时器
      timerRef.current = setInterval(() => {
        setDuration(d => {
          const newDuration = d + 0.1

          // 达到最大时长自动停止
          if (newDuration >= VOICE_CONFIG.MAX_DURATION) {
            stopRecording()
            return VOICE_CONFIG.MAX_DURATION
          }

          return newDuration
        })
      }, 100)
    } catch (error) {
      console.error('开始录音失败:', error)
      throw error
    }
  }

  /**
   * 停止录音
   */
  const stopRecording = async () => {
    if (!recording || !isRecording) return

    try {
      // 1. 停止计时器
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // 2. 停止录音
      await recorder.stop()

      // 3. 触觉反馈
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      // 4. 检查时长
      if (duration < VOICE_CONFIG.MIN_DURATION) {
        // 时长过短,取消录音
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        )
        setRecording({ ...recording, status: 'cancelled' })
        setDuration(0)
        return null
      }

      // 5. 获取录音URI
      const uri = recorder.uri
      if (!uri) {
        throw new Error('录音文件URI为空')
      }

      // 6. 获取文件信息
      const fileInfo = await FileSystem.getInfoAsync(uri)
      const fileSize = fileInfo.exists ? fileInfo.size : 0

      // 7. 更新录音对象
      const completedRecording: VoiceRecording = {
        ...recording,
        uri,
        duration,
        fileSize,
        stoppedAt: Date.now(),
        status: 'completed',
      }
      setRecording(completedRecording)

      return completedRecording
    } catch (error) {
      console.error('停止录音失败:', error)
      setRecording({ ...recording, status: 'failed' })
      throw error
    }
  }

  /**
   * 取消录音
   */
  const cancelRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (recorder.isRecording) {
      await recorder.stop()
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    setRecording(null)
    setDuration(0)
  }

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return {
    recording,
    duration,
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
```

---

## 第五步: 创建UI组件

### 5.1 创建录音按钮组件

创建 `components/RecordButton.tsx`:

```typescript
/**
 * 录音按钮组件
 */

import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { IconButton } from 'react-native-paper'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'

interface RecordButtonProps {
  isRecording: boolean
  onPressIn: () => void
  onPressOut: () => void
  disabled?: boolean
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  onPressIn,
  onPressOut,
  disabled = false,
}) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(1.05, { damping: 12, stiffness: 200 })
    onPressIn()
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 })
    onPressOut()
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <IconButton
          icon={isRecording ? 'stop' : 'microphone'}
          size={32}
          iconColor={isRecording ? '#F44336' : '#2196F3'}
          style={[
            styles.button,
            isRecording && styles.recording,
          ]}
        />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#E3F2FD',
  },
  recording: {
    backgroundColor: '#FFEBEE',
  },
})
```

---

## 第六步: 集成到聊天界面

### 6.1 在聊天页面中使用

修改 `app/(tabs)/index.tsx`:

```typescript
import React, { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { transcribeAudio } from '@/services/alibabaASR'
import { RecordButton } from '@/components/RecordButton'

export default function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([])
  const {
    recording,
    duration,
    isRecording,
    startRecording,
    stopRecording,
  } = useVoiceRecording()

  /**
   * 处理录音和转录
   */
  const handleVoiceInput = async () => {
    try {
      // 1. 开始录音
      await startRecording()
    } catch (error) {
      Alert.alert('录音失败', '无法启动录音,请检查麦克风权限')
    }
  }

  const handleVoiceStop = async () => {
    try {
      // 1. 停止录音
      const completedRecording = await stopRecording()

      if (!completedRecording) {
        Alert.alert('录音时间过短', '请至少录制0.5秒以上的语音')
        return
      }

      // 2. 转录音频
      const text = await transcribeAudio(completedRecording.uri)

      // 3. 添加到消息列表
      const voiceMessage = {
        id: `msg_${Date.now()}`,
        text,
        isVoice: true,
        recordingDuration: completedRecording.duration,
        createdAt: Date.now(),
        role: 'user',
      }
      setMessages(prev => [...prev, voiceMessage])

      // 4. 清理音频文件
      await FileSystem.deleteAsync(completedRecording.uri, {
        idempotent: true,
      })
    } catch (error) {
      Alert.alert('转录失败', '语音识别出现错误,请重试')
    }
  }

  return (
    <View style={styles.container}>
      {/* 消息列表 */}
      {/* ... */}

      {/* 录音按钮 */}
      <RecordButton
        isRecording={isRecording}
        onPressIn={handleVoiceInput}
        onPressOut={handleVoiceStop}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
```

---

## 第七步: 测试

### 7.1 运行应用

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Web(仅用于开发测试)
npx expo start
```

### 7.2 功能测试清单

- [ ] 按住按钮能开始录音
- [ ] 松开按钮能停止录音
- [ ] 录音时显示波形动画
- [ ] 录音时长实时更新
- [ ] 短于0.5秒自动取消并提示
- [ ] 超过60秒自动停止
- [ ] 转录成功后显示文本
- [ ] 网络断开时显示错误提示
- [ ] 重试功能正常工作

---

## 常见问题

### Q1: 提示"请实现getASRToken函数"

**原因**: 未实现后端Token获取接口

**解决方案**:
1. 在后端实现阿里云ASR Token生成接口
2. 更新`services/alibabaASR.ts`中的`getASRToken`函数
3. 参考[阿里云文档](https://help.aliyun.com/zh/isi/)获取Token

### Q2: iOS真机无法录音

**原因**: 未配置麦克风权限描述

**解决方案**:
在`app.json`中添加:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-audio",
        {
          "microphonePermission": "允许应用访问您的麦克风"
        }
      ]
    ]
  }
}
```

### Q3: 录音质量差,识别不准

**原因**: 环境噪音或配置不当

**解决方案**:
1. 在安静环境测试
2. 确认`ASR_RECORDING_PRESET`配置正确
3. 检查设备麦克风是否正常

### Q4: 转录超时

**原因**: 网络慢或音频文件过大

**解决方案**:
1. 检查网络连接
2. 减少录音时长
3. 增加`VOICE_CONFIG.API_TIMEOUT`值

---

## 下一步

✅ 完成基础集成后,可以继续:

1. **添加波形动画**: 参考`components/WaveformBar.tsx`
2. **优化错误处理**: 添加更友好的错误提示
3. **添加重试机制**: 实现自动或手动重试
4. **性能监控**: 集成Analytics追踪性能指标
5. **单元测试**: 编写测试用例确保稳定性

---

**文档版本**: 1.0.0
**维护人**: Claude (AI Assistant)
**最后更新**: 2025-11-10
