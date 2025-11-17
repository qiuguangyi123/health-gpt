/**
 * Expo 应用配置
 * Expo App Configuration
 *
 * 支持多环境配置（dev / uat / prod）
 * Supports multiple environments (dev / uat / prod)
 *
 * 使用方式:
 * - 开发环境: APP_ENV=dev npx expo start
 * - UAT环境: APP_ENV=uat npx expo start
 * - 生产环境: APP_ENV=prod npx expo start
 *
 * 如果未指定 APP_ENV，默认使用 dev 环境
 */

import type { ExpoConfig } from "expo/config"

type EnvMode = "dev" | "uat" | "prod"
// ============================================
// Expo 配置 (Expo Configuration)
// ============================================

const config: ExpoConfig = {
  name: "react-vative",
  slug: "react-vative",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "reactvative",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  // iOS 配置
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.anonymous.react-vative",
  },

  // Android 配置
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
  },

  // Web 配置
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  // 插件配置
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission:
          "允许 $(PRODUCT_NAME) 访问您的麦克风以录制语音消息",
      },
    ],
  ],

  // 实验性功能
  experiments: {
    typedRoutes: true,
  },

  // 额外配置 - 暴露环境变量给应用
  // Extra configuration - Expose environment variables to the app
  extra: {
    // // ASR 配置
    // alibaba: {
    //   asrToken: process.env.EXPO_PUBLIC_ALIBABA_ASR_TOKEN,
    //   asrApiUrl: process.env.EXPO_PUBLIC_ALIBABA_ASR_API_URL,
    // },
    // // API 配置
    // api: {
    //   baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    //   timeout: process.env.EXPO_PUBLIC_API_TIMEOUT,
    // },
    // // 功能开关
    // features: {
    //   enableLogging: process.env.EXPO_PUBLIC_ENABLE_LOGGING === "true",
    //   enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === "true",
    // },
  },
}

export default config
