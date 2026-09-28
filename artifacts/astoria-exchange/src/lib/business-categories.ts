export const BUSINESS_CATEGORIES = [
  'Grocery Stores',
  'Restaurants',
  'Bakery',
  'Coffee Shops',
  'Retail Stores',
  'Warehouse',
  'Factories',
  'Hotel',
  'Healthcare',
  'Schools',
  'Library',
  'Office',
  'Construction company',
  'Artist',
  'Florist',
  'Community Garden',
  'Charity and Donation',
  'Other',
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];