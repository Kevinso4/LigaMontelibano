import { useColorScheme } from 'react-native'; // ✅ CORRECTO:

/**
 * Hook para obtener un color basado en el tema actual (claro u oscuro)
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
): string {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  // Colores por defecto
  const defaultColors = {
    light: {
      text: '#11181C',
      background: '#fff',
      tint: '#007AFF',
      icon: '#687076',
      tabIconDefault: '#687076',
      tabIconSelected: '#007AFF',
    },
    dark: {
      text: '#ECEDEE',
      background: '#151718',
      tint: '#0a7ea4',
      icon: '#9BA1A6',
      tabIconDefault: '#9BA1A6',
      tabIconSelected: '#0a7ea4',
    },
  };

  return defaultColors[theme][colorName as keyof typeof defaultColors.light] ?? '#000';
}
