'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MoreVertical,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { fetchRecord, deleteRecord } from '@/lib/api';
import type { TravelRecord } from '@/lib/types';

export default function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [record, setRecord] = useState<TravelRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecord(id)
      .then(setRecord)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-muted-foreground mb-4">기록을 찾을 수 없습니다</p>
          <Button onClick={() => router.push('/')} className="rounded-full">홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(record.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const handleDelete = async () => {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      try {
        await deleteRecord(id);
        router.push('/');
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm px-5 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href={`/record/${id}/edit`} className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" />
                    편집하기
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  삭제하기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Image Gallery */}
        {record.images.length > 0 && (
          <div className="px-5 mb-5">
            <div
              className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={(e) => {
                const target = e.currentTarget;
                // 스크롤 위치에 따라 현재 보이는 이미지 인덱스 계산
                const index = Math.round(target.scrollLeft / target.clientWidth);
                if (index !== currentImageIndex) {
                  setCurrentImageIndex(index);
                }
              }}
            >
              {record.images.map((src, index) => (
                <div key={index} className="flex-none w-full snap-center">
                  <Image
                    src={src}
                    alt={`기록 이미지 ${index + 1}`}
                    width={0}
                    height={0}
                    sizes="(max-width: 768px) 100vw, 512px"
                    className="w-full h-auto"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            {record.images.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {record.images.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors duration-300',
                      currentImageIndex === index ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <main className="px-5 pt-2">
          {/* Pseudo-Author & Location */}
          <div className="mb-2 flex items-center gap-1.5">
            <span className="font-semibold text-[14px] text-foreground">
              {record.category}
            </span>
            {record.location && (
              <>
                <span className="text-[14px] text-muted-foreground">·</span>
                <span className="text-[14px] text-foreground">{record.location}</span>
              </>
            )}
          </div>

          {/* Body */}
          <div className="mb-1">
            <p className="text-[14px] text-foreground leading-[1.6] whitespace-pre-wrap">
              {record.content}
            </p>
          </div>

          {/* Hashtags */}
          {record.tags.length > 0 && (
            <div className="flex flex-wrap gap-x-1.5 mb-3">
              {record.tags.map((tag) => (
                <span key={tag} className="text-[14px] text-primary/80 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Date */}
          <div className="text-[11px] text-muted-foreground mb-8 uppercase tracking-wider">
            {formattedDate}
          </div>
        </main>

        {/* Bottom Action */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-5">
          <div className="max-w-lg mx-auto">
            <Button asChild className="w-full rounded-full h-12">
              <Link href={`/record/${id}/edit`}>편집하기</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
