export type ThemeName = "dark" | "light";

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    border: string;
    textSecondary: string;
    card: string;
    cardBorder: string;
    warning: string;
    warningLight: string;
    danger: string;
    dangerLight: string;
    success: string;
    successLight: string;
  };
}

export const themes: Record<ThemeName, ThemeConfig> = {
  dark: {
    name: "dark",
    label: "Dark",
    colors: {
      background: "#1a1a1a",
      foreground: "#f0f0f0",
      primary: "#4cab7a",
      secondary: "#2d2d2d",
      border: "#3d3d3d",
      textSecondary: "#b0b0b0",
      card: "#242424",
      cardBorder: "#3d3d3d",
      warning: "#ffcc00",
      warningLight: "rgba(255, 204, 0, 0.15)",
      danger: "#ff4444",
      dangerLight: "rgba(255, 68, 68, 0.15)",
      success: "#44ff44",
      successLight: "rgba(68, 255, 68, 0.15)",
    },
  },
  light: {
    name: "light",
    label: "Light",
    colors: {
      background: "#f8f8f8",
      foreground: "#1a1a1a",
      primary: "#2d7a4f",
      secondary: "#efefef",
      border: "#d8d8d8",
      textSecondary: "#666666",
      card: "#ffffff",
      cardBorder: "#e0e0e0",
      warning: "#d4a500",
      warningLight: "rgba(212, 165, 0, 0.1)",
      danger: "#cc3333",
      dangerLight: "rgba(204, 51, 51, 0.1)",
      success: "#339933",
      successLight: "rgba(51, 153, 51, 0.1)",
    },
  },
};

export function getTheme(themeName: ThemeName): ThemeConfig {
  return themes[themeName] || themes.dark;
}

export function getCSSVariables(theme: ThemeConfig): string {
  return `
    --background: ${theme.colors.background};
    --foreground: ${theme.colors.foreground};
    --primary: ${theme.colors.primary};
    --secondary: ${theme.colors.secondary};
    --border: ${theme.colors.border};
    --text-secondary: ${theme.colors.textSecondary};
    --card: ${theme.colors.card};
    --card-border: ${theme.colors.cardBorder};
    --warning: ${theme.colors.warning};
    --warning-light: ${theme.colors.warningLight};
    --danger: ${theme.colors.danger};
    --danger-light: ${theme.colors.dangerLight};
    --success: ${theme.colors.success};
    --success-light: ${theme.colors.successLight};
  `;
}
