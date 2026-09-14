import { formatBRL, parseBRL } from '@juntadin/domain';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomNav } from '@/components/bottom-nav';
import { CategoryIcon } from '@/components/category-icon';
import { Button, Screen } from '@/components/juntadin-ui';
import { usePrototype } from '@/state/prototype-context';
import { useHouseholdSettings } from '@/state/use-household-settings';
import { font, palette } from '@/theme/tokens';

type RowProps = { icon: string; title: string; body?: string; value?: string; onPress?: () => void };
function SettingsRow({ icon, title, body, value, onPress }: RowProps) {
  const content = <><View style={styles.iconBox}><CategoryIcon name={icon} color={palette.greenVault} size={23} /></View><View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text>{body ? <Text style={styles.rowBody}>{body}</Text> : null}</View>{value ? <Text style={styles.rowValue}>{value}</Text> : null}{onPress ? <Text style={styles.chevron}>›</Text> : null}</>;
  return onPress ? <Pressable onPress={onPress} style={styles.row}>{content}</Pressable> : <View style={styles.row}>{content}</View>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { hydrated, session, onboarding, signOut } = usePrototype();
  const { settings, update } = useHouseholdSettings(session?.id);
  const [editingLimit, setEditingLimit] = useState(false);
  const [limit, setLimit] = useState('');
  useEffect(() => { if (hydrated && !session) router.replace('/auth/login'); }, [hydrated, router, session]);
  if (!hydrated || !session || !onboarding.completed) return null;
  function saveLimit() { const cents = parseBRL(limit); update({ monthlyLimitCents: cents === null ? null : cents.toString() }); setEditingLimit(false); }

  return <Screen contentStyle={styles.screen} footer={<BottomNav />}>
    <Text accessibilityRole="header" style={styles.title}>Configurações</Text>
    <Text style={styles.sectionLabel}>CONTA E CASAL</Text>
    <View style={styles.group}>
      <View style={styles.profile}><View style={styles.avatar}><Text style={styles.initial}>{session.name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.profileText}><Text style={styles.name}>{session.name}</Text><Text style={styles.email}>{session.email}</Text></View></View>
      <SettingsRow icon="group_add" title={settings.enabled ? 'Gerenciar espaço de casal' : 'Convidar seu parceiro'} body={settings.enabled ? (settings.familyName || 'Espaço de casal ativado') : 'Crie um convite ou continue usando sozinho'} onPress={() => router.push('/settings/partner')} />
    </View>
    <Text style={styles.sectionLabel}>LIMITES E CATEGORIAS</Text>
    <View style={styles.group}>
      {editingLimit ? <View style={styles.limitEditor}><Text style={styles.rowTitle}>Limite de gastos mensal</Text><View style={styles.limitInput}><Text style={styles.currency}>R$</Text><TextInput autoFocus accessibilityLabel="Limite de gastos mensal" value={limit} onChangeText={setLimit} keyboardType="decimal-pad" placeholder="3.000,00" placeholderTextColor={palette.inkMuted} style={styles.input} /></View><View style={styles.limitActions}><Pressable onPress={() => setEditingLimit(false)}><Text style={styles.cancel}>Cancelar</Text></Pressable><Pressable onPress={saveLimit}><Text style={styles.save}>Salvar</Text></Pressable></View></View> :
        <SettingsRow icon="tune" title="Limite de gastos mensal" value={settings.monthlyLimitCents ? formatBRL(BigInt(settings.monthlyLimitCents)) : 'Definir'} onPress={() => { setLimit(settings.monthlyLimitCents ? (Number(settings.monthlyLimitCents) / 100).toFixed(2).replace('.', ',') : ''); setEditingLimit(true); }} />}
      <SettingsRow icon="star" title="Limites por categoria" body="Em breve" />
      <SettingsRow icon="category" title="Editar categorias" onPress={() => router.push('/settings/categories')} />
      <SettingsRow icon="credit_card" title="Métodos de pagamento" onPress={() => router.push('/settings/payment-methods')} />
      <SettingsRow icon="repeat" title="Transações recorrentes" body="Visualização em breve" />
      <SettingsRow icon="schedule" title="Ciclo financeiro" value={`Dia ${onboarding.cycle?.startDay ?? 1}`} />
    </View>
    <Text style={styles.sectionLabel}>DADOS E CONTA</Text>
    <View style={styles.group}><SettingsRow icon="download" title="Exportar movimentos" body="Em breve" /></View>
    <Button label="Sair da conta" variant="secondary" onPress={async () => { await signOut(); router.replace('/'); }} />
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 14, paddingTop: 20 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 36, marginBottom: 8 },
  sectionLabel: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 12, letterSpacing: 1, marginTop: 8 },
  group: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  profile: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 17, backgroundColor: palette.mint },
  avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: palette.greenAction, alignItems: 'center', justifyContent: 'center' },
  initial: { color: 'white', fontFamily: font.display, fontSize: 22 },
  profileText: { flex: 1 },
  name: { color: palette.ink, fontFamily: font.semibold, fontSize: 17 },
  email: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: palette.border },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.mint },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { color: palette.ink, fontFamily: font.semibold, fontSize: 15 },
  rowBody: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12, lineHeight: 17 },
  rowValue: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 14 },
  chevron: { color: palette.inkMuted, fontSize: 25 },
  limitEditor: { gap: 12, padding: 18 },
  limitInput: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderRadius: 13, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 14 },
  currency: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 16 },
  input: { flex: 1, color: palette.ink, fontFamily: font.regular, fontSize: 18, paddingHorizontal: 10 },
  limitActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 22 },
  cancel: { color: palette.inkMuted, fontFamily: font.semibold, fontSize: 14 },
  save: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 14 },
});
