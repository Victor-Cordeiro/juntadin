export type Money = Readonly<{
  currency: 'BRL';
  cents: bigint;
}>;

export const money = (cents: bigint): Money => ({ currency: 'BRL', cents });

