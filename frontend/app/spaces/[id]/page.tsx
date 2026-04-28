'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2, AlertCircle, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchSpace, fetchSpaceRecords, deleteRecord, type SharedSpace, type SpaceRecord } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [space, setSpace] = useState<SharedSpace | null>(null);
  const [records, setRecords] = useState<SpaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  const loadData = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const [spaceData, recordsData] = await Promise.all([
        fetchSpace(id),
        fetchSpaceRecords(id, page),
      ]);
      setSpace(spaceData);
      setRecords(recordsData.items);
      setCurrentPage(recordsData.page);
      setTotalPages(recordsData.total_pages);
    } catch {
      setError('불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(1); }, [id]);

  const handleDelete = async (recordId: string) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    try {
      await deleteRecord(recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        <header className="sticky top-0 z-50 bg-background px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              {space && (
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    {space.category_emoji} {space.category_name}
                  </h1>
                  <p className="text-xs text-muted-foreground">{space.member_count}명이 함께 기록 중</p>
                </div>
              )}
            </div>
            <Link
              href={`/record/new?spaceId=${id}&category=${space?.category_name ?? ''}`}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card hover:bg-muted transition-colors"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="px-4 py-4">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 rounded-2xl p-5 text-center">
              <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => loadData(1)}>
                <RefreshCw className="h-3.5 w-3.5" />다시 시도
              </Button>
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-muted-foreground text-sm">아직 기록이 없어요</p>
              <p className="text-muted-foreground text-sm">첫 번째 기록을 남겨보세요!</p>
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <div className="space-y-6">
              {records.map((record) => {
                const isOwn = record.user_id === currentUserId;
                return (
                  <div key={record.id} className="group">
                    {record.images.length > 0 && (
                      <Link href={`/record/${record.id}`} className="block mb-3">
                        <div className="relative w-full rounded-2xl overflow-hidden">
                          <Image
                            src={record.images.sort((a, b) => a.order - b.order)[0].image_url}
                            alt=""
                            width={0}
                            height={0}
                            sizes="(max-width: 768px) 100vw, 512px"
                            className="w-full h-auto"
                          />
                        </div>
                      </Link>
                    )}
                    <div className="px-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{record.poster_nickname}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(record.date)}</span>
                          {record.location && <span className="text-xs text-muted-foreground">{record.location}</span>}
                        </div>
                        {isOwn && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/record/${record.id}/edit`} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Link>
                            <button onClick={() => handleDelete(record.id)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </div>
                        )}
                      </div>
                      {record.content_preview && (
                        <p className="text-sm text-muted-foreground">{record.content_preview}</p>
                      )}
                      {record.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {record.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-primary">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-6">
              <Button variant="outline" size="sm" className="rounded-full" disabled={currentPage <= 1} onClick={() => loadData(currentPage - 1)}>이전</Button>
              <span className="text-sm text-muted-foreground px-3">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" className="rounded-full" disabled={currentPage >= totalPages} onClick={() => loadData(currentPage + 1)}>다음</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
