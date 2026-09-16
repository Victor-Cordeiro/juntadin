import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/juntadin-ui';
import { CategoryIcon } from '@/components/category-icon';
import { presetPaymentMethods } from '@/data/payment-methods';
import { usePrototype } from '@/state/prototype-context';
import { useGoBack } from '@/hooks/use-back';
import { font, palette } from '@/theme/tokens';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const goBack = useGoBack('/settings');
  const { customPaymentMethods } = usePrototype();
  const methods = [...presetPaymentMethods, ...customPaymentMethods];
  return <Screen>
    <View style={styles.top}><Pressable accessibilityLabel="Voltar" onPress={goBack}><Text style={styles.back}>‹</Text></Pressable><Text accessibilityRole="header" style={styles.title}>Editar métodos</Text><Pressable accessibilityLabel="Adicionar método" onPress={() => router.push('/settings/payment-methods/new')}><Text style={styles.plus}>＋</Text></Pressable></View>
    <View style={styles.list}>{methods.map((method) => <View key={method.id} style={styles.item}><View style={styles.iconBox}><CategoryIcon name={method.icon} color={palette.greenVault} size={26} /></View><Text style={styles.itemName}>{method.name}</Text></View>)}</View>
  </Screen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  back: { color: palette.greenVault, fontSize: 38, lineHeight: 40, width: 40 },
  title: { flex: 1, color: palette.ink, fontFamily: font.display, fontSize: 25, textAlign: 'center' },
  plus: { color: palette.greenAction, fontSize: 34, lineHeight: 38, width: 40, textAlign: 'right' },
  list: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, marginTop: 12 },
  item: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: palette.border },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.mint },
  itemName: { flex: 1, color: palette.ink, fontFamily: font.semibold, fontSize: 17 },
});
