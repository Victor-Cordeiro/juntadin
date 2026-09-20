import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button, Field, PageHeader, Screen, uiStyles } from '@/components/juntadin-ui';
import { LEGAL_URLS, SUPPORT_EMAIL } from '@/config/legal';
import { useGoBack } from '@/hooks/use-back';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const goBack = useGoBack('/settings');
  const { deleteAccount } = usePrototype();
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canDelete = confirmation.trim().toLocaleUpperCase('pt-BR') === 'EXCLUIR';

  async function remove() {
    if (!canDelete) return;
    setBusy(true); setMessage('');
    try {
      await deleteAccount();
      router.replace('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível excluir a conta.');
    } finally { setBusy(false); }
  }

  return <Screen><PageHeader eyebrow="AÇÃO PERMANENTE" title="Excluir sua conta?" subtitle="Esta ação não pode ser desfeita." />
    <View style={[uiStyles.card, styles.warning]}>
      <Text style={styles.title}>O que será apagado</Text>
      <Text style={uiStyles.body}>Seu perfil, sessões, lançamentos associados a você, contas pendentes, preferências e dados locais deste aparelho.</Text>
      <Text style={uiStyles.body}>Em um espaço de casal, os dados exclusivos do parceiro e o acesso dele serão preservados. Movimentos associados a você serão removidos.</Text>
    </View>
    <View style={uiStyles.form}>
      <Field label="Digite EXCLUIR para confirmar" value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" autoCorrect={false} />
      {message ? <Text accessibilityLiveRegion="polite" style={styles.error}>{message}</Text> : null}
      <Button label="Excluir conta definitivamente" disabled={!canDelete} loading={busy} onPress={remove} />
      <Button label="Cancelar" variant="secondary" onPress={goBack} />
      <Text style={styles.help}>Está sem acesso ao app? Solicite a exclusão pela <Text style={styles.link} onPress={() => Linking.openURL(LEGAL_URLS.deletion)}>página externa</Text> ou por {SUPPORT_EMAIL}.</Text>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({ warning: { borderColor: palette.deficit }, title: { color: palette.ink, fontFamily: font.semibold, fontSize: 17 }, error: { color: palette.deficit, fontFamily: font.regular, fontSize: 13 }, help: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13, lineHeight: 20, textAlign: 'center' }, link: { color: palette.greenAction, fontFamily: font.semibold } });
