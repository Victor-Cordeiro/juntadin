import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/juntadin-ui';
import { font, palette } from '@/theme/tokens';

// Rede de segurança: o login com Google usa `skipBrowserRedirect` e resolve o retorno
// dentro do próprio WebBrowser, então esta tela não deveria, na prática, ser alcançada.
// Sem ela, um deep link de callback que escapasse do WebBrowser cairia numa rota não
// mapeada do Expo Router e renderizava tela preta em vez de qualquer mensagem.
export default function AuthCallbackScreen() {
  const router = useRouter();
  useEffect(() => { router.replace('/auth/login'); }, [router]);
  return <View style={styles.wrap}><BrandMark /><ActivityIndicator color={palette.greenVault} style={styles.spinner} /><Text style={styles.text}>Concluindo login…</Text></View>;
}
const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: palette.paper },
  spinner: { marginTop: 8 },
  text: { color: palette.inkMuted, fontFamily: font.regular, fontSize: 15 },
});
