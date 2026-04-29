'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Plus, ArrowLeft, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { ImageCollage } from '@/components/image-collage';
import { fetchRecords } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { Category, TravelRecord } from '@/lib/types';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function FeedView({ records }: { records: TravelRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">아직 기록이 없어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {records.map((record) => (
        <Link key={record.id} href={`/record/${record.id}`} className="block group">
          {record.images.length > 0 && (
            <div className="mb-3">
              <ImageCollage images={record.images} />
            </div>
          )}
          <div className="px-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{formatDate(record.date)}</span>
              <span className="text-xs text-muted-foreground">{record.location}</span>
            </div>
            {record.contentPreview && (
              <p className="text-sm text-muted-foreground">
                {record.contentPreview}
              </p>
            )}
            {record.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {record.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs text-primary">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function CategoryRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryParam = decodeURIComponent(params.category as string);
  const category = categoryParam as Category | 'all';

  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadRecords = async (page = 1) => {
    setRecordsLoading(true);
    setRecordsError('');
    try {
      const data = await fetchRecords(category !== 'all' ? category : undefined, page, 5);
      setRecords(data.items);
      setCurrentPage(data.page);
      setTotalPages(data.total_pages);
    } catch {
      setRecordsError('기록을 불러오지 못했습니다.');
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadRecords(1);
  }, [category]);

  const displayName = category === 'all' ? '전체 기록' : category;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold text-foreground">{displayName}</h1>
            </div>
            <Link
              href={`/record/new?category=${encodeURIComponent(category)}`}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card hover:bg-muted transition-colors"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="px-4 py-4">
          {recordsLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {recordsError && (
            <div className="bg-destructive/10 rounded-2xl p-5 text-center">
              <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive mb-3">{recordsError}</p>
              <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => loadRecords()}>
                <RefreshCw className="h-3.5 w-3.5" />다시 시도
              </Button>
            </div>
          )}

          {!recordsLoading && !recordsError && (
            <FeedView records={records} />
          )}

          {!recordsLoading && !recordsError && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={currentPage <= 1}
                onClick={() => loadRecords(currentPage - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={currentPage >= totalPages}
                onClick={() => loadRecords(currentPage + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
