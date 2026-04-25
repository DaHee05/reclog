'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { TravelRecord, Category } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';

const categoryEmoji: Record<Category, string> = {
  travel: '✈️',
  performance: '🎤',
  romance: '💕',
  parenting: '👶',
  friendship: '🤝',
  daily: '📖',
};

interface RecordCardProps {
  record: TravelRecord;
  showCategory?: boolean;
}

export function RecordCard({ record, showCategory = true }: RecordCardProps) {
  const category = CATEGORIES[record.category];
  const formattedDate = new Date(record.date).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link href={`/record/${record.id}`}>
      <article className="bg-card rounded-2xl p-4 hover:shadow-sm transition-shadow">
        <div className="flex gap-3">
          {record.images[0] && (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={record.images[0]}
                alt={record.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {showCategory && (
                <span className="text-sm">{categoryEmoji[record.category]}</span>
              )}
              <h3 className="font-medium text-foreground truncate">
                {record.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{record.location}</span>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-1">{formattedDate}</p>
          </div>
          
          {/* Tag indicators as small circles */}
          {record.tags.length > 0 && (
            <div className="flex items-center -space-x-1">
              {record.tags.slice(0, 3).map((tag, i) => (
                <div
                  key={tag}
                  className="w-6 h-6 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center"
                  title={tag}
                >
                  <span className="text-[8px] text-primary font-bold">
                    {tag.replace('#', '').charAt(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
