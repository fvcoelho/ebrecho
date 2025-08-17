export const BRAND_OPTIONS = [
  'Zara',
  'Adidas',
  'Arezzo',
  'Nike',
  'Farm',
  'Tommy Hilfiger',
  'Shoulder',
  'Youcom',
  'Amaro',
  'Animale',
  'Schutz',
  'H&M',
  'Gap',
  'Levi\'s'
] as const;

export type Brand = typeof BRAND_OPTIONS[number];