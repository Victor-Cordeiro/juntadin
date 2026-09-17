import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';

export type CapturedMedia = Readonly<{ base64: string; mimeType: string }>;

/**
 * Reads a photographed or picked receipt straight into base64 and hands it back —
 * nothing is copied into app storage first (unlike the profile-photo flow), because
 * this file must never outlive the single AI request it's used for.
 */
export async function captureReceiptImage(source: 'camera' | 'library'): Promise<CapturedMedia | null> {
  const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error(source === 'camera' ? 'Precisamos da câmera para fotografar o recibo.' : 'Precisamos da sua permissão para abrir as fotos.');

  const launch = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  const result = await launch({ mediaTypes: ['images'], quality: 0.5, base64: true });
  if (result.canceled || !result.assets?.[0]?.base64) return null;
  return { base64: result.assets[0].base64!, mimeType: result.assets[0].mimeType ?? 'image/jpeg' };
}

/**
 * Records a voice message and hands it back as base64. The recording file is deleted
 * the moment it's been read, whether the caller ends up sending it or not — the only
 * copy that's allowed to survive is the base64 string held in memory for the request.
 */
export function useAudioCapture() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);

  async function start() {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) throw new Error('Precisamos do microfone para gravar sua mensagem.');
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stop(): Promise<CapturedMedia | null> {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return null;
    const file = new File(uri);
    try {
      return { base64: await file.base64(), mimeType: 'audio/m4a' };
    } finally {
      try { if (file.exists) file.delete(); } catch { /* nothing left to clean up */ }
    }
  }

  return { isRecording: state.isRecording, start, stop };
}
