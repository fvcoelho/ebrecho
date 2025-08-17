export const CATEGORY_OPTIONS = [
  'Vestidos',
  'Saias',
  'Blusas',
  'Camisetas e Polos',
  'Shorts e Bermudas',
  'Calças',
  'Bolsas',
  'Óculos',
  'Sapatos',
  'Acessórios'
] as const;

export type Category = typeof CATEGORY_OPTIONS[number];