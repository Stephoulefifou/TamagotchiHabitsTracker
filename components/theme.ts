//Imports
import { DarkTheme as NavigationDarkTheme } from "@react-navigation/native";
import { MD3DarkTheme, adaptNavigationTheme } from "react-native-paper";
import { colors } from "./colors";

// PAPER THEME
// Material 3 dark theme with our colors. Paper components read it through useTheme().

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    onPrimary: colors.text,
    primaryContainer: "#5e1247",
    onPrimaryContainer: "#ffd8ec",
    secondary: colors.secondary,
    onSecondary: colors.text,
    secondaryContainer: "#4a1e33", // selected chips and segmented buttons
    onSecondaryContainer: "#ffd9e0",
    background: colors.background,
    onBackground: colors.text,
    surface: colors.card,
    onSurface: colors.text,
    onSurfaceVariant: colors.textMuted,
    error: colors.danger,
  },
};

// NAVIGATION THEME
// Same colors for React Navigation (screen backgrounds, headers...).

// adaptNavigationTheme only maps colors, so the fonts are taken from React Navigation.
export const navigationTheme = {
  ...adaptNavigationTheme({
    reactNavigationDark: NavigationDarkTheme,
    materialDark: theme,
  }).DarkTheme,
  fonts: NavigationDarkTheme.fonts,
};
