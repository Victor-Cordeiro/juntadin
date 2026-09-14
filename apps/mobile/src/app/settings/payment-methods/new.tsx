import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Field, Screen } from '@/components/juntadin-ui';
import { CategoryIcon } from '@/components/category-icon';
import { paymentMethodIcons } from '@/data/payment-methods';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';

export default function NewPaymentMethodScreen() {
  const router = useRouter();
  const { addCustomPaymentMethod } = usePrototype();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(paymentMethodIcons[0]);
  function save() { if (!name.trim()) return; addCustomPaymentMethod({ id: `custom-method-${Date.now()}`, name: name.trim(), icon }); router.replace('/settings/payment-methods'); }
  return <Screen>
    <View style={styles.top}><Pressable accessibilityLabel="Voltar" onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text accessibilityRole="header" style={styles.title}>Novo método</Text><Pressable accessibilityLabel="Salvar método" onPress={save}><Text style={styles.save}>Salvar</Text></Pressable></View>
    <View style={styles.preview}><View style={styles.previewIcon}><CategoryIcon name={icon} color={palette.greenVault} size={42} /></View><Text style={styles.previewName}>{name || 'Nome'}</Text></View>
    <Field label="Nome do método" value={name} onChangeText={setName} placeholder="Ex.: Vale-refeição" />
    <Text style={styles.sectionLabel}>ÍCONE</Text>
    <View style={styles.icons}>{paymentMethodIcons.map((item, index) => <Pressable accessibilityLabel={`Ícone ${item}`} key={`${item}-${index}`} onPress={() => setIcon(item)} style={[styles.iconButton, item === icon && styles.iconButtonSelected]}><CategoryIcon name={item} color={item === icon ? palette.greenVault : palette.ink} size={25} /></Pressable>)}</View>
    <Button label="Salvar método" onPress={save} />
  </Screen>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  back: { color: palette.greenVault, fontSize: 38, width: 38 },
  title: { flex: 1, color: palette.ink, fontFamily: font.display, fontSize: 24, textAlign: 'center' },
  save: { color: palette.greenAction, fontFamily: font.semibold, width: 48, textAlign: 'right' },
  preview: { alignItems: 'center', gap: 6, paddingVertical: 18 },
  previewIcon: { width: 78, height: 78, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.mint },
  previewName: { color: palette.ink, fontFamily: font.display, fontSize: 30 },
  sectionLabel: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 12, letterSpacing: 1, marginTop: 8, marginBottom: 10 },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  iconButton: { width: 52, height: 52, borderRadius: 15, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.paper },
  iconButtonSelected: { backgroundColor: palette.mint, borderColor: palette.greenVault },
});
