import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { font, palette } from '@/theme/tokens';

/** Shows the stored photo when there is one, and falls back to the initial. */
export function Avatar({ uri, initial, size = 44, radius, background = palette.greenVault, color = 'white', icon, style }: {
  uri?: string | null;
  initial?: string;
  size?: number;
  radius?: number;
  background?: string;
  color?: string;
  icon?: string;
  /** Only layout properties, since this is applied to an Image as well as a View. */
  style?: StyleProp<Pick<ViewStyle, 'margin' | 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight' | 'alignSelf'>>;
}) {
  const borderRadius = radius ?? size / 2;
  const box = { width: size, height: size, borderRadius };

  if (uri) {
    return <Image source={{ uri }} style={[box, style]} contentFit="cover" transition={120} accessibilityIgnoresInvertColors />;
  }

  return (
    <View style={[styles.fallback, box, { backgroundColor: background }, style]}>
      {icon
        ? <CategoryIcon name={icon} color={color} size={Math.round(size * 0.5)} />
        : <Text style={[styles.initial, { color, fontSize: Math.round(size * 0.42) }]}>{(initial || '?').slice(0, 1).toUpperCase()}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { fontFamily: font.display },
});
