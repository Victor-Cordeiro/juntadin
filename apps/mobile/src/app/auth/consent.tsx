import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandMark, Button, CheckRow, PageHeader, Screen, uiStyles } from '@/components/juntadin-ui';
import { LEGAL_URLS } from '@/config/legal';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';

export default function ConsentScreen() {
  const router = useRouter();
  const { session, onboarding, acceptLegalTerms, signOut } = usePrototype();
  const [accepted, setAccepted] = useState(false);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function confirm() {
    if (!accepted || !adult) { setMessage('Confirme os dois itens para continuar.'); return; }
    setBusy(true); setMessage('');
    try {
      await acceptLegalTerms();
      router.replace(onboarding.completed ? '/dashboard' : '/onboarding/cycle');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível registrar seu aceite.');
    } finally { setBusy(false); }
  }

  if (!session) return null;
  return <Screen><BrandMark withName /><PageHeader eyebrow="PRIVACIDADE E CONTROLE" title="Antes de continuar." subtitle="Leia os documentos e confirme como sua conta será usada." />
    <View style={uiStyles.form}>
      <CheckRow checked={accepted} onPress={() => setAccepted(!accepted)}>Li e aceito os Termos de Uso e a Política de Privacidade.</CheckRow>
      <View style={styles.links}><Pressable onPress={() => Linking.openURL(LEGAL_URLS.terms)}><Text style={uiStyles.link}>Termos de Uso</Text></Pressable><Text style={styles.dot}>•</Text><Pressable onPress={() => Linking.openURL(LEGAL_URLS.privacy)}><Text style={uiStyles.link}>Política de Privacidade</Text></Pressable></View>
      <CheckRow checked={adult} onPress={() => setAdult(!adult)}>Confirmo que tenho 18 anos ou mais.</CheckRow>
      <Text style={styles.notice}>Fotos, áudios e textos enviados à JuntaAI são processados pelo Supabase e pelo Google Cloud para preparar o lançamento. Você sempre revisa antes de confirmar.</Text>
      {message ? <Text accessibilityLiveRegion="polite" style={styles.error}>{message}</Text> : null}
      <Button label="Aceitar e continuar" loading={busy} onPress={confirm} />
      <Button label="Não aceito — sair" variant="ghost" onPress={async () => { await signOut(); router.replace('/'); }} />
    </View>
  </Screen>;
}

const styles = StyleSheet.create({ links: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: -12 }, dot: { color: palette.inkMuted }, notice: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 13, lineHeight: 20, backgroundColor: palette.mint, borderRadius: 14, padding: 14 }, error: { color: palette.deficit, fontFamily: font.regular, fontSize: 13 } });
