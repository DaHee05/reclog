import type { TravelRecord, CustomCategory, SharedSpace } from './types';

export const dummyRecords: TravelRecord[] = [
  {
    id: '1',
    date: '2024-11-03',
    location: '교토, 일본',
    content: '오늘 드디어 아라시야마에 다녀왔다. 단풍이 정말 절정이었다. 대나무 숲을 걷는 동안 마음이 정화되는 느낌. 혼자 여행하니까 오히려 더 깊이 느낄 수 있었던 것 같다. 다음에는 봄에 벚꽃 필 때 다시 와야지.',
    category: 'travel',
    tags: ['#해외여행', '#혼여행', '#일본', '#단풍'],
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
    ],
    createdAt: '2024-11-03T18:30:00Z',
  },
  {
    id: '2',
    date: '2024-10-20',
    location: '전주 한옥마을',
    content: '친구들이랑 전주 당일치기! 한복 입고 사진도 찍고, 비빔밥도 먹고, 초코파이도 사고. 하루가 너무 짧았다. 다음엔 1박으로 와야지.',
    category: 'travel',
    tags: ['#국내여행', '#당일치기', '#친구와', '#맛집'],
    images: [
      'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=80',
    ],
    createdAt: '2024-10-20T20:15:00Z',
  },
  {
    id: '3',
    date: '2024-09-14',
    location: '제주도 애월',
    content: '가족들과 제주도 여행 3일차. 오늘은 애월 해안도로를 드라이브했다. 엄마가 바다 보면서 너무 좋아하셨다. 카페에서 본 노을이 잊을 수 없을 것 같다.',
    category: 'travel',
    tags: ['#국내여행', '#가족여행', '#숙소', '#카페'],
    images: [
      'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
    ],
    createdAt: '2024-09-14T19:45:00Z',
  },
  {
    id: '4',
    date: '2024-08-25',
    location: '카페',
    content: '오늘 새로 오픈한 카페 다녀왔다. 분위기도 좋고 커피도 맛있었다. 창가 자리에서 책 읽으면서 여유로운 시간 보냄.',
    category: 'daily',
    tags: ['#카페', '#일상', '#여유'],
    images: [
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80',
    ],
    createdAt: '2024-08-25T23:00:00Z',
  },
  {
    id: '5',
    date: '2024-12-01',
    location: '방콕, 태국',
    content: '방콕 첫날! 카오산로드 야시장에서 팟타이도 먹고 망고 스무디도 마셨다. 날씨가 덥지만 활기찬 분위기가 너무 좋다.',
    category: 'travel',
    tags: ['#해외여행', '#혼여행', '#맛집', '#야시장'],
    images: [
      'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
      'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
    ],
    createdAt: '2024-12-01T22:00:00Z',
  },
  {
    id: '6',
    date: '2024-11-15',
    location: '부산 감천동',
    content: '알록달록한 마을 구경하면서 사진 엄청 찍었다. 계단이 많아서 힘들었지만 그만큼 뷰가 예뻤다!',
    category: 'travel',
    tags: ['#국내여행', '#친구와', '#부산'],
    images: [
      'https://images.unsplash.com/photo-1578037571214-25e07a2e0f5d?w=800&q=80',
    ],
    createdAt: '2024-11-15T16:00:00Z',
  },
];

export const customCategories: CustomCategory[] = [];

export const sharedSpaces: SharedSpace[] = [];

export const userProfile = {
  name: '여행러',
  joinDate: '2024-01-15',
  totalRecords: dummyRecords.length,
};
