export type Category = 'travel' | 'daily';

export interface TravelRecord {
  id: string;
  date: string;
  title?: string;
  location: string;
  content: string;
  category: Category;
  tags: string[];
  images: string[];
  createdAt: string;
  shareCode?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
}

export interface SharedSpace {
  id: string;
  code: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt: string;
}

export const CATEGORIES: Record<Category, { label: string; icon: string }> = {
  travel: { label: '여행', icon: 'plane' },
  daily: { label: '일상', icon: 'book' },
};

export const DEFAULT_TAGS = [
  '#국내여행',
  '#해외여행',
  '#당일치기',
  '#혼여행',
  '#친구와',
  '#가족여행',
  '#맛집',
  '#카페',
  '#숙소',
];

export const FILTER_CHIPS = [
  { id: 'all', label: '전체' },
  { id: 'domestic', label: '국내여행' },
  { id: 'overseas', label: '해외여행' },
  { id: 'daytrip', label: '당일치기' },
  { id: 'solo', label: '혼여행' },
  { id: 'friends', label: '친구와' },
  { id: 'family', label: '가족여행' },
];
