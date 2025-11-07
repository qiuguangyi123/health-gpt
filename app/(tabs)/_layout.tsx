import { Stack } from "expo-router"
import React from "react"

import { useTheme } from "react-native-paper"

export default function TabLayout() {
  const theme = useTheme()

  return (
    <Stack
    // screenOptions={{
    //   contentStyle: { backgroundColor: themeToken.colors.background }, // 设置所有页面的背景色
    //   headerStyle: { backgroundColor: themeToken.colors.background }, // 设置头部背景色
    // }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
    // <Tabs
    //   screenOptions={{
    //     tabBarActiveTintColor: theme.colors.primary,
    //     headerShown: false,
    //     tabBarButton: HapticTab,
    //     tabBarStyle: {
    //       backgroundColor: theme.colors.surface,
    //       borderTopWidth: 0,
    //       elevation: 8,
    //       shadowColor: "#000",
    //       shadowOffset: { width: 0, height: -2 },
    //       shadowOpacity: 0.1,
    //       shadowRadius: 4,
    //     },
    //     // 添加页面切换动画
    //     animation: Platform.OS === "ios" ? "shift" : "fade",
    //   }}
    // >
    //   <Tabs.Screen
    //     name="index"
    //     options={{
    //       title: "Home",
    //       tabBarIcon: ({ color, focused }) => (
    //         <AnimatedTabIcon
    //           size={28}
    //           name="house.fill"
    //           color={color}
    //           focused={focused}
    //           animationType="bounce"
    //         />
    //       ),
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="explore"
    //     options={{
    //       title: "Explore",
    //       tabBarIcon: ({ color, focused }) => {
    //         console.log(
    //           `🔄 Explore tabBarIcon 被调用: focused=${focused}, color=${color}`
    //         )
    //         return (
    //           <AnimatedTabIcon
    //             size={28}
    //             name="paperplane.fill"
    //             color={color}
    //             focused={focused}
    //             animationType="rotate"
    //           />
    //         )
    //       },
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="todo"
    //     options={{
    //       title: "Todo",
    //       tabBarIcon: ({ color, focused }) => (
    //         <AnimatedTabIcon
    //           size={28}
    //           name="star.fill"
    //           color={color}
    //           focused={focused}
    //           animationType="pulse"
    //         />
    //       ),
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="community"
    //     options={{
    //       title: "朋友圈",
    //       tabBarIcon: ({ color, focused }) => (
    //         <AnimatedTabIcon
    //           size={28}
    //           name="heart.fill"
    //           color={color}
    //           focused={focused}
    //           animationType="bounce"
    //         />
    //       ),
    //     }}
    //   />
    // </Tabs>
  )
}
