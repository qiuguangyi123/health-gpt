// src/utils/scale.js

import * as Device from "expo-device"
import { Dimensions } from "react-native"
import { RFValue } from "react-native-responsive-fontsize"
import {
  moderateScale as ms,
  scale as s,
  verticalScale as vs,
} from "react-native-size-matters"

// ================================
// 🧭 基准设计尺寸（根据你的设计稿定）
// ================================
const BASE_WIDTH = 375 // iPhone 11 设计稿宽度
const BASE_HEIGHT = 812 // iPhone 11 设计稿高度

// ================================
// 📱 屏幕尺寸信息
// ================================
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// 判断是否为平板
const isTablet = Device.deviceType === Device.DeviceType.TABLET

// ================================
// 🧮 封装统一方法
// ================================

/**
 * 水平方向缩放
 * @param {number} size 设计稿中的尺寸
 * @returns {number}
 */
export const scale = (size: number) => s(size)

/**
 * 垂直方向缩放
 * @param {number} size 设计稿中的尺寸
 * @returns {number}
 */
export const verticalScale = (size: number) => vs(size)

/**
 * 适中缩放（常用于边距、圆角、字体等）
 * @param {number} size
 * @param {number} factor
 * @returns {number}
 */
export const moderateScale = (size: number, factor = 0.5) => ms(size, factor)

/**
 * 字体缩放
 * @param {number} fontSize
 * @returns {number}
 */
export const font = (fontSize: number) => {
  // 平板字体略小一点防止太大
  const adjusted = isTablet ? fontSize * 0.9 : fontSize
  return RFValue(adjusted, BASE_HEIGHT)
}

// ================================
// 🧰 导出常量和工具
// ================================
export { BASE_HEIGHT, BASE_WIDTH, isTablet, SCREEN_HEIGHT, SCREEN_WIDTH }
