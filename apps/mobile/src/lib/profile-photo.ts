import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Picks a photo and keeps it for as long as the app is installed.
 *
 * On a device the picker hands back a URI under /cache, which the OS is free to
 * purge — storing that path would make the photo vanish on its own days later.
 * Copying into the document directory ties the file to the install instead: it
 * survives restarts and logouts, and goes away only on uninstall.
 *
 * The web has no such directory, and expo-file-system ships no web implementation
 * (calling into it throws "validatePath is not a function"), so there the picker's
 * own URI is used as-is.
 *
 * Returns the stored uri, or null when the user cancels.
 */
export async function pickProfilePhoto(previousUri?: string | null): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Precisamos da sua permissão para abrir as fotos.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const picked = result.assets[0].uri;

  // On web the picker returns a blob: URL, which dies on the next page load — the
  // photo would look saved and then silently disappear. Inlining the bytes keeps it.
  if (Platform.OS === 'web') return picked.startsWith('blob:') ? await toDataUri(picked) : picked;

  // A fresh name each time, so the image cache cannot serve the previous photo.
  const destination = new File(Paths.document, `profile-${Date.now()}.jpg`);
  await new File(picked).copy(destination);
  removeProfilePhoto(previousUri);
  return destination.uri;
}

async function toDataUri(blobUri: string): Promise<string> {
  const blob = await (await fetch(blobUri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem escolhida.'));
    reader.readAsDataURL(blob);
  });
}

/** Deletes a stored photo. Does nothing on web, where there is no file to delete. */
export function removeProfilePhoto(uri?: string | null) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A missing file is not a failure worth surfacing.
  }
}
