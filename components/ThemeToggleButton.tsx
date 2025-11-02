import { useTheme } from "@/contexts/ThemeContext"
import React from "react"
import { StyleSheet, TouchableOpacity } from "react-native"
import { useTheme as usePaperTheme } from "react-native-paper"
import { IconSymbol } from "./ui/IconSymbol"

export function ThemeToggleButton() {
  const { themeMode, toggleTheme } = useTheme()
  const paperTheme = usePaperTheme()

  const getIconName = () => {
    switch (themeMode) {
      case "light":
        return "sun.max.fill"
      case "dark":
        return "moon.fill"
      case "auto":
        return "gear"
      default:
        return "gear"
    }
  }

  const getIconColor = () => {
    return paperTheme.colors.onSurface
  }

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: paperTheme.colors.surface }]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <IconSymbol
        name={getIconName() as any}
        size={24}
        color={getIconColor()}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
})
