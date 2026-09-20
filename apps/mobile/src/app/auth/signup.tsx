import { validateSignUp, type SignUpInput } from '@juntadin/contracts';
import { Link, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandMark, Button, CheckRow, Field, PageHeader, Screen, uiStyles } from '@/components/juntadin-ui';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';
import { LEGAL_URLS } from '@/config/legal';

const empty: SignUpInput = { name: '', email: '', password: '', passwordConfirmation: '', acceptsTerms: false, confirmsAdult: false };
export default function SignupScreen() {
  const router = useRouter(); const { signUp, signInWithGoogle } = usePrototype(); const [input, setInput] = useState(empty); const [errors, setErrors] = useState<ReturnType<typeof validateSignUp>>({}); const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function submit() { const next = validateSignUp(input); setErrors(next); setMessage(''); if (Object.keys(next).length) return; setBusy(true); try { await signUp(input); router.replace('/onboarding/cycle'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar a conta.'); } finally { setBusy(false); } }
  async function submitGoogle() { setBusy(true); setMessage(''); try { const user = await signInWithGoogle(); router.replace((user.legalAccepted ? '/dashboard' : '/auth/consent') as Href); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível continuar com Google.'); } finally { setBusy(false); } }
  return <Screen><BrandMark withName /><PageHeader eyebrow="COMECE GRÁTIS" title="Crie sua conta." subtitle="Organize seu dinheiro com clareza e controle." />
  <View style={styles.googleOption}><Text style={styles.googleHint}>Mais rápido</Text><Button label="Continuar com Google" variant="secondary" loading={busy} onPress={submitGoogle} /><View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>ou preencha seus dados</Text><View style={styles.orLine} /></View></View>
  <View style={uiStyles.form}>
    <Field label="Nome" value={input.name} onChangeText={(name) => setInput({ ...input, name })} error={errors.name} autoComplete="name" />
    <Field label="E-mail" value={input.email} onChangeText={(email) => setInput({ ...input, email })} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
    <Field label="Senha" value={input.password} onChangeText={(password) => setInput({ ...input, password })} error={errors.password} secureTextEntry={!visible} autoComplete="new-password" right={<Pressable onPress={() => setVisible(!visible)}><Text style={styles.show}>{visible ? 'Ocultar' : 'Mostrar'}</Text></Pressable>} />
    <Field label="Confirme a senha" value={input.passwordConfirmation} onChangeText={(passwordConfirmation) => setInput({ ...input, passwordConfirmation })} error={errors.passwordConfirmation} secureTextEntry={!visible} />
    <CheckRow checked={input.acceptsTerms} onPress={() => setInput({ ...input, acceptsTerms: !input.acceptsTerms })} error={errors.acceptsTerms}>Li e aceito os Termos de Uso e a Política de Privacidade.</CheckRow>
    <View style={styles.legalLinks}><Pressable onPress={() => Linking.openURL(LEGAL_URLS.terms)}><Text style={uiStyles.link}>Ler Termos de Uso</Text></Pressable><Text style={styles.dot}>•</Text><Pressable onPress={() => Linking.openURL(LEGAL_URLS.privacy)}><Text style={uiStyles.link}>Ler Política de Privacidade</Text></Pressable></View>
    <CheckRow checked={input.confirmsAdult} onPress={() => setInput({ ...input, confirmsAdult: !input.confirmsAdult })} error={errors.confirmsAdult}>Confirmo que tenho 18 anos ou mais.</CheckRow>
    {message ? <Text style={styles.message}>{message}</Text> : null}<Button label="Criar conta" loading={busy} onPress={submit} /><View style={styles.login}><Text style={uiStyles.body}>Já tem conta?</Text><Link href="/auth/login" style={uiStyles.link}> Entrar</Link></View>
  </View></Screen>;
}
const styles = StyleSheet.create({ show: { color: palette.greenAction, fontFamily: font.semibold, padding: 8 }, message: { color: palette.deficit, fontFamily: font.regular }, login: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }, googleOption: { gap: 10 }, googleHint: { color: palette.greenVault, fontFamily: font.semibold, fontSize: 13 }, orRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, orLine: { flex: 1, height: 1, backgroundColor: palette.border }, orText: { color: palette.inkMuted, fontFamily: font.medium, fontSize: 13 }, legalLinks: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: -10 }, dot: { color: palette.inkMuted } });
