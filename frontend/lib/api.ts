import type { TravelRecord } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- API 응답 → Frontend 타입 변환 ---
interface ApiRecord {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  content_preview?: string;
  location: string;
  category: string;
  date: string;
  share_code: string | null;
  tags: string[];
  images: { id: string; image_url: string; is_primary: boolean; order: number }[];
  created_at: string;
  updated_at: string;
}

interface ApiCategory {
  id: string;
  name: string;
  emoji: string;
  is_default: boolean;
  record_count: number;
  created_at: string;
}

function toTravelRecord(api: ApiRecord): TravelRecord {
  return {
    id: api.id,
    date: api.date,
    title: api.title || undefined,
    location: api.location,
    content: api.content,
    contentPreview: api.content_preview,
    category: api.category as TravelRecord['category'],
    tags: api.tags,
    images: api.images
      .sort((a, b) => a.order - b.order)
      .map((img) => img.image_url),
    createdAt: api.created_at,
    shareCode: api.share_code || undefined,
  };
}

// --- Records ---
export async function fetchRecords(category?: string): Promise<TravelRecord[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);

  const res = await fetch(`${API_URL}/api/records?${params}`);
  if (!res.ok) throw new Error('Failed to fetch records');

  const data: ApiRecord[] = await res.json();
  return data.map(toTravelRecord);
}

export async function fetchRecord(id: string): Promise<TravelRecord | null> {
  const res = await fetch(`${API_URL}/api/records/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch record');

  const data: ApiRecord = await res.json();
  return toTravelRecord(data);
}

export async function createRecord(record: {
  title?: string;
  content: string;
  location: string;
  category: string;
  date: string;
  tags: string[];
  images: { image_url: string; is_primary: boolean; order: number }[];
}): Promise<TravelRecord> {
  const res = await fetch(`${API_URL}/api/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to create record');

  const data: ApiRecord = await res.json();
  return toTravelRecord(data);
}

export async function updateRecord(
  id: string,
  record: {
    title?: string;
    content?: string;
    location?: string;
    category?: string;
    date?: string;
    tags?: string[];
    images?: { image_url: string; is_primary: boolean; order: number }[];
  }
): Promise<TravelRecord> {
  const res = await fetch(`${API_URL}/api/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update record: ${res.status} ${err}`);
  }

  const data: ApiRecord = await res.json();
  return toTravelRecord(data);
}

export async function deleteRecord(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/records/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete record');
}

// --- Categories ---
export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(name: string, emoji: string): Promise<ApiCategory> {
  const res = await fetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, emoji }),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

// --- Upload ---
export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload images');

  const data: { urls: string[] } = await res.json();
  return data.urls;
}
