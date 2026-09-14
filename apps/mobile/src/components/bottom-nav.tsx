import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, palette } from '@/theme/tokens';

const items = [
  { label: 'Visão geral', icon: '⌂', href: '/dashboard' as const },
  { label: 'Movimentos', icon: '↕', href: '/movements' as const },
  { label: 'Gráficos', icon: '▥', href: '/charts' as const },
  { label: 'Config.', icon: '⚙', href: '/settings' as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  return <View accessibilityRole="tablist" style={styles.wrap}>
    {items.slice(0, 2).map((item) => { const active = pathname === item.href; return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} key={item.href} onPress={() => router.replace(item.href)} style={styles.item}><Text style={[styles.icon, active && styles.active]}>{item.icon}</Text><Text style={[styles.label, active && styles.active]}>{item.label}</Text></Pressable>; })}
    <Pressable accessibilityLabel="Adicionar movimentação" accessibilityRole="button" onPress={() => router.push('/transaction/new')} style={styles.add}><Text style={styles.plus}>＋</Text></Pressable>
    {items.slice(2).map((item) => { const active = pathname === item.href; return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} key={item.href} onPress={() => router.replace(item.href)} style={styles.item}><Text style={[styles.icon, active && styles.active]}>{item.icon}</Text><Text style={[styles.label, active && styles.active]}>{item.label}</Text></Pressable>; })}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 24, minHeight: 74, paddingHorizontal: 4, marginTop: 'auto' },
  item: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { color: palette.inkMuted, fontSize: 22, lineHeight: 24 }, label: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 12 }, active: { color: palette.greenVault },
  add: { width: 58, height: 58, marginHorizontal: 4, borderRadius: 18, backgroundColor: palette.greenAction, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -10 }] }, plus: { color: 'white', fontFamily: font.regular, fontSize: 31, lineHeight: 34 },
});
