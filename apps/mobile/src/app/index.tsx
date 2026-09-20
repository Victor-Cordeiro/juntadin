import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark, Button, Screen } from '@/components/juntadin-ui';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';

export default function WelcomeScreen() {
  const router = useRouter();
  const { hydrated, session } = usePrototype();
  // Someone already signed in should land back where they left off, not on the pitch.
  useEffect(() => { if (hydrated && session) router.replace('/dashboard'); }, [hydrated, router, session]);
  if (hydrated && session) return null;

  return <Screen contentStyle={styles.content}>
    <View style={styles.top}><BrandMark withName /></View>
    <View style={styles.hero}>
      <View style={styles.coinStack}><View style={styles.coin} /><View style={styles.coinMiddle} /><View style={styles.coinTop} /></View>
      <Text accessibilityRole="header" style={styles.title}>Seu mês financeiro, explicado.</Text>
      <Text style={styles.subtitle}>Mande o gasto. Confirme. Veja o mês inteiro.</Text>
      <View style={styles.trust}><Text style={styles.trustText}>Não conectamos ao seu banco e não movimentamos seu dinheiro.</Text></View>
    </View>
    <View style={styles.actions}>
      <Button label="Criar minha conta" onPress={() => router.push('/auth/signup')} />
      <Button label="Já tenho conta" variant="secondary" onPress={() => router.push('/auth/login')} />
      <Text style={styles.note}>Comece gratuitamente. Seus dados continuam sob seu controle.</Text>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', minHeight: 680 }, top: { alignItems: 'flex-start' }, hero: { alignItems: 'center', gap: 16 },
  title: { fontFamily: font.display, fontSize: 42, lineHeight: 47, letterSpacing: -1, textAlign: 'center', color: palette.ink, maxWidth: 520 },
  subtitle: { fontFamily: font.regular, fontSize: 18, lineHeight: 28, textAlign: 'center', color: palette.inkMuted },
  trust: { backgroundColor: palette.mint, borderRadius: 16, padding: 16, marginTop: 8, maxWidth: 460 }, trustText: { fontFamily: font.medium, fontSize: 14, lineHeight: 21, textAlign: 'center', color: palette.greenVault },
  actions: { gap: 12 }, note: { fontFamily: font.regular, color: palette.inkMuted, textAlign: 'center', fontSize: 13 },
  coinStack: { width: 112, height: 96, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 4 }, coin: { width: 92, height: 24, borderRadius: 99, backgroundColor: palette.greenVault },
  coinMiddle: { position: 'absolute', bottom: 18, width: 92, height: 24, borderRadius: 99, backgroundColor: palette.greenAction }, coinTop: { position: 'absolute', bottom: 36, width: 92, height: 28, borderRadius: 99, backgroundColor: palette.gold, borderWidth: 5, borderColor: palette.greenVault },
});
