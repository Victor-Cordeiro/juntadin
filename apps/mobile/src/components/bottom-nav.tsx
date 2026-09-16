import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { font, palette } from '@/theme/tokens';

const items = [
  { label: 'Visão geral', icon: 'home', href: '/dashboard' as const },
  { label: 'Movimentos', icon: 'swap_vert', href: '/movements' as const },
  { label: 'Gráficos', icon: 'bar_chart_4_bars', href: '/charts' as const },
  { label: 'Config.', icon: 'settings', href: '/settings' as const },
];

function NavItem({ item, active, onPress }: { item: (typeof items)[number]; active: boolean; onPress(): void }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={styles.item}>
    <CategoryIcon name={item.icon} color={active ? palette.greenVault : palette.inkMuted} size={25} />
    <Text numberOfLines={1} style={[styles.label, active && styles.active]}>{item.label}</Text>
  </Pressable>;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  return <View accessibilityRole="tablist" style={styles.wrap}>
    {items.slice(0, 2).map((item) => <NavItem key={item.href} item={item} active={pathname === item.href} onPress={() => router.replace(item.href)} />)}
    <Pressable accessibilityLabel="Adicionar movimentação" accessibilityRole="button" onPress={() => router.push('/transaction/new')} style={styles.add}><Text style={styles.plus}>＋</Text></Pressable>
    {items.slice(2).map((item) => <NavItem key={item.href} item={item} active={pathname === item.href} onPress={() => router.replace(item.href)} />)}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 24, minHeight: 74, paddingHorizontal: 4, marginTop: 'auto' },
  item: { flex: 1, minWidth: 0, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 2 },
  label: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 11, textAlign: 'center' }, active: { color: palette.greenVault, fontFamily: font.semibold },
  add: { width: 58, height: 58, marginHorizontal: 4, borderRadius: 18, backgroundColor: palette.greenAction, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -10 }] }, plus: { color: 'white', fontFamily: font.regular, fontSize: 31, lineHeight: 34 },
});
