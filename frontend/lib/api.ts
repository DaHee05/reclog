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

// --- Users ---
export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
}

export async function fetchMe(): Promise<UserProfile> {
  const res = await authFetch(`${API_URL}/api/users/me`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function updateProfile(data: { nickname?: string; avatar_url?: string; delete_avatar?: boolean }): Promise<UserProfile> {
  const res = await authFetch(`${API_URL}/api/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
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

export async function fetchRecordsByMonth(year: number, month: number): Promise<TravelRecord[]> {
  const params = new URLSearchParams();
  params.set('year', String(year));
  params.set('month', String(month));
  params.set('size', '100');

  const res = await authFetch(`${API_URL}/api/records?${params}`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch records');

  const data = await res.json();
  return data.items.map((r: ApiRecord) => toTravelRecord(r));
}

export async function fetchRecordStats() {
  const res = await authFetch(`${API_URL}/api/records/stats`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
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
  space_id?: string;
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

export async function updateCategory(id: string, name?: string): Promise<ApiCategory> {
  const res = await authFetch(`${API_URL}/api/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await authFetch(`${API_URL}/api/categories/${id}`, {
    method: 'DELETE',
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to delete category');
}

export async function createCategory(name: string): Promise<ApiCategory> {
  const res = await authFetch(`${API_URL}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify({ name }),
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
    if (res.status === 403) {
      const error = new Error('LIMIT_EXCEEDED') as Error & { status: number };
      error.status = 403;
      throw error;
    }
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

// --- Shared Spaces ---
export interface SharedSpace {
  id: string;
  owner_id: string;
  category_name: string;
  category_emoji: string;
  code: string;
  member_count: number;
  created_at: string;
}

export interface SpaceRecord {
  id: string;
  user_id: string;
  poster_nickname: string;
  title: string | null;
  content: string;
  content_preview: string;
  location: string | null;
  category: string | null;
  date: string | null;
  tags: string[];
  images: { id: string; image_url: string; is_primary: boolean; order: number }[];
  created_at: string;
  updated_at: string;
}

export async function createSharedSpace(category_name: string, category_emoji: string): Promise<SharedSpace> {
  const res = await authFetch(`${API_URL}/api/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify({ category_name, category_emoji }),
  });
  if (!res.ok) throw new Error('Failed to create shared space');
  return res.json();
}

export async function joinSharedSpace(code: string): Promise<SharedSpace> {
  const res = await authFetch(`${API_URL}/api/spaces/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeaders() },
    body: JSON.stringify({ code }),
  });
  if (res.status === 404) throw Object.assign(new Error('NOT_FOUND'), { status: 404 });
  if (res.status === 409) throw Object.assign(new Error('ALREADY_JOINED'), { status: 409 });
  if (!res.ok) throw new Error('Failed to join shared space');
  return res.json();
}

export async function fetchMySpaces(): Promise<SharedSpace[]> {
  const res = await authFetch(`${API_URL}/api/spaces`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch spaces');
  return res.json();
}

export async function fetchSpace(spaceId: string): Promise<SharedSpace> {
  const res = await authFetch(`${API_URL}/api/spaces/${spaceId}`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch space');
  return res.json();
}

export async function fetchSpaceRecords(spaceId: string, page = 1, size = 10): Promise<{ items: SpaceRecord[]; total: number; page: number; size: number; total_pages: number }> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const res = await authFetch(`${API_URL}/api/spaces/${spaceId}/records?${params}`, {
    headers: { ...await authHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch space records');
  return res.json();
}
