import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark, Button, PageHeader, Screen, uiStyles } from '@/components/juntadin-ui';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';

export default function VerifyScreen() { const router = useRouter(); const { pendingUser, verifyEmail } = usePrototype(); return <Screen><BrandMark withName /><PageHeader eyebrow="Falta pouco" title="Confira seu e-mail." subtitle={`Enviamos um link de confirmação para ${pendingUser?.email ?? 'seu e-mail'}.`} /><View style={[uiStyles.card, styles.center]}><View style={styles.envelope}><Text style={styles.envelopeText}>@</Text></View><Text style={uiStyles.body}>Nesta prévia, o botão abaixo simula a abertura do link recebido.</Text></View><Button label="Simular e-mail confirmado" onPress={() => { verifyEmail(); router.replace('/onboarding/cycle'); }} /><Button label="Voltar ao cadastro" variant="ghost" onPress={() => router.back()} /></Screen>; }
const styles = StyleSheet.create({ center: { alignItems: 'center' }, envelope: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' }, envelopeText: { fontFamily: font.display, color: palette.greenVault, fontSize: 30 } });
