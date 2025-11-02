import { useSafeAreaInsets } from "react-native-safe-area-context"

/**
 * 自定义安全距离 Hook
 * 提供便捷的安全距离访问方法
 */
export const useSafeArea = () => {
  const insets = useSafeAreaInsets()

  return {
    // 原始 insets 对象
    insets,

    // 顶部安全距离（状态栏高度）
    top: insets.top,

    // 底部安全距离（Home指示器高度）
    bottom: insets.bottom,

    // 左侧安全距离
    left: insets.left,

    // 右侧安全距离
    right: insets.right,

    // 水平安全距离（左右的最大值）
    horizontal: Math.max(insets.left, insets.right),

    // 垂直安全距离（上下之和）
    vertical: insets.top + insets.bottom,

    // 常用样式对象
    styles: {
      // 顶部安全距离样式
      paddingTop: insets.top,

      // 底部安全距离样式
      paddingBottom: insets.bottom,

      // 水平安全距离样式
      paddingHorizontal: Math.max(insets.left, insets.right),
    },

    // 安全区域样式（用于容器）
    safeAreaStyle: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },

    // 内容区域样式（排除安全距离）
    contentStyle: {
      flex: 1,
      marginTop: insets.top,
      marginBottom: insets.bottom,
      marginLeft: insets.left,
      marginRight: insets.right,
    },
  }
}
