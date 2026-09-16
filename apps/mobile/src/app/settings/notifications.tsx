import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/category-icon';
import { Screen } from '@/components/juntadin-ui';
import { useHouseholdSettings, type NotificationSettings } from '@/state/use-household-settings';
import { useGoBack } from '@/hooks/use-back';
import { font, palette } from '@/theme/tokens';

type Option = { key: keyof NotificationSettings; icon: string; title: string; body: string; partnerOnly?: boolean };

const options: Option[] = [
  { key: 'limitAlerts', icon: 'notifications_active', title: 'Alertas de limite', body: 'Avisa quando você chega perto do limite mensal ou de uma categoria.' },
  { key: 'recurringDue', icon: 'repeat', title: 'Recorrentes do dia', body: 'Lembra quando uma transação recorrente vence.' },
  { key: 'weeklySummary', icon: 'insert_chart', title: 'Resumo semanal', body: 'Um retrato do que entrou e saiu na semana.' },
  { key: 'partnerActivity', icon: 'group', title: 'Atividade do parceiro', body: 'Avisa quando seu parceiro lança um movimento.', partnerOnly: true },
];

export default function NotificationsScreen() {
  const goBack = useGoBack('/settings');
  const { settings, update } = useHouseholdSettings();

  const visible = options.filter((option) => !option.partnerOnly || settings.enabled);

  return <Screen contentStyle={styles.screen}>
    <View style={styles.top}>
      <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={goBack}><Text style={styles.back}>‹</Text></Pressable>
      <Text accessibilityRole="header" style={styles.title}>Notificações</Text>
      <View style={styles.spacer} />
    </View>
    <Text style={styles.intro}>Escolha o que o Juntadin pode te avisar.</Text>

    <View style={styles.list}>
      {visible.map((option, index) => <View key={option.key} style={[styles.row, index > 0 && styles.divider]}>
        <View style={styles.icon}><CategoryIcon name={option.icon} color={palette.greenVault} size={22} /></View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{option.title}</Text>
          <Text style={styles.rowBody}>{option.body}</Text>
        </View>
        <Switch
          value={settings.notifications[option.key]}
          onValueChange={(value) => update({ notifications: { ...settings.notifications, [option.key]: value } })}
          trackColor={{ false: palette.border, true: palette.greenAction }}
          thumbColor={settings.notifications[option.key] ? palette.greenVault : palette.surface}
        />
      </View>)}
    </View>

    <Text style={styles.hint}>Suas escolhas ficam salvas. O envio das notificações no celular entra quando o app for para build nativo.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  back: { color: palette.greenVault, fontSize: 38, width: 38, lineHeight: 40 },
  title: { flex: 1, color: palette.ink, fontFamily: font.display, fontSize: 24, textAlign: 'center' },
  spacer: { width: 38 },
  intro: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, lineHeight: 21 },
  list: { borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 84, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: palette.border },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { color: palette.ink, fontFamily: font.semibold, fontSize: 15 },
  rowBody: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12, lineHeight: 17 },
  hint: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
});
