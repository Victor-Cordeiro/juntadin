import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, palette } from '@/theme/tokens';

const items = [
  { label: 'Visão geral', icon: '⌂', href: '/dashboard' as const },
  { label: 'Movimentos', icon: '↕', href: '/movements' as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  return <View accessibilityRole="tablist" style={styles.wrap}>
    {items.map((item) => { const active = pathname === item.href; return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} key={item.href} onPress={() => router.replace(item.href)} style={styles.item}><Text style={[styles.icon, active && styles.active]}>{item.icon}</Text><Text style={[styles.label, active && styles.active]}>{item.label}</Text></Pressable>; })}
    <Pressable accessibilityLabel="Adicionar movimentação" accessibilityRole="button" onPress={() => router.push('/transaction/new')} style={styles.add}><Text style={styles.plus}>＋</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 24, minHeight: 72, paddingHorizontal: 12, paddingRight: 88, marginTop: 'auto' },
  item: { minWidth: 94, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { color: palette.inkMuted, fontSize: 22, lineHeight: 24 }, label: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 12 }, active: { color: palette.greenVault },
  add: { position: 'absolute', right: 14, width: 54, height: 54, borderRadius: 27, backgroundColor: palette.greenAction, alignItems: 'center', justifyContent: 'center' }, plus: { color: 'white', fontFamily: font.regular, fontSize: 31, lineHeight: 34 },
});
