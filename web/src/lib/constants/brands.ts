export const BRAND_LIST = [
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

export const BRAND_OPTIONS = BRAND_LIST.map(brand => ({
  value: brand,
  label: brand
}));

export type Brand = typeof BRAND_LIST[number];