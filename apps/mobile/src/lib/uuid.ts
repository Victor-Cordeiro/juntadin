/**
 * Transactions need a real UUID as their id from the moment they're created — the
 * Supabase `transactions.id` column is `uuid`, and the sync queue upserts by id, so a
 * locally-made id must already be the same one the server will store.
 */
export function uuid(): string {
  const source = globalThis.crypto as Crypto | undefined;
  if (source?.randomUUID) return source.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}
