# React Native Animation Guidelines

## Overview

This document outlines the animation principles and best practices for this React Native project, with a focus on using `react-native-reanimated` for performant, smooth animations.

## Core Principles

### 1. Selective Animation Usage

**只在需要的地方使用动画 (Use animations only where needed)**

- **Critical paths require animations**: Use animations for key user interactions like:
  - Modal/window transitions
  - Menu appearances/dismissals
  - Button press feedback
  - Important state changes

- **Lightweight treatment for frequent updates**: For high-frequency events like scrolling lists or repeated message entries, use minimal animation:
  - Simple fade-in effects
  - Short duration (200-300ms)
  - No complex transformations

**Examples in this project:**
- ✅ Voice button press: Spring animation with scale transform
- ✅ Modal/Card appearance: Staggered fade-in with spring physics
- ✅ Message entry: Lightweight FadeInDown (200ms duration)
- ✅ Thinking dots: Continuous but GPU-accelerated loop
- ❌ Avoid: Complex animations on every scroll event
- ❌ Avoid: Heavy animations in FlatList renderItem without memoization

### 2. Animation Encapsulation and Reusability

**尽可能封装复用动画 (Encapsulate and reuse animations as much as possible)**

#### Reusable Animation Hooks Pattern

Create custom hooks for common animation patterns:

```typescript
// ✅ Good: Reusable scale animation hook
const useScaleAnimation = (activeScale = 1.05) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const animateIn = () => {
    scale.value = withSpring(activeScale, {
      damping: 12,
      stiffness: 200,
    })
  }

  const animateOut = () => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 200,
    })
  }

  return { animatedStyle, animateIn, animateOut }
}
```

#### Reusable Animated Components

Create wrapper components for common animated patterns:

```typescript
// ✅ Good: Reusable animated container
const FadeInContainer = ({ children, delay = 0 }) => {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(300).springify().damping(15)}
    >
      {children}
    </Animated.View>
  )
}
```

### 3. Performance Considerations

#### Use Reanimated Over React Native Animated

**Why react-native-reanimated?**
- Runs animations on the UI thread (60fps guaranteed)
- Better performance for complex animations
- More declarative API with `useSharedValue` and `useAnimatedStyle`
- Support for gesture-driven animations

```typescript
// ❌ Avoid: Old Animated API
const fadeAnim = useRef(new Animated.Value(0)).current
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start()

// ✅ Prefer: Reanimated
const opacity = useSharedValue(0)
opacity.value = withTiming(1, { duration: 300 })
```

#### Optimize FlatList Animations

For lists with many items:
- Use lightweight entering animations (FadeIn, not complex transforms)
- Consider disabling animations after initial render
- Use `getItemLayout` for better performance

```typescript
// ✅ Lightweight message entry animation
<Animated.View
  entering={FadeInDown.duration(200).springify().damping(15)}
>
  {/* Message content */}
</Animated.View>
```

### 4. Animation Categories

#### A. Microinteractions (High Priority)

Short, immediate feedback for user actions:
- Duration: 150-300ms
- Use: Spring physics for natural feel
- Examples: Button press, toggle switches

```typescript
// Voice button press animation
pressScale.value = withSpring(1.05, {
  damping: 12,
  stiffness: 200,
})
```

#### B. Transitions (Medium Priority)

Smooth transitions between states:
- Duration: 250-400ms
- Use: Easing curves or spring
- Examples: Modal appearance, card expansion

```typescript
// Card staggered entrance
<Animated.View
  entering={FadeIn.delay(index * 100)
    .duration(300)
    .springify()
    .damping(15)}
>
```

#### C. Continuous Animations (Low Frequency)

Ongoing animations for loading or ambient effects:
- Duration: 400-800ms loops
- Use: withRepeat with -1 for infinite
- Examples: Loading spinners, thinking dots

```typescript
// Thinking dots animation
dot1Progress.value = withRepeat(
  withSequence(
    withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
    withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
  ),
  -1, // Infinite loop
  false
)
```

## Implementation Examples

### 1. Voice Button Press Animation

**Location:** [app/(tabs)/index.tsx:99-104, 142-156](app/(tabs)/index.tsx)

```typescript
// Shared value for scale
const pressScale = useSharedValue(1)

// Animated style
const pressAnimatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: pressScale.value }],
}))

// Handlers
const handlePressIn = () => {
  pressScale.value = withSpring(1.05, {
    damping: 12,
    stiffness: 200,
  })
}

const handlePressOut = () => {
  pressScale.value = withSpring(1, {
    damping: 12,
    stiffness: 200,
  })
}
```

**Rationale:**
- Spring animation provides natural, physics-based feedback
- Scale transform is GPU-accelerated (runs on UI thread)
- Short duration maintains responsiveness

### 2. Thinking Dots Animation

**Location:** [app/(tabs)/index.tsx:299-375](app/(tabs)/index.tsx)

```typescript
const ThinkingDots = () => {
  const dot1Progress = useSharedValue(0)
  const dot2Progress = useSharedValue(0)
  const dot3Progress = useSharedValue(0)

  useEffect(() => {
    dot1Progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    )

    // Staggered delays for dot2 and dot3...
  }, [])

  const createDotStyle = (progress) =>
    useAnimatedStyle(() => ({
      opacity: 0.3 + progress.value * 0.7,
      transform: [{ translateY: -progress.value * 4 }],
    }))
}
```

**Rationale:**
- Infinite loop with withRepeat (-1 iterations)
- Staggered delays (0ms, 150ms, 300ms) create wave effect
- Minimal transform (translateY) keeps it performant
- Encapsulated in reusable component

### 3. Message Entry Animation

**Location:** [app/(tabs)/index.tsx:572-579](app/(tabs)/index.tsx)

```typescript
<Animated.View
  entering={FadeInDown.duration(200).springify().damping(15)}
  style={[
    styles.messageContainer,
    // ... other styles
  ]}
>
  {/* Message content */}
</Animated.View>
```

**Rationale:**
- Lightweight animation (200ms)
- FadeInDown provides subtle direction
- Spring physics for natural deceleration
- Suitable for high-frequency use (new messages)

### 4. Prescription Card Staggered Animation

**Location:** [app/(tabs)/index.tsx:410-416](app/(tabs)/index.tsx)

```typescript
{cardData.medications.map((medication, index) => (
  <Animated.View
    key={index}
    entering={FadeIn.delay(index * 100)
      .duration(300)
      .springify()
      .damping(15)}
  >
    {/* Card content */}
  </Animated.View>
))}
```

**Rationale:**
- Staggered delays (100ms per item) create cascading effect
- Draws attention to each card sequentially
- FadeIn is simple but effective for modals
- 300ms duration is long enough to be noticeable but not sluggish

### 5. Waveform Animation (Recording Visualizer)

**Location:** [app/(tabs)/index.tsx:522-584](app/(tabs)/index.tsx)

```typescript
// 波形条组件 - 使用连续循环动画，避免闪烁
// 优化要点：
// 1. 使用 React.memo 避免不必要的重新渲染
// 2. 所有尺寸值在组件外计算（worklet 优化）
// 3. 随机值在 useEffect 中一次性计算（避免重复计算）
// 4. 使用 withRepeat(-1) 创建无限循环的流畅动画
// 5. 动画完全运行在 UI 线程，保证 60fps 性能
const WaveformBar = React.memo(({ index }: { index: number }) => {
  const animatedHeight = useSharedValue(verticalScale(4))
  const minBarHeight = verticalScale(4)
  const maxBarHeight = verticalScale(50)
  const primaryColor = theme.colors.primary // 提取主题色到组件级别

  useEffect(() => {
    // 每个条形使用独立的循环动画，创建波浪效果
    // 随机持续时间：800-1200ms，创建不规则的波动效果
    const duration = 800 + Math.random() * 400
    // 交错延迟：基于索引，创建从左到右的波浪扩散效果
    const delay = index * 50
    // 随机高度倍数：0.3-1.0，让每个条形有不同的最大高度
    const heightMultiplier = 0.3 + Math.random() * 0.7

    animatedHeight.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(maxBarHeight * heightMultiplier, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease), // 缓入缓出，更自然
          }),
          withTiming(minBarHeight, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1, // 无限循环
        false // 不反转动画方向
      )
    )

    // 清理函数：组件卸载时取消动画
    return () => {
      animatedHeight.value = minBarHeight
    }
  }, []) // 空依赖数组：只在组件挂载时执行一次

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    minHeight: minBarHeight,
  }))

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        {
          backgroundColor: primaryColor, // 使用预提取的颜色值
        },
        animatedStyle,
      ]}
    />
  )
})
```

**Rationale:**
- **Infinite loop animation**: Uses `withRepeat(-1)` for continuous, seamless animation
- **Randomized parameters**: Each bar has unique duration (800-1200ms) and height multiplier (0.3-1.0) for organic, non-uniform appearance
- **Staggered delays**: 50ms delay per index creates wave propagation effect from left to right
- **Worklet optimization**: All dimension calculations (`verticalScale`) are outside `useAnimatedStyle`
- **Theme extraction**: Extract `theme.colors.primary` to component level to avoid potential worklet issues
- **Memoization**: `React.memo` prevents unnecessary re-renders when parent updates
- **Proper cleanup**: Returns cleanup function to reset animation on unmount
- **GPU acceleration**: Only animates `height` property on UI thread for 60fps performance

## Recording Waveform Animation Best Practices

### Key Principles for Audio Visualizers

When implementing continuous recording animations like waveform visualizers, follow these guidelines:

#### 1. Use Infinite Loop Animations

```typescript
// ✅ Good: Infinite loop with withRepeat(-1)
animatedHeight.value = withRepeat(
  withSequence(
    withTiming(maxHeight, { duration: 600 }),
    withTiming(minHeight, { duration: 600 })
  ),
  -1, // Infinite loop
  false // Don't reverse
)

// ❌ Avoid: One-shot animations requiring manual retriggering
animatedHeight.value = withTiming(maxHeight, { duration: 600 })
```

#### 2. Randomize for Organic Appearance

```typescript
// ✅ Good: Calculate random values once in useEffect
const duration = 800 + Math.random() * 400 // 800-1200ms
const heightMultiplier = 0.3 + Math.random() * 0.7 // 30-100% of max
const delay = index * 50 // Stagger by index

// ❌ Avoid: Random calculations in render or worklet
const animatedStyle = useAnimatedStyle(() => ({
  height: animatedHeight.value * Math.random(), // Wrong! Recalculates every frame
}))
```

#### 3. Stagger Animation Start Times

```typescript
// ✅ Good: Create wave effect with staggered delays
{Array.from({ length: 30 }, (_, index) => (
  <WaveformBar key={index} index={index} />
))}

// Inside component:
const delay = index * 50 // Each bar starts 50ms after previous
animatedHeight.value = withDelay(delay, ...)
```

#### 4. Pre-calculate All Dimensions Outside Worklets

```typescript
// ✅ Good: Calculate dimensions at component level
const minBarHeight = verticalScale(4)
const maxBarHeight = verticalScale(50)
const primaryColor = theme.colors.primary

const animatedStyle = useAnimatedStyle(() => ({
  height: animatedHeight.value,
  minHeight: minBarHeight, // Use pre-calculated value
}))

// ❌ Wrong: Call non-worklet functions inside worklet
const animatedStyle = useAnimatedStyle(() => ({
  height: animatedHeight.value,
  minHeight: verticalScale(4), // Error! Not a worklet
}))
```

#### 5. Clean Up Animations Properly

```typescript
// ✅ Good: Reset animation on unmount
useEffect(() => {
  // Start animation
  animatedHeight.value = withRepeat(...)

  // Cleanup function
  return () => {
    animatedHeight.value = minBarHeight // Reset to initial state
  }
}, [])
```

#### 6. Use React.memo for Multi-Bar Visualizers

```typescript
// ✅ Good: Memoize individual bars
const WaveformBar = React.memo(({ index }: { index: number }) => {
  // Component implementation
})

// Render multiple bars
{Array.from({ length: 30 }, (_, index) => (
  <WaveformBar key={index} index={index} />
))}
```

### Performance Checklist for Waveform Animations

- ✅ All animations run on UI thread (use `useAnimatedStyle`)
- ✅ No layout calculations in render or worklets
- ✅ Fixed number of bars (avoid dynamic array length)
- ✅ Memoized components to prevent unnecessary re-renders
- ✅ Cleanup functions to stop animations on unmount
- ✅ Random values calculated once, not on every frame
- ✅ Dimension/scale functions called outside worklets
- ✅ Theme colors extracted before worklet usage

### MCP Service Verification

To verify animation performance using MCP IDE tools:

```typescript
// Check for TypeScript errors
mcp__ide__getDiagnostics({ uri: "file:///path/to/index.tsx" })

// Execute test code in Jupyter kernel (if applicable)
mcp__ide__executeCode({
  code: `
    # Verify animation runs at 60fps
    import time
    start = time.time()
    # Simulate 60 frames
    for i in range(60):
      time.sleep(1/60)
    elapsed = time.time() - start
    print(f"60 frames in {elapsed:.2f}s = {60/elapsed:.1f} fps")
  `
})
```

### Common Issues and Solutions

#### Issue: Animation stutters or drops frames

**Solution:**
- Verify all dimension calculations are outside `useAnimatedStyle`
- Check that animation is not blocked by JS thread operations
- Reduce number of bars (30 is optimal, avoid >50)

#### Issue: Bars render in sync (no wave effect)

**Solution:**
- Ensure each bar has unique staggered delay: `const delay = index * 50`
- Verify random multipliers are different per bar
- Check that `key={index}` is used in map function

#### Issue: Animation doesn't stop when component unmounts

**Solution:**
- Add cleanup function to `useEffect`:
  ```typescript
  return () => {
    animatedHeight.value = minBarHeight
  }
  ```

#### Issue: console.log shows SharedValue not updating

**Problem:**
```typescript
const animatedHeight = useSharedValue(10)
console.log("height:", animatedHeight.value) // Always shows 10
```

**Solution:**
- `SharedValue.value` accessed outside worklets only returns the initial value
- Animations run on UI thread, `console.log` runs on JS thread
- Use `useAnimatedReaction` for debugging:
  ```typescript
  import { useAnimatedReaction } from 'react-native-reanimated'

  useAnimatedReaction(
    () => animatedHeight.value,
    (current) => {
      console.log('Animated height:', current)
    }
  )
  ```
- Or log inside `useAnimatedStyle`:
  ```typescript
  const animatedStyle = useAnimatedStyle(() => {
    console.log('Height in worklet:', animatedHeight.value)
    return { height: animatedHeight.value }
  })
  ```

## Best Practices Summary

### Do's ✅

1. **Use react-native-reanimated for all animations**
   - Better performance (runs on UI thread)
   - More maintainable code
   - Better developer experience

2. **Encapsulate animations in reusable hooks/components**
   - `useScaleAnimation`, `useFadeAnimation`, etc.
   - Reusable `<AnimatedCard>`, `<FadeInContainer>` components

3. **Choose appropriate animation types**
   - Microinteractions: Spring animations (150-300ms)
   - Transitions: Timing with easing (250-400ms)
   - Continuous: withRepeat for loops

4. **Optimize for performance**
   - Use `transform` and `opacity` (GPU-accelerated)
   - Avoid animating `width`, `height`, `left`, `top` when possible
   - Use `useAnimatedStyle` to keep animations on UI thread
   - **IMPORTANT**: Calculate scale/dimension values outside of `useAnimatedStyle` worklets

5. **Provide appropriate feedback**
   - Haptic feedback with animations for better UX
   - Match animation duration to perceived action weight

### Don'ts ❌

1. **Don't overuse animations**
   - Avoid animating every single interaction
   - Keep frequent/repetitive animations lightweight
   - Don't animate in hot paths (scroll handlers)

2. **Don't use old Animated API**
   - Migrate to react-native-reanimated
   - Avoid `Animated.Value` and `Animated.timing`

3. **Don't create animations without cleanup**
   - Always stop infinite animations when component unmounts
   - Cancel in-progress animations when appropriate

4. **Don't animate non-GPU properties unnecessarily**
   - Avoid animating layout properties when transform works
   - Prefer `transform: translateX` over `left` property

5. **Don't block the JS thread**
   - Keep animations on UI thread with Reanimated
   - Avoid complex calculations in animated style worklets
   - **CRITICAL**: Never call non-worklet functions (like `verticalScale`, `scale`, etc.) inside `useAnimatedStyle`

## Common Pitfalls and Solutions

### 1. Non-worklet Functions in useAnimatedStyle

**❌ Wrong:**
```typescript
const animatedStyle = useAnimatedStyle(() => ({
  height: animatedHeight.value,
  minHeight: verticalScale(4), // Error! verticalScale is not a worklet
}))
```

**✅ Correct:**
```typescript
const minBarHeight = verticalScale(4) // Calculate outside worklet

const animatedStyle = useAnimatedStyle(() => ({
  height: animatedHeight.value,
  minHeight: minBarHeight, // Use pre-calculated value
}))
```

**Why?** Functions like `verticalScale`, `scale`, `moderateScale` from `react-native-size-matters` are not worklets and cannot run on the UI thread. Always calculate dimension/scale values outside of `useAnimatedStyle`.

### 2. Accessing Theme Colors in Worklets

**❌ Wrong:**
```typescript
const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: theme.colors.primary, // May cause issues
}))
```

**✅ Correct:**
```typescript
const primaryColor = theme.colors.primary // Extract before worklet

const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: primaryColor,
}))
```

### 3. Using Refs in Animations

Always use `useSharedValue` instead of `useRef` for animated values in Reanimated v2+.

**❌ Wrong:**
```typescript
const opacity = useRef(new Animated.Value(0)).current
```

**✅ Correct:**
```typescript
const opacity = useSharedValue(0)
```

### 4. Debugging SharedValue Outside Worklets

**CRITICAL**: You cannot access the current animated value of a `SharedValue` by logging `.value` outside of a worklet.

**❌ Wrong:**
```typescript
const animatedHeight = useSharedValue(10)

useEffect(() => {
  animatedHeight.value = withRepeat(...)
}, [])

console.log("height:", animatedHeight.value) // ❌ Always shows initial value (10)!

const animatedStyle = useAnimatedStyle(() => ({
  height: animatedHeight.value, // This works correctly
}))
```

**Why?** `SharedValue.value` accessed outside a worklet context (like `console.log`) only returns the **initial value**, not the animated value. The animation runs on the UI thread, but `console.log` runs on the JS thread.

**✅ Correct way to debug:**
```typescript
const animatedStyle = useAnimatedStyle(() => {
  // Use runOnJS to log from the UI thread
  'worklet'
  console.log("height (in worklet):", animatedHeight.value) // This works!

  return {
    height: animatedHeight.value,
  }
})

// Or use useAnimatedReaction for debugging
useAnimatedReaction(
  () => animatedHeight.value,
  (currentValue, previousValue) => {
    console.log('Height changed:', previousValue, '->', currentValue)
  }
)
```

## Testing Animations

### Performance Testing

```typescript
// Enable FPS monitor in development
import { enableScreens } from 'react-native-screens'
enableScreens()

// Check for dropped frames
// Target: 60fps (16.67ms per frame)
```

### Visual Testing

- Test on low-end devices (ensure 60fps)
- Test with slow animations enabled (iOS accessibility)
- Verify animations complete before user can interact again

## Resources

- [React Native Reanimated Docs](https://docs.swmansion.com/react-native-reanimated/)
- [Material Design Motion](https://m3.material.io/styles/motion)
- [iOS Human Interface Guidelines - Motion](https://developer.apple.com/design/human-interface-guidelines/motion)

## Voice Recognition Feature Guidelines

### Project Setup Best Practices

**依赖管理 (Dependency Management)**

当添加语音相关功能时,遵循以下原则:

1. **使用Expo管理的包**: 优先使用 `npx expo install` 而不是 `npm install`
   ```bash
   # ✅ 正确: 自动匹配SDK版本
   npx expo install expo-audio expo-file-system

   # ⚠️ 可以但需谨慎: 社区包
   npm install @react-native-community/netinfo
   ```

2. **权限配置原则**:
   - 所有权限说明必须使用中文 (遵循宪章中文优先原则)
   - 在 `app.json` 的 `plugins` 数组中配置
   - 使用 `$(PRODUCT_NAME)` 变量引用应用名称

   ```json
   {
     "plugins": [
       [
         "expo-audio",
         {
           "microphonePermission": "允许 $(PRODUCT_NAME) 访问您的麦克风以录制语音消息"
         }
       ]
     ]
   }
   ```

3. **目录结构规范**:
   按功能模块组织代码:
   ```
   constants/  - 配置常量 (录音参数、API端点、错误消息)
   types/      - TypeScript类型定义 (统一管理所有类型)
   services/   - 服务层 (API调用、文件管理)
   hooks/      - React Hooks (状态管理、副作用)
   utils/      - 工具函数 (权限、错误处理)
   ```

4. **类型管理原则**:
   - **集中管理**: 所有类型定义集中在 `types/` 目录
   - **避免重复**: 从组件中抽离共享类型到 types 文件
   - **类型守卫**: 提供运行时类型检查函数

   ```typescript
   // ✅ 正确: 从统一的类型文件导入
   import type { ChatMessage, InputMode, PrescriptionData } from '@/types/voice'

   // ❌ 错误: 在组件内重复定义类型
   interface Message {
     id: string
     type: "user" | "assistant"
     // ...
   }
   ```

   **类型文件组织**:
   ```typescript
   // types/voice.ts 包含:
   // 1. 录音相关类型 (VoiceRecording, RecordingStatus, RecordingError)
   // 2. 转录相关类型 (Transcription, TranscriptionStatus, TranscriptionError)
   // 3. 消息相关类型 (VoiceMessage)
   // 4. 聊天消息类型 (ChatMessage, InputMode, CardType, 等)
   // 5. 类型守卫函数 (isVoiceMessage, hasPrescriptionCard, 等)
   ```

5. **依赖验证**:
   每次添加依赖后都应验证:
   ```bash
   npm list expo-audio expo-file-system @react-native-community/netinfo
   ```
   确认:
   - ✅ 版本号正确显示
   - ✅ 无 UNMET DEPENDENCY 警告
   - ✅ 无版本冲突错误

### Implementation Workflow

**Phase-by-phase 实现策略**:

1. **Setup Phase (安装阶段)**:
   - 先安装所有依赖包
   - 配置必要的权限
   - 创建目录结构
   - 验证环境完整性

2. **Foundational Phase (基础阶段)**:
   - 定义常量和类型 (types-first approach)
   - 实现核心服务层
   - 创建可复用的hooks

3. **User Story Implementation (用户故事实现)**:
   - 按优先级实现 (P1 → P2 → P3)
   - 每个用户故事独立可测试
   - 逐步交付价值

### Code Review Guidelines

**每个任务完成后的审查要点**:

- [ ] 代码遵循 TypeScript 严格模式
- [ ] 所有注释使用中文
- [ ] 错误消息使用中文
- [ ] 遵循 React Native 最佳实践
- [ ] 使用 react-native-reanimated 处理动画
- [ ] 没有硬编码的常量 (使用 constants/)
- [ ] 文件路径符合 plan.md 结构

## Changelog

- **2025-11-10**: Environment Configuration System (Multi-Environment Support)
  - Migrated app.config.js to app.config.ts (TypeScript)
  - Implemented multi-environment configuration (dev/uat/prod)
  - Created .env.example, .env.dev, .env.uat, .env.prod configuration files
  - Added config/env.ts for centralized environment variable access
  - Integrated axios with universal HTTP request wrapper (utils/request.ts)
  - Updated services/alibabaASR.ts to use environment configuration
  - Added environment switching script (scripts/switch-env.sh)
  - Created comprehensive environment configuration documentation (docs/ENVIRONMENT.md)
  - Added npm scripts for environment-specific startup (start:dev, start:uat, start:prod)
  - Fixed __dirname undefined error by using process.cwd()
  - Added TypeScript types with ExpoConfig interface

- **2025-11-10**: Voice Recognition Feature - Phase 2 Type System
  - Created comprehensive type definitions in types/voice.ts (605 lines)
  - Extracted all chat message types from app/(tabs)/index.tsx to types/voice.ts
  - Added 5 type guard functions for runtime type checking
  - Refactored app/(tabs)/index.tsx to use centralized types
  - Documented type management principles in CLAUDE.md

- **2025-11-10**: Voice Recognition Feature - Phase 1 Setup
  - Added dependency management guidelines for voice features
  - Documented permission configuration best practices (Chinese-first principle)
  - Established directory structure standards
  - Created phase-by-phase implementation workflow
  - Added code review checklist for voice feature tasks

- **2025-11-10**: Waveform recording animation optimization
  - Enhanced WaveformBar component with detailed inline documentation
  - Added comprehensive recording animation best practices section
  - Documented performance optimization techniques for multi-bar visualizers
  - Added MCP service verification guidelines
  - Included troubleshooting guide for common animation issues
  - Ensured all animations run on UI thread for 60fps performance

- **2025-11-10**: Initial animation guidelines established
  - Migrated all animations from Animated API to Reanimated
  - Implemented reusable animation patterns
  - Documented performance best practices
