import { validateSignIn, type SignInInput } from '@juntadin/contracts';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandMark, Button, Field, PageHeader, Screen, uiStyles } from '@/components/juntadin-ui';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';

export default function LoginScreen() {
  const router = useRouter(); const { signIn, signInWithGoogle } = usePrototype();
  const [input, setInput] = useState<SignInInput>({ email: '', password: '' }); const [errors, setErrors] = useState<ReturnType<typeof validateSignIn>>({}); const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function submit() { const next = validateSignIn(input); setErrors(next); setMessage(''); if (Object.keys(next).length) return; setBusy(true); // The dashboard guard reads the freshly loaded state and sends the user to
// onboarding when it is still pending — deciding here would use a stale closure.
    try { await signIn(input); router.replace('/dashboard'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível entrar. Tente de novo.'); } finally { setBusy(false); } }
  async function submitGoogle() { setBusy(true); setMessage(''); try { await signInWithGoogle(); router.replace('/dashboard'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível entrar com Google.'); } finally { setBusy(false); } }
  return <Screen><BrandMark withName /><PageHeader title="Que bom ter você de volta." subtitle="Entre para continuar de onde parou." />
  <View style={styles.googleOption}><Button label="Continuar com Google" variant="secondary" loading={busy} onPress={submitGoogle} /><View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>ou entre com e-mail</Text><View style={styles.orLine} /></View></View>
  <View style={uiStyles.form}>
    <Field label="E-mail" value={input.email} onChangeText={(email) => setInput({ ...input, email })} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
    <Field label="Senha" value={input.password} onChangeText={(password) => setInput({ ...input, password })} error={errors.password} secureTextEntry={!visible} autoComplete="current-password" right={<Pressable onPress={() => setVisible(!visible)} hitSlop={10}><Text style={styles.show}>{visible ? 'Ocultar' : 'Mostrar'}</Text></Pressable>} />
    <Link href="/auth/forgot" style={uiStyles.link}>Esqueci minha senha</Link>{message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}<Button label="Entrar" loading={busy} onPress={submit} />
    <View style={styles.signup}><Text style={uiStyles.body}>Ainda não tem conta?</Text><Link href="/auth/signup" style={uiStyles.link}> Criar conta</Link></View>
  </View></Screen>;
}
const styles = StyleSheet.create({ show: { color: palette.greenAction, fontFamily: font.semibold, padding: 8 }, message: { color: palette.deficit, fontFamily: font.regular, lineHeight: 21 }, signup: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }, googleOption: { gap: 14 }, orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, orLine: { flex: 1, height: 1, backgroundColor: palette.border }, orText: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 13 } });
