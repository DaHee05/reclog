import type { TravelRecord } from './types';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.href = '/login';
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }
  return res;
}

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
export interface PaginatedRecords {
  items: TravelRecord[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export async function fetchRecords(category?: string, page = 1, size = 5): Promise<PaginatedRecords> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  params.set('page', String(page));
  params.set('size', String(size));

  const res = await authFetch(`${API_URL}/api/records?${params}`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch records');

  const data = await res.json();
  return {
    items: data.items.map((r: ApiRecord) => toTravelRecord(r)),
    total: data.total,
    page: data.page,
    size: data.size,
    total_pages: data.total_pages,
  };
}

export async function fetchAllRecords(category?: string): Promise<TravelRecord[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  params.set('size', '1000');

  const res = await authFetch(`${API_URL}/api/records?${params}`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch records');

  const data = await res.json();
  return data.items.map((r: ApiRecord) => toTravelRecord(r));
}

export async function fetchRecord(id: string): Promise<TravelRecord | null> {
  const res = await authFetch(`${API_URL}/api/records/${id}`, {
    headers: { ...await authHeaders() },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch record');

  const data: ApiRecord = await res.json();
  return toTravelRecord(data);
}

export async function createRecord(record: {
  title?: string;
  content: string;
  location?: string;
  category: string;
  date: string;
  tags: string[];
  images: { image_url: string; is_primary: boolean; order: number }[];
}): Promise<TravelRecord> {
  const res = await authFetch(`${API_URL}/api/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
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
  const res = await authFetch(`${API_URL}/api/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
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
  const res = await authFetch(`${API_URL}/api/records/${id}`, {
    method: 'DELETE',
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete record');
}

// --- Categories ---
export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await authFetch(`${API_URL}/api/categories`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(name: string, emoji: string): Promise<ApiCategory> {
  const res = await authFetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify({ name, emoji }),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

// --- Upload ---
export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await authFetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { ...await authHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload images');

  const data: { urls: string[] } = await res.json();
  return data.urls;
}

// --- Generate Overlay ---
export async function generateOverlay(file: File, tags?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (tags) formData.append('tags', tags);

  const res = await authFetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: { ...await authHeaders() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`이미지 생성 실패: ${err}`);
  }

  const data: { url: string } = await res.json();
  return data.url;
}

// --- Photobooks ---
export interface PhotobookOrder {
  id: string;
  user_id: string;
  title: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'processing' | 'completed' | 'shipping' | 'delivered';
  created_at: string;
  updated_at: string;
}

export async function createPhotobook(order: {
  title: string;
  category?: string;
  start_date?: string;
  end_date?: string;
}): Promise<PhotobookOrder> {
  const res = await authFetch(`${API_URL}/api/photobooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error('Failed to create photobook');
  return res.json();
}

export async function fetchPhotobooks(): Promise<PhotobookOrder[]> {
  const res = await authFetch(`${API_URL}/api/photobooks`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch photobooks');
  return res.json();
}

export async function updatePhotobookStatus(id: string, status: PhotobookOrder['status']): Promise<PhotobookOrder> {
  const res = await authFetch(`${API_URL}/api/photobooks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update photobook status');
  return res.json();
}
