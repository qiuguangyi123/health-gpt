# 实现计划: 语音识别与转文字功能

**分支**: `001-voice-recognition` | **日期**: 2025-11-10 | **规格**: [spec.md](./spec.md)
**输入**: 功能规格来自 `/specs/001-voice-recognition/spec.md`

## 概要

实现一个语音录制和转文字功能,用户可以按住按钮录制语音(最长60秒),录制的音频通过阿里云ASR服务转换为中文文本。核心技术方案包括:使用expo-av进行音频录制,react-native-reanimated实现60fps波形动画,通过HTTPS调用阿里云ASR API进行语音识别,仅支持中文(普通话),录音数据临时存储并在转录后立即删除。

## 技术上下文

**语言/版本**: TypeScript 5.8.3 + React Native 0.79.5
**主要依赖**:
- React Native + Expo (~53.0.20)
- React Native Paper (~5.14.5) - UI组件
- React Native Reanimated (~3.17.4) - 动画
- expo-av - 音频录制
- expo-haptics (~14.1.4) - 触觉反馈
- @react-native-async-storage/async-storage - 临时存储
- axios 或 fetch API - HTTP请求
- 阿里云 ASR SDK (需要研究最佳集成方式)

**存储**: AsyncStorage用于临时音频文件缓存(转录后删除),不需要持久化数据库
**测试**: React Native Testing Library + Jest
**目标平台**: iOS 14+ 和 Android API 23+ (React Native支持范围)
**项目类型**: 移动应用 (React Native Expo)
**性能目标**:
- 录音启动延迟 < 200ms
- 波形动画 60fps
- 转录完成时间 < 5秒 (2秒录音 + 3秒处理)
- 取消录音反馈 < 100ms

**约束**:
- 必须有互联网连接
- 必须获得麦克风权限
- 仅支持中文(普通话)
- 音频临时存储,转录后立即删除
- 不支持离线模式
- 手动重试,无自动重试

**规模/范围**: 单一功能模块,集成到现有聊天界面

## 宪章合规性检查

*关卡: 必须在Phase 0研究前通过。Phase 1设计后重新检查。*

### ✅ 一、中文优先原则

- [x] 所有文档使用中文编写 ✓
- [x] 代码注释使用中文 ✓
- [x] 提交信息使用中文 ✓
- [x] 仅支持中文(普通话)语音识别 ✓

### ✅ 二、性能优先的动画原则

- [x] 波形动画使用 react-native-reanimated ✓
- [x] 使用 useSharedValue 和 useAnimatedStyle ✓
- [x] 维度计算在worklet外部 ✓
- [x] 目标60fps性能 ✓

### ✅ 三、选择性动画使用

- [x] 录音按钮按压反馈动画 ✓ (关键交互)
- [x] 波形动画(录音时) ✓ (必要的视觉反馈)
- [x] 状态转换动画(录音→转录→完成) ✓ (重要状态变化)
- [x] 消息条目使用轻量级FadeInDown (200ms) ✓

### ✅ 四、组件复用与封装原则

- [x] 波形条组件已封装为WaveformBar ✓
- [x] 使用React.memo优化 ✓
- [x] 需要创建可复用的录音hooks (useVoiceRecording)
- [x] 需要创建可复用的ASR服务hooks (useAlibabaASR)

### ✅ 五、渐进式功能开发

- [x] P1: 录音和转录核心功能 ✓
- [x] P2: 错误处理和边缘情况 ✓
- [x] P3: 录音时长显示和控制 ✓
- [x] 每个优先级独立可测试 ✓

**状态**: ✅ 通过 - 无违规项需要证明

## 项目结构

### 文档 (本功能)

```text
specs/001-voice-recognition/
├── spec.md              # 功能规格(已完成)
├── plan.md              # 本文件(由 /speckit.plan 命令生成)
├── research.md          # Phase 0 输出(技术研究)
├── data-model.md        # Phase 1 输出(数据模型)
├── quickstart.md        # Phase 1 输出(快速开始指南)
├── contracts/           # Phase 1 输出(API合约)
│   └── alibaba-asr-api.md
└── tasks.md             # Phase 2 输出(由 /speckit.tasks 命令生成)
```

### 源代码 (仓库根目录)

```text
app/
├── (tabs)/
│   └── index.tsx        # 现有聊天界面(需要集成录音功能)
└── ...

components/
├── WaveformBar.tsx      # 已存在的波形条组件
├── VoiceRecorder.tsx    # 新增: 录音控制组件
├── VoiceMessage.tsx     # 新增: 语音消息显示组件
└── RecordButton.tsx     # 新增: 录音按钮组件

hooks/
├── useVoiceRecording.ts # 新增: 录音逻辑hook
├── useAlibabaASR.ts     # 新增: 阿里云ASR集成hook
└── useNetworkStatus.ts  # 新增: 网络状态监听hook

services/
├── alibabaASR.ts        # 新增: 阿里云ASR服务封装
├── audioRecorder.ts     # 新增: 音频录制服务
└── audioStorage.ts      # 新增: 临时音频存储管理

types/
├── voice.ts             # 新增: 语音相关类型定义
└── asr.ts               # 新增: ASR相关类型定义

utils/
├── audioFormat.ts       # 新增: 音频格式转换工具
└── permissions.ts       # 新增: 权限请求工具

constants/
└── voice.ts             # 新增: 语音功能相关常量

tests/
├── unit/
│   ├── useVoiceRecording.test.ts
│   ├── useAlibabaASR.test.ts
│   └── audioStorage.test.ts
└── integration/
    └── voiceRecording.test.ts
```

**结构决策**: 采用移动应用结构,功能模块化。将录音功能拆分为多个小组件和hooks,遵循React Native最佳实践和项目现有架构。所有新增代码集成到现有的app/components/hooks目录结构中。

## 复杂度追踪

无需填写 - 无宪章违规项。

## Phase 0: 大纲与研究

**目标**: 解决所有技术未知项,为Phase 1设计提供依据

### 需要研究的技术决策

| 研究项 | 问题 | 优先级 |
|--------|------|--------|
| 阿里云ASR集成方式 | 使用官方SDK还是直接调用REST API?如何处理认证? | P1 |
| 音频录制库选择 | expo-av vs react-native-audio-recorder vs expo-audio | P1 |
| 音频格式要求 | 阿里云ASR支持哪些格式?采样率要求?是否需要转码? | P1 |
| 临时文件存储策略 | 使用文件系统还是内存?如何确保转录后删除? | P1 |
| 网络状态监听 | 如何实时监测网络连接?使用哪个库? | P2 |
| 错误处理模式 | 阿里云ASR错误码映射?如何显示用户友好的错误信息? | P2 |
| 性能优化 | 如何优化音频上传速度?是否需要压缩? | P2 |

### 研究任务列表

1. **阿里云ASR SDK调研**
   - 官方文档: https://help.aliyun.com/product/30413.html
   - React Native集成方案
   - 认证方式(AccessKey ID/Secret)
   - API调用限制和配额

2. **音频录制方案**
   - expo-av能力评估
   - 录音质量配置
   - 权限请求最佳实践

3. **音频格式处理**
   - 阿里云ASR支持的格式列表
   - React Native音频编码能力
   - 是否需要第三方转码库

4. **文件存储与清理**
   - Expo FileSystem API
   - 临时文件命名策略
   - 自动清理机制

**输出**: `research.md` - 包含所有研究结果和技术决策

**状态**: ✅ 已完成

---

## Phase 1: 设计与架构

**目标**: 基于Phase 0研究结果,设计数据模型、API合约和快速开始指南

### 设计任务

| 任务 | 输出文档 | 状态 |
|------|---------|------|
| 数据模型设计 | data-model.md | ✅ 已完成 |
| API合约定义 | contracts/alibaba-asr-api.md | ✅ 已完成 |
| 快速开始指南 | quickstart.md | ✅ 已完成 |

### 设计产出

#### 1. 数据模型 (data-model.md)

**定义的实体**:
- `VoiceRecording`: 录音会话实体(7个状态)
- `Transcription`: 转录结果实体(5个状态)
- `VoiceMessage`: 语音消息实体

**状态机设计**:
- 录音状态机: idle → preparing → recording → stopping → completed/cancelled/failed
- 转录状态机: pending → uploading → processing → completed/failed (支持手动重试)

**数据流转**:
- 完整的从录音到转录到消息的数据流程图
- React State管理策略
- 性能优化考虑(SharedValue避免re-render)

#### 2. API合约 (contracts/alibaba-asr-api.md)

**定义内容**:
- RESTful API端点和认证方式(Token认证 vs AccessKey签名)
- 请求格式(Headers + Binary Body)
- 响应格式(成功/失败结构)
- 完整错误码映射(27个错误码)
- 使用示例和测试用例

**关键决策**:
- 使用Token认证(后端获取,前端使用)
- 16kHz单声道AAC格式
- 15秒请求超时
- 指数退避重试策略

#### 3. 快速开始指南 (quickstart.md)

**指南内容**:
- 环境配置和依赖安装(6个npm包)
- 项目结构创建(7个目录)
- 核心服务实现(常量、类型、ASR服务)
- Hooks实现(useVoiceRecording)
- UI组件实现(RecordButton)
- 集成示例和测试清单
- 常见问题解答(4个FAQ)

**预计完成时间**: 30-45分钟(按照指南操作)

### 宪章合规性复查

Phase 1设计完成后,重新检查宪章合规性:

#### ✅ 一、中文优先原则

- [x] 所有设计文档使用中文编写 ✓
- [x] 代码注释使用中文 ✓
- [x] 类型定义包含中文说明 ✓
- [x] 错误消息使用中文 ✓

#### ✅ 二、性能优先动画原则

- [x] 数据模型考虑SharedValue优化 ✓
- [x] 避免高频re-render(录音计时器) ✓
- [x] 组件使用React.memo优化 ✓

#### ✅ 三、数据隐私原则

- [x] 音频文件存储在Cache目录 ✓
- [x] 转录成功后立即删除 ✓
- [x] 三层清理机制设计 ✓
- [x] 仅持久化转录文本 ✓

#### ✅ 四、组件复用与封装

- [x] Hook封装(useVoiceRecording, useAlibabaASR) ✓
- [x] 组件封装(RecordButton, VoiceMessage) ✓
- [x] 服务层封装(alibabaASR, audioStorage) ✓

#### ✅ 五、渐进式功能开发

- [x] 设计支持P1/P2/P3优先级分离 ✓
- [x] 核心功能独立可测试 ✓

**状态**: ✅ 完全合规

### Phase 1总结

**完成日期**: 2025-11-10

**交付成果**:
- ✅ data-model.md (5个核心实体 + 2个状态机 + 数据流转图)
- ✅ contracts/alibaba-asr-api.md (完整API合约 + 27个错误码 + 使用示例)
- ✅ quickstart.md (7步集成指南 + 代码示例 + FAQ)

**下一步**: Phase 2 - 任务分解 (使用 `/speckit.tasks` 命令生成)

---

## Phase 2: 任务分解与执行计划

*此阶段将通过 `/speckit.tasks` 命令自动生成 `tasks.md` 文件...*
