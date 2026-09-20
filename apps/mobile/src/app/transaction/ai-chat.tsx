import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/juntadin-ui';
import { CategoryIcon } from '@/components/category-icon';
import { useGoBack } from '@/hooks/use-back';
import { captureReceiptImage, useAudioCapture } from '@/lib/ai-capture';
import { extractTransaction, ExtractionError } from '@/services/ai-extraction';
import { usePrototype } from '@/state/prototype-context';
import { answerFinancialQuery } from '@/lib/financial-query';
import { font, palette } from '@/theme/tokens';

type ChatMessage = { id: string; from: 'me' | 'ia'; text: string; error?: boolean };

let messageId = 0;
const nextId = () => String((messageId += 1));

export default function AiChatScreen() {
  const router = useRouter();
  const goBack = useGoBack('/dashboard');
  const { hydrated, session, onboarding, customCategories, customPaymentMethods, transactions, pendingItems, setProposal } = usePrototype();
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: nextId(), from: 'ia', text: 'Oi! Me conta um gasto ou uma renda por texto, foto de um recibo/boleto ou áudio — eu preparo o lançamento pra você confirmar.' }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const audio = useAudioCapture();

  useEffect(() => { if (hydrated && !session) router.replace('/auth/login'); }, [hydrated, router, session]);
  if (!hydrated || !session) return null;

  function say(from: ChatMessage['from'], body: string, error = false) {
    setMessages((current) => [...current, { id: nextId(), from, text: body, error }]);
  }

  async function send(input: Parameters<typeof extractTransaction>[0]) {
    setBusy(true);
    try {
      const proposal = await extractTransaction(input, customCategories, customPaymentMethods);
      const named = onboarding.account?.name ? { ...proposal, accountName: onboarding.account.name } : proposal;
      say('ia', `Entendi: ${named.kind === 'income' ? 'renda' : 'despesa'} em ${named.category}. Confira e confirme.`);
      setProposal(named);
      router.push('/transaction/review');
    } catch (error) {
      const message = error instanceof ExtractionError ? error.message : 'Algo deu errado. Tente de novo.';
      say('ia', message, true);
    } finally {
      setBusy(false);
    }
  }

  function sendText() {
    const value = text.trim();
    if (!value || busy) return;
    say('me', value);
    setText('');
    const query = answerFinancialQuery({ text: value, transactions, pendingItems });
    if (query.handled) {
      say('ia', query.answer ?? 'Não encontrei dados para essa consulta.');
      return;
    }
    send({ mode: 'text', text: value });
  }

  async function sendImage(source: 'camera' | 'library') {
    if (busy) return;
    try {
      const media = await captureReceiptImage(source);
      if (!media) return;
      say('me', '📷 Foto enviada');
      await send({ mode: 'image', media });
    } catch (error) {
      say('ia', error instanceof Error ? error.message : 'Não consegui acessar a câmera/fotos.', true);
    }
  }

  async function toggleRecording() {
    if (busy) return;
    if (audio.isRecording) {
      const media = await audio.stop();
      if (!media) return;
      say('me', '🎤 Áudio enviado');
      await send({ mode: 'audio', media });
      return;
    }
    try {
      await audio.start();
    } catch (error) {
      say('ia', error instanceof Error ? error.message : 'Não consegui acessar o microfone.', true);
    }
  }

  return <Screen contentStyle={styles.screen} footer={<InputBar text={text} setText={setText} busy={busy} onSend={sendText} onCamera={() => sendImage('camera')} onGallery={() => sendImage('library')} onMic={toggleRecording} recording={audio.isRecording} />}>
    <View style={styles.top}>
      <Pressable accessibilityLabel="Voltar" hitSlop={10} onPress={goBack} style={styles.back}><Text style={styles.backIcon}>‹</Text></Pressable>
      <View style={styles.top} />
    </View>
    <Text style={styles.title}>JuntaAi</Text>
    <View style={styles.thread}>
      {messages.map((message) => <View key={message.id} style={[styles.bubbleWrap, message.from === 'me' && styles.bubbleWrapMe]}>
        <View style={[styles.bubble, message.from === 'me' ? styles.bubbleMe : styles.bubbleIa, message.error && styles.bubbleError]}>
          <Text style={[styles.bubbleText, message.from === 'me' && styles.bubbleTextMe]}>{message.text}</Text>
        </View>
      </View>)}
      {busy ? <View style={styles.bubbleWrap}><View style={[styles.bubble, styles.bubbleIa]}><ActivityIndicator color={palette.greenVault} /></View></View> : null}
    </View>
  </Screen>;
}

function InputBar({ text, setText, busy, onSend, onCamera, onGallery, onMic, recording }: {
  text: string; setText(value: string): void; busy: boolean;
  onSend(): void; onCamera(): void; onGallery(): void; onMic(): void; recording: boolean;
}) {
  return <View style={styles.inputBar}>
    <Pressable accessibilityLabel="Tirar foto" disabled={busy} hitSlop={8} onPress={onCamera} style={styles.iconButton}><CategoryIcon name="photo_camera" color={palette.greenVault} size={22} /></Pressable>
    <Pressable accessibilityLabel="Escolher foto" disabled={busy} hitSlop={8} onPress={onGallery} style={styles.iconButton}><CategoryIcon name="image" color={palette.greenVault} size={22} /></Pressable>
    <TextInput
      accessibilityLabel="Mensagem"
      editable={!busy}
      onChangeText={setText}
      onSubmitEditing={onSend}
      placeholder="Conte um gasto ou uma renda…"
      placeholderTextColor={palette.inkMuted}
      returnKeyType="send"
      style={styles.input}
      value={text}
    />
    {Platform.OS !== 'web' ? <Pressable accessibilityLabel={recording ? 'Parar gravação' : 'Gravar áudio'} disabled={busy} hitSlop={8} onPress={onMic} style={[styles.iconButton, recording && styles.iconButtonActive]}>
      <CategoryIcon name={recording ? 'stop' : 'mic'} color={recording ? 'white' : palette.greenVault} size={22} />
    </Pressable> : null}
    <Pressable accessibilityLabel="Enviar" disabled={busy || !text.trim()} hitSlop={8} onPress={onSend} style={[styles.iconButton, styles.sendButton, (busy || !text.trim()) && styles.sendButtonDisabled]}>
      <CategoryIcon name="send" color="white" size={20} />
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  screen: { gap: 16, maxWidth: 720 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 40 },
  back: { position: 'absolute', left: 0, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: palette.greenVault, fontSize: 30, lineHeight: 32 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 24, textAlign: 'center' },
  thread: { gap: 10 },
  bubbleWrap: { flexDirection: 'row' },
  bubbleWrapMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleIa: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderBottomLeftRadius: 4 },
  bubbleMe: { backgroundColor: palette.greenAction, borderBottomRightRadius: 4 },
  bubbleError: { borderColor: palette.deficit },
  bubbleText: { color: palette.ink, fontFamily: font.regular, fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: 'white' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 20, padding: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconButtonActive: { backgroundColor: palette.deficit },
  sendButton: { backgroundColor: palette.greenAction },
  sendButtonDisabled: { opacity: 0.5 },
  input: { flex: 1, minHeight: 40, color: palette.ink, fontFamily: font.regular, fontSize: 15 },
});
