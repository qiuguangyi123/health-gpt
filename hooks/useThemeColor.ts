/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from "@/hooks/useColorScheme"
import { MD3Theme, useTheme } from "react-native-paper"

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof MD3Theme["colors"]
) {
  const theme = useColorScheme() ?? "light"
  const colorFromProps = props[theme]
  const themeToken = useTheme()

  if (colorFromProps) {
    return colorFromProps
  } else {
    return themeToken.colors[colorName]
  }
}
