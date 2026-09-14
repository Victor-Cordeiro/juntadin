import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Field, Screen } from '@/components/juntadin-ui';
import { categoryColors, categoryIcons, type CategoryKind } from '@/data/categories';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';

export default function NewCategoryScreen() {
  const router = useRouter(); const params = useLocalSearchParams<{ kind?: CategoryKind }>(); const kind: CategoryKind = params.kind === 'income' ? 'income' : 'expense'; const { addCustomCategory } = usePrototype();
  const [name, setName] = useState(''); const [color, setColor] = useState(categoryColors[0]); const [icon, setIcon] = useState(categoryIcons[0]);
  function save() { if (!name.trim()) return; addCustomCategory(kind, { id: `custom-${Date.now()}`, name: name.trim(), color, icon }); router.replace('/settings/categories'); }
  return <Screen>
    <View style={styles.top}><Pressable accessibilityLabel="Voltar" onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text accessibilityRole="header" style={styles.title}>Nova categoria</Text><Pressable accessibilityLabel="Salvar categoria" onPress={save}><Text style={styles.save}>Salvar</Text></Pressable></View>
    <View style={styles.preview}><View style={[styles.previewIcon, { backgroundColor: `${color}22` }]}><Text style={[styles.previewGlyph, { color }]}>{icon}</Text></View><Text style={styles.previewName}>{name || 'Nome'}</Text><Text style={styles.counter}>{name.length}/30</Text></View>
    <Field label="Nome da categoria" value={name} onChangeText={setName} placeholder={kind === 'expense' ? 'Ex.: Pets' : 'Ex.: Comissão'} />
    <Text style={styles.sectionLabel}>COR</Text><View style={styles.colors}>{categoryColors.map((item) => <Pressable accessibilityLabel={`Cor ${item}`} key={item} onPress={() => setColor(item)} style={[styles.color, { backgroundColor: `${item}22` }, item === color && styles.colorSelected]}><View style={[styles.colorDot, { backgroundColor: item }]} />{item === color && <Text style={[styles.check, { color: item }]}>✓</Text>}</Pressable>)}</View>
    <Text style={styles.sectionLabel}>ÍCONE</Text><View style={styles.icons}>{categoryIcons.map((item, index) => <Pressable accessibilityLabel={`Ícone ${item}`} key={`${item}-${index}`} onPress={() => setIcon(item)} style={[styles.iconButton, item === icon && { backgroundColor: `${color}22`, borderColor: color }]}><Text style={[styles.iconGlyph, { color: item === icon ? color : palette.ink }]}>{item}</Text></Pressable>)}</View>
    <Button label="Salvar categoria" onPress={save} />
  </Screen>;
}

const styles = StyleSheet.create({ top: { flexDirection: 'row', alignItems: 'center', minHeight: 52 }, back: { color: palette.greenVault, fontSize: 38, width: 38 }, title: { flex: 1, color: palette.ink, fontFamily: font.display, fontSize: 24, textAlign: 'center' }, save: { color: palette.greenAction, fontFamily: font.semibold, width: 48, textAlign: 'right' }, preview: { alignItems: 'center', gap: 6, paddingVertical: 18 }, previewIcon: { width: 78, height: 78, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, previewGlyph: { fontSize: 39 }, previewName: { color: palette.ink, fontFamily: font.display, fontSize: 30 }, counter: { color: palette.inkMuted, fontFamily: font.regular }, sectionLabel: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 12, letterSpacing: 1, marginTop: 8, marginBottom: 10 }, colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, color: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' }, colorSelected: { borderColor: palette.ink }, colorDot: { width: 27, height: 27, borderRadius: 14 }, check: { position: 'absolute', fontSize: 17, fontFamily: font.semibold }, icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, iconButton: { width: 52, height: 52, borderRadius: 15, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.paper }, iconGlyph: { fontSize: 24 } });
