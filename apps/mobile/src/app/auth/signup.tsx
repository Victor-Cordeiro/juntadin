import { validateSignUp, type SignUpInput } from '@juntadin/contracts';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandMark, Button, CheckRow, Field, PageHeader, Screen, uiStyles } from '@/components/juntadin-ui';
import { usePrototype } from '@/state/prototype-context';
import { font, palette } from '@/theme/tokens';

const empty: SignUpInput = { name: '', phone: '', email: '', password: '', passwordConfirmation: '', acceptsTerms: false, confirmsAdult: false };
export default function SignupScreen() {
  const router = useRouter(); const { signUp } = usePrototype(); const [input, setInput] = useState(empty); const [errors, setErrors] = useState<ReturnType<typeof validateSignUp>>({}); const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  async function submit() { const next = validateSignUp(input); setErrors(next); setMessage(''); if (Object.keys(next).length) return; setBusy(true); try { await signUp(input); router.replace('/onboarding/cycle'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar a conta.'); } finally { setBusy(false); } }
  return <Screen><BrandMark withName /><PageHeader eyebrow="60 dias sem cartão" title="Crie sua conta." subtitle="Seu histórico continua seu, mesmo se o teste terminar." /><View style={uiStyles.form}>
    <Field label="Nome" value={input.name} onChangeText={(name) => setInput({ ...input, name })} error={errors.name} autoComplete="name" />
    <Field label="Telefone com DDD" value={input.phone} onChangeText={(phone) => setInput({ ...input, phone })} error={errors.phone} keyboardType="phone-pad" placeholder="(11) 99999-9999" autoComplete="tel" />
    <Field label="E-mail" value={input.email} onChangeText={(email) => setInput({ ...input, email })} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
    <Field label="Senha" value={input.password} onChangeText={(password) => setInput({ ...input, password })} error={errors.password} secureTextEntry={!visible} autoComplete="new-password" right={<Pressable onPress={() => setVisible(!visible)}><Text style={styles.show}>{visible ? 'Ocultar' : 'Mostrar'}</Text></Pressable>} />
    <Field label="Confirme a senha" value={input.passwordConfirmation} onChangeText={(passwordConfirmation) => setInput({ ...input, passwordConfirmation })} error={errors.passwordConfirmation} secureTextEntry={!visible} />
    <CheckRow checked={input.acceptsTerms} onPress={() => setInput({ ...input, acceptsTerms: !input.acceptsTerms })} error={errors.acceptsTerms}>Li e aceito os Termos de Uso e a Política de Privacidade.</CheckRow>
    <CheckRow checked={input.confirmsAdult} onPress={() => setInput({ ...input, confirmsAdult: !input.confirmsAdult })} error={errors.confirmsAdult}>Confirmo que tenho 18 anos ou mais.</CheckRow>
    {message ? <Text style={styles.message}>{message}</Text> : null}<Button label="Criar conta" loading={busy} onPress={submit} /><View style={styles.login}><Text style={uiStyles.body}>Já tem conta?</Text><Link href="/auth/login" style={uiStyles.link}> Entrar</Link></View>
  </View></Screen>;
}
const styles = StyleSheet.create({ show: { color: palette.greenAction, fontFamily: font.semibold, padding: 8 }, message: { color: palette.deficit, fontFamily: font.regular }, login: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' } });
