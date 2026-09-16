import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Field, Screen } from '@/components/juntadin-ui';
import { CategoryIcon } from '@/components/category-icon';
import { useHouseholdSettings } from '@/state/use-household-settings';
import { useGoBack } from '@/hooks/use-back';
import { font, palette } from '@/theme/tokens';

export default function PartnerSettingsScreen() {
  const goBack = useGoBack('/settings');
  const { settings, update, generateInvite } = useHouseholdSettings();
  const [copied, setCopied] = useState(false);
  const inviteLink = useMemo(() => settings.inviteCode ? `https://app.juntadin.com/convite/${settings.inviteCode}` : '', [settings.inviteCode]);

  async function copyLink() { await Clipboard.setStringAsync(inviteLink); setCopied(true); }
  async function shareLink() { await Share.share({ title: 'Convite para o Juntadin', message: `Vem organizar nossa vida financeira comigo no Juntadin: ${inviteLink}`, url: inviteLink }); }

  return <Screen contentStyle={styles.screen}>
    <View style={styles.top}><Pressable accessibilityLabel="Voltar" onPress={goBack}><Text style={styles.back}>‹</Text></Pressable><Text accessibilityRole="header" style={styles.title}>Conta e casal</Text><View style={styles.spacer} /></View>
    <View style={styles.hero}><View style={styles.heroIcon}><CategoryIcon name="group_add" color={palette.greenVault} size={30} /></View><Text style={styles.heroTitle}>Use sozinho ou a dois</Text><Text style={styles.heroText}>Ao ativar o espaço de casal, vocês passam a compartilhar a organização financeira deste espaço.</Text></View>
    <View style={styles.card}>
      <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.rowTitle}>Espaço de casal</Text><Text style={styles.rowBody}>{settings.enabled ? 'Ativado' : 'Você está usando o Juntadin individualmente'}</Text></View><Switch value={settings.enabled} onValueChange={(enabled) => update({ enabled })} trackColor={{ false: palette.border, true: palette.greenAction }} thumbColor={settings.enabled ? palette.greenVault : palette.surface} /></View>
      {settings.enabled ? <Field label="Nome da família ou do espaço" value={settings.familyName} onChangeText={(familyName) => update({ familyName })} placeholder="Ex.: Casa da Ana e do Leo" maxLength={40} /> : null}
    </View>
    {settings.enabled ? <View style={styles.inviteCard}>
      <Text style={styles.rowTitle}>Convide seu parceiro</Text>
      <Text style={styles.rowBody}>O link é individual e poderá ser usado para entrar neste espaço.</Text>
      {inviteLink ? <View style={styles.linkBox}><CategoryIcon name="link" color={palette.greenVault} size={20} /><Text numberOfLines={1} style={styles.link}>{inviteLink}</Text></View> : null}
      {inviteLink ? <View style={styles.actions}><Button label={copied ? 'Link copiado' : 'Copiar link'} variant="secondary" onPress={copyLink} /><Button label="Compartilhar" onPress={shareLink} /></View> : <Button label="Gerar link de convite" onPress={generateInvite} />}
      {inviteLink ? <Pressable onPress={generateInvite} style={styles.newLink}><Text style={styles.newLinkText}>Gerar um novo link</Text></Pressable> : null}
    </View> : null}
    <Text style={styles.hint}>Desativar o espaço de casal não apaga seus dados. A entrada efetiva do parceiro será conectada ao Supabase na próxima etapa.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 720, gap: 20 },
  top: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
  back: { color: palette.greenVault, fontSize: 38, width: 40 },
  title: { flex: 1, color: palette.ink, fontFamily: font.display, fontSize: 25, textAlign: 'center' },
  spacer: { width: 40 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  heroIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: palette.ink, fontFamily: font.display, fontSize: 25 },
  heroText: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 440 },
  card: { gap: 18, padding: 18, borderRadius: 20, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  switchCopy: { flex: 1, gap: 4 },
  rowTitle: { color: palette.ink, fontFamily: font.semibold, fontSize: 17 },
  rowBody: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13, lineHeight: 19 },
  inviteCard: { gap: 14, padding: 18, borderRadius: 20, backgroundColor: palette.mint },
  linkBox: { minHeight: 50, paddingHorizontal: 14, borderRadius: 13, backgroundColor: palette.surface, flexDirection: 'row', alignItems: 'center', gap: 10 },
  link: { flex: 1, color: palette.ink, fontFamily: font.medium, fontSize: 13 },
  actions: { gap: 10 },
  newLink: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  newLinkText: { color: palette.greenAction, fontFamily: font.semibold, fontSize: 14 },
  hint: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
});
