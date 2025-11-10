# 数据模型设计: 语音识别与转文字功能

**功能**: 001-voice-recognition | **日期**: 2025-11-10 | **Phase**: 1
**规格**: [spec.md](./spec.md) | **研究**: [research.md](./research.md)

## 概述

本文档定义语音识别功能的核心数据模型、状态机和数据流转逻辑。所有设计基于Phase 0研究结果和功能规格。

## 核心实体

### 1. VoiceRecording (录音会话)

**用途**: 表示一次完整的音频录制会话

**类型定义**:
```typescript
interface VoiceRecording {
  // 唯一标识
  id: string                    // 录音会话ID,格式: "rec_<timestamp>_<random>"

  // 录音数据
  uri: string                   // 音频文件本地URI (FileSystem.cacheDirectory)
  duration: number              // 录音时长(秒),范围: 0.5-60
  fileSize: number              // 文件大小(字节)
  format: 'aac'                 // 音频格式,固定为AAC

  // 录音配置
  sampleRate: 16000             // 采样率(Hz)
  channels: 1                   // 声道数(单声道)
  bitRate: 64000                // 比特率(bps)

  // 时间戳
  startedAt: number             // 开始录音时间戳(ms)
  stoppedAt?: number            // 停止录音时间戳(ms)

  // 状态
  status: RecordingStatus       // 录音状态,见状态机定义
  error?: RecordingError        // 录音错误信息
}

type RecordingStatus =
  | 'idle'                      // 未开始
  | 'preparing'                 // 准备中
  | 'recording'                 // 录音中
  | 'stopping'                  // 停止中
  | 'completed'                 // 录音完成
  | 'cancelled'                 // 已取消
  | 'failed'                    // 录音失败

interface RecordingError {
  code: string                  // 错误码,如 'TOO_SHORT', 'DEVICE_NOT_SUPPORTED'
  message: string               // 错误描述
  timestamp: number             // 错误发生时间
}
```

**生命周期**:
```
创建 → 准备 → 录音中 → 停止 → 完成/取消/失败 → 清理
```

**存储位置**:
- 仅存在于内存中(React state)
- 音频文件存储在`FileSystem.cacheDirectory`
- 转录完成或失败后立即删除

---

### 2. Transcription (转录结果)

**用途**: 表示一次语音转文字处理的结果

**类型定义**:
```typescript
interface Transcription {
  // 唯一标识
  id: string                    // 转录ID,格式: "trans_<timestamp>_<random>"
  recordingId: string           // 关联的录音会话ID

  // 转录结果
  text: string                  // 识别出的文本内容
  confidence?: number           // 置信度(0-1),可选,取决于ASR API返回
  languageCode: 'zh-CN'         // 语言代码,固定为中文普通话

  // ASR服务信息
  provider: 'alibaba-asr'       // 服务提供商,固定为阿里云ASR
  taskId?: string               // ASR任务ID(用于调试和问题追踪)

  // 时间信息
  requestedAt: number           // 发起转录请求时间戳(ms)
  completedAt?: number          // 转录完成时间戳(ms)
  processingTime?: number       // 处理耗时(ms)

  // 状态
  status: TranscriptionStatus   // 转录状态,见状态机定义
  error?: TranscriptionError    // 转录错误信息
  retryCount: number            // 重试次数,初始为0
}

type TranscriptionStatus =
  | 'pending'                   // 等待处理
  | 'uploading'                 // 上传音频中
  | 'processing'                // 服务器处理中
  | 'completed'                 // 转录成功
  | 'failed'                    // 转录失败

interface TranscriptionError {
  code: string                  // 错误码,如 'NETWORK_UNAVAILABLE', 'ASR_40000001'
  message: string               // 错误描述
  userMessage: string           // 用户友好的错误提示
  retryable: boolean            // 是否可重试
  timestamp: number             // 错误发生时间
}
```

**生命周期**:
```
创建 → 上传音频 → 服务器处理 → 完成/失败 → (失败时可手动重试)
```

**存储位置**:
- 仅存在于内存中(React state)
- 成功后text保存到VoiceMessage
- 失败后保留用于重试,直到用户取消或成功

---

### 3. VoiceMessage (语音消息)

**用途**: 表示聊天界面中的一条语音消息

**类型定义**:
```typescript
interface VoiceMessage {
  // 唯一标识
  id: string                    // 消息ID,格式: "msg_<timestamp>_<random>"

  // 消息内容
  text: string                  // 转录后的文本内容
  isVoice: true                 // 标记为语音消息(与普通文本消息区分)

  // 元数据
  recordingDuration: number     // 原始录音时长(秒)
  transcriptionTime: number     // 转录耗时(ms)

  // 时间信息
  createdAt: number             // 消息创建时间戳(ms)

  // 用户信息
  role: 'user' | 'assistant'    // 发送者角色,语音消息固定为'user'

  // 显示控制
  isStreaming?: boolean         // 是否正在流式显示(转录中)
}
```

**生命周期**:
```
转录完成 → 创建消息 → 添加到聊天历史 → 持久化存储(AsyncStorage)
```

**存储位置**:
- 聊天历史数组中(React state)
- 持久化到AsyncStorage(可选,取决于应用需求)

---

## 状态机

### 录音状态机

```
┌─────────┐
│  idle   │ 初始状态
└────┬────┘
     │ startRecording()
     ▼
┌─────────┐
│preparing│ 准备录音器
└────┬────┘
     │ onPrepared()
     ▼
┌─────────┐────────────────┐
│recording│ 录音中         │
└────┬────┘                │
     │                     │ onError()
     │ stopRecording()     │
     ▼                     ▼
┌─────────┐            ┌────────┐
│stopping │            │ failed │ 失败状态
└────┬────┘            └────────┘
     │
     ├─ duration >= 0.5s ─┐
     │                    ▼
     │               ┌──────────┐
     │               │completed │ 完成状态
     │               └──────────┘
     │
     └─ duration < 0.5s ──┐
                          ▼
                     ┌─────────┐
                     │cancelled│ 取消状态
                     └─────────┘
```

**状态转换规则**:

| 当前状态 | 触发事件 | 下一状态 | 副作用 |
|---------|---------|---------|--------|
| idle | startRecording() | preparing | 请求麦克风权限 |
| preparing | onPrepared() | recording | 启动波形动画,开始计时 |
| preparing | onError() | failed | 显示错误提示 |
| recording | stopRecording() | stopping | 停止波形动画 |
| recording | maxDuration(60s) | stopping | 自动停止,触觉反馈 |
| recording | onError() | failed | 停止录音,显示错误 |
| stopping | duration >= 0.5s | completed | 保存音频文件 |
| stopping | duration < 0.5s | cancelled | 删除音频文件,触觉反馈 |

**不可逆转换**:
- `failed`, `completed`, `cancelled` 为终态,不可转换到其他状态

---

### 转录状态机

```
┌─────────┐
│ pending │ 等待处理
└────┬────┘
     │ startTranscription()
     ▼
┌──────────┐
│uploading │ 上传音频
└────┬─────┘
     │
     ├─ onUploadSuccess() ─┐
     │                     ▼
     │                ┌───────────┐
     │                │processing │ 服务器处理
     │                └─────┬─────┘
     │                      │
     │                      ├─ onSuccess() ──┐
     │                      │                 ▼
     │                      │            ┌──────────┐
     │                      │            │completed │ 完成
     │                      │            └──────────┘
     │                      │
     │                      └─ onError() ─┐
     │                                    │
     └─ onUploadError() ─────────────────┤
                                          ▼
                                     ┌────────┐
                                     │ failed │ 失败
                                     └───┬────┘
                                         │
                                         │ retry() (手动)
                                         │
                                         └──────┐
                                                ▼
                                           ┌─────────┐
                                           │ pending │ 重新开始
                                           └─────────┘
```

**状态转换规则**:

| 当前状态 | 触发事件 | 下一状态 | 副作用 |
|---------|---------|---------|--------|
| pending | startTranscription() | uploading | 开始上传音频,显示加载动画 |
| uploading | onUploadSuccess() | processing | 显示"识别中"提示 |
| uploading | onUploadError() | failed | 保留音频文件,显示重试按钮 |
| processing | onSuccess() | completed | 删除音频文件,创建VoiceMessage |
| processing | onError() | failed | 保留音频文件,解析错误码 |
| failed | retry() | pending | retryCount++ |

**重试机制**:
- 仅支持手动重试(用户点击"重试"按钮)
- 重试时使用相同的音频文件(避免重新录音)
- 最多允许无限次重试(无上限)
- 每次重试递增`retryCount`

---

## 数据流转

### 完整流程图

```
┌──────────────────────────────────────────────────────────────┐
│                      语音转文字完整流程                        │
└──────────────────────────────────────────────────────────────┘

1. 用户交互
   │
   ▼
   [按住录音按钮] ──────────────────────────────────────┐
                                                      │
2. 录音阶段                                            │
   │                                                  │
   ├─ VoiceRecording创建 (status: 'preparing')        │
   ├─ 请求麦克风权限                                   │
   ├─ 准备录音器                                       │
   ├─ status → 'recording'                            │
   ├─ 启动波形动画 (60fps)                             │
   ├─ 显示录音时长计时器                               │
   │                                                  │
   ▼                                                  │
   [用户松开按钮] ────────────────────┐                │
                                    │                │
3. 录音结束判断                       │                │
   │                                │ 或             │
   ├─ duration >= 0.5s?             │ [60秒自动停止] │
   │                                │                │
   ├─ YES: status → 'completed'     ├────────────────┘
   │   ├─ 保存音频到Cache           │
   │   ├─ 停止波形动画               │
   │   └─ 触觉反馈                   │
   │                                │
   └─ NO: status → 'cancelled'      │
       ├─ 删除音频文件               │
       ├─ 触觉反馈(错误)             │
       └─ 显示"录音时间过短"         │
                                    │
4. 转录阶段                           │
   │ ◄───────────────────────────────┘
   │
   ├─ Transcription创建 (status: 'pending')
   ├─ 检查网络连接
   │  │
   │  ├─ 无网络: 显示错误,保留音频供重试
   │  └─ 有网络: 继续
   │
   ├─ status → 'uploading'
   ├─ 读取音频文件 (FileSystem.readAsStringAsync)
   ├─ Base64编码
   ├─ 发送POST请求到阿里云ASR API
   │
   ▼
   [等待ASR响应]
   │
   ├─ 成功: status → 'processing' → 'completed'
   │  ├─ 解析响应JSON
   │  ├─ 提取text字段
   │  ├─ 删除音频文件 (FileSystem.deleteAsync)
   │  └─ 创建VoiceMessage
   │
   └─ 失败: status → 'failed'
       ├─ 保留音频文件
       ├─ 解析错误码
       ├─ 显示用户友好错误提示
       └─ 显示"重试"按钮
           │
           └─ [用户点击重试] → 回到转录阶段

5. 消息展示
   │
   ├─ VoiceMessage添加到聊天历史
   ├─ 显示转录文本
   ├─ 标记为语音消息 (显示麦克风图标)
   └─ 淡入动画 (FadeInDown 200ms)
```

---

## 数据关系

### 实体关系图

```
┌─────────────────┐
│ VoiceRecording  │ 1:1 录音产生一个转录
├─────────────────┤
│ id              │───────┐
│ uri             │       │
│ duration        │       │
│ status          │       │
└─────────────────┘       │
                          │
                          ▼
                   ┌─────────────────┐
                   │  Transcription  │ 1:1 转录创建一条消息
                   ├─────────────────┤
                   │ id              │───────┐
                   │ recordingId     │       │
                   │ text            │       │
                   │ status          │       │
                   └─────────────────┘       │
                                             │
                                             ▼
                                      ┌─────────────────┐
                                      │  VoiceMessage   │
                                      ├─────────────────┤
                                      │ id              │
                                      │ text            │
                                      │ isVoice: true   │
                                      └─────────────────┘
```

**数据传递**:
1. `VoiceRecording.uri` → 传递给转录服务
2. `VoiceRecording.duration` → 传递给 `VoiceMessage.recordingDuration`
3. `Transcription.text` → 传递给 `VoiceMessage.text`
4. `Transcription.processingTime` → 传递给 `VoiceMessage.transcriptionTime`

---

## React State管理

### Hook状态设计

```typescript
// hooks/useVoiceRecording.ts
const useVoiceRecording = () => {
  // 当前录音会话
  const [recording, setRecording] = useState<VoiceRecording | null>(null)

  // 录音时长(实时更新)
  const [duration, setDuration] = useState(0)

  // 是否正在录音
  const isRecording = recording?.status === 'recording'

  return {
    recording,
    duration,
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}

// hooks/useAlibabaASR.ts
const useAlibabaASR = () => {
  // 当前转录任务
  const [transcription, setTranscription] = useState<Transcription | null>(null)

  // 是否正在转录
  const isTranscribing = transcription?.status === 'uploading' ||
                         transcription?.status === 'processing'

  return {
    transcription,
    isTranscribing,
    transcribe,
    retry,
    cancel,
  }
}
```

### 组件状态层级

```
<ChatScreen>  ─── messages: VoiceMessage[]
  │
  ├─ <VoiceRecorder>
  │    ├─ recording: VoiceRecording (useVoiceRecording)
  │    ├─ duration: number
  │    │
  │    └─ <RecordButton>
  │         ├─ isRecording: boolean
  │         └─ pressScale: SharedValue (动画)
  │
  └─ <MessageList>
       └─ <VoiceMessage> × N
            ├─ message: VoiceMessage
            └─ transcription?: Transcription (正在转录时)
```

---

## 性能优化考虑

### 内存管理

**问题**: 音频文件可能占用大量内存(60秒 ≈ 480KB)

**优化策略**:
1. 使用文件URI引用,不将音频加载到内存
2. Base64编码仅在上传时进行,立即释放
3. 转录完成后立即删除文件
4. 限制同时转录的数量(最多2个)

### 状态更新频率

**问题**: 录音时长每100ms更新可能导致频繁re-render

**优化策略**:
```typescript
// ❌ 错误: 每次更新都触发re-render
const [duration, setDuration] = useState(0)
useEffect(() => {
  const interval = setInterval(() => {
    setDuration(d => d + 0.1)  // 每100ms触发re-render
  }, 100)
}, [])

// ✅ 正确: 使用SharedValue避免re-render
const duration = useSharedValue(0)
useEffect(() => {
  const interval = setInterval(() => {
    duration.value += 0.1  // 不触发re-render
  }, 100)
}, [])

// 仅在需要显示时才转换为state
const durationText = useDerivedValue(() =>
  `${Math.floor(duration.value)}s`
)
```

### 组件渲染优化

```typescript
// 使用React.memo避免不必要的re-render
const VoiceMessage = React.memo(({ message }: Props) => {
  // ...
}, (prev, next) => {
  return prev.message.id === next.message.id &&
         prev.message.text === next.message.text
})
```

---

## 数据持久化

### 需要持久化的数据

| 数据 | 持久化方式 | 生命周期 | 原因 |
|------|-----------|---------|------|
| VoiceRecording | ❌ 不持久化 | 录音会话期间 | 临时数据,录音结束即销毁 |
| 音频文件 | Cache | 转录前 | 支持重试,转录后删除 |
| Transcription | ❌ 不持久化 | 转录任务期间 | 临时数据,成功后转为消息 |
| VoiceMessage | ✅ AsyncStorage | 永久 | 聊天历史需要持久化 |

### 持久化方案

```typescript
// 保存聊天历史(包含语音消息)
const saveMessages = async (messages: Message[]) => {
  try {
    const json = JSON.stringify(messages)
    await AsyncStorage.setItem('@chat_messages', json)
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

// 加载聊天历史
const loadMessages = async (): Promise<Message[]> => {
  try {
    const json = await AsyncStorage.getItem('@chat_messages')
    return json ? JSON.parse(json) : []
  } catch (error) {
    console.error('加载消息失败:', error)
    return []
  }
}
```

---

## 宪章合规性验证

### ✅ 中文优先原则

- [x] 所有类型定义使用中文注释
- [x] 错误消息使用中文(userMessage字段)
- [x] 状态机说明使用中文

### ✅ 性能优先动画原则

- [x] 波形动画使用SharedValue (不触发re-render)
- [x] 录音时长计时器使用SharedValue优化
- [x] 消息列表使用React.memo优化

### ✅ 数据隐私原则

- [x] 音频文件存储在Cache目录(系统可清理)
- [x] 转录成功后立即删除音频
- [x] VoiceRecording和Transcription不持久化
- [x] 仅保留转录后的文本

---

**设计完成日期**: 2025-11-10
**设计负责人**: Claude (AI Assistant)
**审核状态**: 待审核
**下一步**: 编写API合约文档 (contracts/alibaba-asr-api.md)
