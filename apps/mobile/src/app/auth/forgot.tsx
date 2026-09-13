import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark, Button, Field, PageHeader, Screen, uiStyles } from '@/components/juntadin-ui';
import { authService } from '@/services/auth';
import { font, palette } from '@/theme/tokens';

export default function ForgotScreen() { const [email, setEmail] = useState(''); const [error, setError] = useState(''); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false); async function submit() { setBusy(true); setError(''); try { await authService.sendPasswordReset(email); setSent(true); } catch (e) { setError(e instanceof Error ? e.message : 'Confira o e-mail.'); } finally { setBusy(false); } } return <Screen><BrandMark withName /><PageHeader title="Recupere seu acesso." subtitle="Vamos enviar um link para você criar uma nova senha." />{sent ? <View style={[uiStyles.card, styles.success]}><Text style={styles.successTitle}>Link enviado</Text><Text style={uiStyles.body}>Confira a caixa de entrada e o spam de {email}.</Text><Link href="/auth/login" style={uiStyles.link}>Voltar para entrar</Link></View> : <View style={uiStyles.form}><Field label="E-mail" value={email} onChangeText={setEmail} error={error} keyboardType="email-address" autoCapitalize="none" /><Button label="Enviar link" loading={busy} onPress={submit} /><Link href="/auth/login" style={uiStyles.link}>Voltar para entrar</Link></View>}</Screen>; }
const styles = StyleSheet.create({ success: { backgroundColor: palette.mint }, successTitle: { color: palette.greenVault, fontFamily: font.display, fontSize: 22 } });
