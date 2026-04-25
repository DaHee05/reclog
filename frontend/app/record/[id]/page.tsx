'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  MoreVertical,
  MapPin,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { dummyRecords } from '@/lib/dummy-data';
import type { Category } from '@/lib/types';

const categoryEmoji: Record<Category, string> = {
  travel: '✈️',
  daily: '📖',
};

export default function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const record = dummyRecords.find((r) => r.id === id);

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

  const handleDelete = () => {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      router.push('/');
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === record.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? record.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background px-5 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card transition-colors"
            >
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
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive flex items-center gap-2"
                >
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
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={record.images[currentImageIndex]}
                alt={`기록 이미지 ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 512px"
                priority
              />

              {record.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Image Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {record.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          currentImageIndex === index
                            ? 'bg-primary'
                            : 'bg-background/60'
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      {/* Content */}
        <main className="px-5">
          {/* Category & Date */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{categoryEmoji[record.category]}</span>
            <span className="text-sm text-muted-foreground">{formattedDate}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground mb-5">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{record.location}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {record.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm text-primary bg-card px-3 py-1.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="bg-card rounded-2xl p-5">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {record.content}
            </p>
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
