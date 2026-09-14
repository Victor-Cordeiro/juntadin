import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

type CategoryIconProps = {
  name: string;
  color: string;
  size?: number;
};

/** Shared semantic icon renderer for preset and user-created categories. */
export function CategoryIcon({ name, color, size = 24 }: CategoryIconProps) {
  return (
    <View accessible={false} style={styles.container}>
      <SymbolView name={{ android: name as AndroidSymbol, web: name as AndroidSymbol }} size={size} tintColor={color} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { alignItems: 'center', justifyContent: 'center' } });
