# 环境变量配置指南

## 📖 概述

本项目使用类似 Vite 的多环境文件合并机制，支持灵活的环境配置管理。

## 🎯 核心特性

### 1. 多文件支持

```
.env                  # 所有环境的基础配置（提交到 git）
.env.local            # 本地覆盖配置（不提交到 git）
.env.dev              # 开发环境配置（提交到 git）
.env.dev.local        # 开发环境本地覆盖（不提交到 git）
.env.uat              # UAT 环境配置（提交到 git）
.env.uat.local        # UAT 环境本地覆盖（不提交到 git）
.env.prod             # 生产环境配置（提交到 git）
.env.prod.local       # 生产环境本地覆盖（不提交到 git）
```

### 2. 加载优先级

变量会按以下顺序加载（后加载的会覆盖先加载的）：

```
命令行环境变量 > .env.[mode].local > .env.[mode] > .env.local > .env
```

**示例**：

如果 `APP_ENV=dev`，加载顺序为：

1. `.env` - 基础配置
2. `.env.local` - 本地覆盖
3. `.env.dev` - 开发环境配置
4. `.env.dev.local` - 开发环境本地覆盖

### 3. EXPO*PUBLIC* 前缀

只有以 `EXPO_PUBLIC_` 开头的变量才会暴露到应用中。

**正确 ✅**：

```bash
EXPO_PUBLIC_API_URL=https://api.example.com  # ✅ 可以在应用中访问
```

**错误 ❌**：

```bash
API_URL=https://api.example.com  # ❌ 无法在应用中访问
```

## 🚀 快速开始

### 第 1 步：创建环境文件

#### .env（基础配置）

```bash
# 所有环境通用的配置
EXPO_PUBLIC_APP_ENV=dev
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_API_TIMEOUT=15000
EXPO_PUBLIC_ENABLE_LOGGING=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ALIBABA_ASR_API_URL=https://nls-gateway.cn-shanghai.aliyuncs.com
```

#### .env.dev（开发环境）

```bash
# 开发环境特定配置
EXPO_PUBLIC_API_BASE_URL=https://api-dev.example.com
EXPO_PUBLIC_ENABLE_LOGGING=true
EXPO_PUBLIC_DEBUG_MODE=true
```

#### .env.local（本地配置 - 不提交）

```bash
# 本地敏感信息
EXPO_PUBLIC_ALIBABA_ASR_TOKEN=your_token_here
```

### 第 2 步：启动应用

```bash
# 开发环境（加载 .env + .env.local + .env.dev + .env.dev.local）
npm run start:dev

# UAT 环境（加载 .env + .env.local + .env.uat + .env.uat.local）
npm run start:uat

# 生产环境（加载 .env + .env.local + .env.prod + .env.prod.local）
npm run start:prod
```

### 第 3 步：在应用中访问

```typescript
// 方式 1：直接访问 process.env
const apiUrl = process.env.EXPO_PUBLIC_API_URL

// 方式 2：使用统一的 env 配置（推荐）
import { env } from "@/config/env"

const apiUrl = env.api.baseUrl
const enableLogging = env.features.enableLogging
```

## 📁 完整示例

### 项目结构

```
your-project/
├── .env                      # ✅ 提交到 git
├── .env.local                # ❌ 不提交（添加到 .gitignore）
├── .env.dev                  # ✅ 提交到 git
├── .env.dev.local            # ❌ 不提交
├── .env.uat                  # ✅ 提交到 git
├── .env.uat.local            # ❌ 不提交
├── .env.prod                 # ✅ 提交到 git
├── .env.prod.local           # ❌ 不提交
└── .env.local.example        # ✅ 提交（作为模板）
```

### .gitignore 配置

确保 `.gitignore` 包含：

```gitignore
# 本地环境文件
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local
```

## 🔧 配置示例

### 场景 1：团队共享的开发配置

**需求**：团队使用相同的开发环境 API

**.env.dev**（提交到 git）

```bash
EXPO_PUBLIC_API_BASE_URL=https://api-dev.example.com
EXPO_PUBLIC_ENABLE_LOGGING=true
```

### 场景 2：个人本地配置

**需求**：某个开发者想使用本地 API 服务器

**.env.local**（不提交）

```bash
# 覆盖团队配置，使用本地 API
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### 场景 3：敏感信息管理

**需求**：每个开发者有自己的 API Token

**.env.local.example**（提交作为模板）

```bash
# 复制为 .env.local 并填写你的 token
EXPO_PUBLIC_ALIBABA_ASR_TOKEN=your_token_here
```

**.env.local**（不提交）

```bash
# 每个开发者填写自己的 token
EXPO_PUBLIC_ALIBABA_ASR_TOKEN=abc123xyz456...
```

## 🎨 最佳实践

### ✅ 推荐做法

1. **基础配置放 .env**

   ```bash
   # .env - 所有环境通用的默认值
   EXPO_PUBLIC_API_TIMEOUT=15000
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

2. **环境差异放 .env.[mode]**

   ```bash
   # .env.dev
   EXPO_PUBLIC_API_BASE_URL=https://api-dev.example.com

   # .env.prod
   EXPO_PUBLIC_API_BASE_URL=https://api.example.com
   ```

3. **敏感信息放 .env.local**

   ```bash
   # .env.local（不提交）
   EXPO_PUBLIC_ALIBABA_ASR_TOKEN=your_secret_token
   ```

4. **提供 .env.local.example**
   ```bash
   # .env.local.example（作为模板）
   EXPO_PUBLIC_ALIBABA_ASR_TOKEN=填写你的 token
   ```

### ❌ 避免做法

1. ❌ 在 .env 中存储敏感信息
2. ❌ 提交 .env.local 到 git
3. ❌ 在多个文件中重复定义相同变量（除非有意覆盖）
4. ❌ 使用没有 `EXPO_PUBLIC_` 前缀的变量（应用中无法访问）

## 🔍 调试

### 查看加载的环境变量

启动应用时，控制台会显示加载信息：

```bash
🔄 Loading environment variables for mode: dev
📁 Root directory: /path/to/project

✅ Loaded: .env
✅ Loaded: .env.local
✅ Loaded: .env.dev
⏭️  Skipped: .env.dev.local (not found or invalid)

📊 Summary:
  - Loaded: 3 files
  - Skipped: 1 files
  - Variables: 15

🔐 Environment Variables Summary:
============================================================
  EXPO_PUBLIC_API_URL = https://api-dev.example.com
  EXPO_PUBLIC_ALIBABA_ASR_TOKEN = abc1****xyz6
============================================================
```

### 验证环境变量

在应用中添加调试代码：

```typescript
// App.tsx 或任何组件
console.log("Environment:", process.env.EXPO_PUBLIC_APP_ENV)
console.log("API URL:", process.env.EXPO_PUBLIC_API_BASE_URL)
console.log(
  "All EXPO_PUBLIC vars:",
  Object.keys(process.env)
    .filter(key => key.startsWith("EXPO_PUBLIC_"))
    .reduce((obj, key) => ({ ...obj, [key]: process.env[key] }), {})
)
```

## 🆚 与其他方案对比

### Vite

```typescript
// Vite 方式
const apiUrl = import.meta.env.VITE_API_URL

// Expo 方式
const apiUrl = process.env.EXPO_PUBLIC_API_URL
```

### Create React App

```typescript
// CRA 方式
const apiUrl = process.env.REACT_APP_API_URL

// Expo 方式
const apiUrl = process.env.EXPO_PUBLIC_API_URL
```

### Next.js

```typescript
// Next.js 方式（客户端）
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// Expo 方式
const apiUrl = process.env.EXPO_PUBLIC_API_URL
```

## 🔄 迁移指南

### 从旧的单文件方式迁移

**之前**：

```bash
# 只有一个 .env.dev 文件
APP_ENV=dev npx expo start
```

**现在**：

```bash
# 拆分为多个文件
.env           # 基础配置
.env.dev       # 开发环境配置
.env.local     # 本地配置

APP_ENV=dev npx expo start
```

**迁移步骤**：

1. 创建 `.env` 文件，放入通用配置
2. 保留 `.env.dev`，只保留开发环境特定的配置
3. 创建 `.env.local`，放入敏感信息
4. 创建 `.env.local.example` 作为模板
5. 更新 `.gitignore`

## 📚 相关文档

- [Expo 环境变量官方文档](https://docs.expo.dev/guides/environment-variables/)
- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [loadEnv API 文档](../config/loadEnv.js)

## 🐛 常见问题

### Q1: 为什么我的环境变量没有生效？

**A**: 检查以下几点：

1. 变量名是否以 `EXPO_PUBLIC_` 开头
2. 是否重启了开发服务器（`npx expo start --clear`）
3. 文件名是否正确（`.env.dev` 而不是 `.env-dev`）
4. 文件编码是否为 UTF-8

### Q2: 如何验证加载了哪些文件？

**A**: 启动应用时查看控制台输出，会显示加载的文件列表

### Q3: .env.local 和 .env.dev.local 有什么区别？

**A**:

- `.env.local` - 所有环境都会加载
- `.env.dev.local` - 只在 dev 环境加载

### Q4: 生产环境如何管理敏感信息？

**A**:

- 在 CI/CD 中通过环境变量注入
- 不要将敏感信息提交到 git
- 使用密钥管理服务（如 AWS Secrets Manager）

## 💡 提示

- 🔒 永远不要提交包含敏感信息的文件到 git
- 📝 为新成员提供 `.env.local.example` 模板
- 🔄 环境变量修改后需要重启开发服务器
- 🐛 使用 `--clear` 标志清除缓存：`npx expo start --clear`
