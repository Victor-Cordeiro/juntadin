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
  const { customPaymentMethods, paymentMethodOrder, reorderPaymentMethods } = usePrototype();
  const allMethods = [...presetPaymentMethods, ...customPaymentMethods]; const methods = [...allMethods].sort((a, b) => (paymentMethodOrder.indexOf(a.id) < 0 ? 9999 : paymentMethodOrder.indexOf(a.id)) - (paymentMethodOrder.indexOf(b.id) < 0 ? 9999 : paymentMethodOrder.indexOf(b.id)));
  function move(from: number, to: number) { if (to < 0 || to >= methods.length) return; const ids = methods.map((item) => item.id); const [item] = ids.splice(from, 1); ids.splice(to, 0, item); reorderPaymentMethods(ids); }
  return <Screen>
    <View style={styles.top}><Pressable accessibilityLabel="Voltar" onPress={goBack}><Text style={styles.back}>‹</Text></Pressable><Text accessibilityRole="header" style={styles.title}>Editar métodos</Text><Pressable accessibilityLabel="Adicionar método" onPress={() => router.push('/settings/payment-methods/new')}><Text style={styles.plus}>＋</Text></Pressable></View>
    <Text style={styles.hint}>Use as setas para definir a prioridade</Text><View style={styles.list}>{methods.map((method, index) => <OrderedMethod key={method.id} method={method} index={index} count={methods.length} onMove={move} />)}</View>
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
  hint: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13, marginTop: 12 },
  controls: { flexDirection: 'row', gap: 6 }, moveButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' }, moveButtonDisabled: { opacity: .3 }, moveText: { color: palette.greenVault, fontFamily: font.semibold, fontSize: 20 },
});

function OrderedMethod({ method, index, count, onMove }: { method: (typeof presetPaymentMethods)[number]; index: number; count: number; onMove(from: number, to: number): void }) { return <View style={styles.item}><View style={styles.iconBox}><CategoryIcon name={method.icon} color={palette.greenVault} size={26} /></View><Text style={styles.itemName}>{method.name}</Text><View style={styles.controls}><Pressable accessibilityLabel={`Mover ${method.name} para cima`} disabled={index === 0} onPress={() => onMove(index, index - 1)} style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}><Text style={styles.moveText}>↑</Text></Pressable><Pressable accessibilityLabel={`Mover ${method.name} para baixo`} disabled={index === count - 1} onPress={() => onMove(index, index + 1)} style={[styles.moveButton, index === count - 1 && styles.moveButtonDisabled]}><Text style={styles.moveText}>↓</Text></Pressable></View></View>; }
