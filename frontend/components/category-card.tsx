'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Category } from '@/lib/types';
import { fetchRecords } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const categoryConfig: Record<string, {
  label: string;
  description: string;
}> = {
  travel: {
    label: '여행',
    description: '새로운 곳에서의 추억',
  },
  daily: {
    label: '일상',
    description: '소소하지만 소중한 하루',
  },
};

interface CategoryCardProps {
  id: string;
  category: Category;
  count: number;
  recentImage: string | null;
  isDefault?: boolean;
  onEdit?: (id: string, name: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export function CategoryCard({ id, category, count, isDefault, onEdit, onDelete }: CategoryCardProps) {
  const config = categoryConfig[category] || { label: category, description: '나만의 기록' };
  const [recentImages, setRecentImages] = useState<string[]>([]);

  useEffect(() => {
    fetchRecords(category)
      .then((records) => {
        const imgs = records.items
          .filter((r) => r.images.length > 0)
          .slice(0, 3)
          .map((r) => r.images[0]);
        setRecentImages(imgs);
      })
      .catch(console.error);
  }, [category]);

  const hasImages = recentImages.length > 0;

  return (
    <div className="relative">
      <Link href={`/records/${category}`}>
        <div className="bg-card rounded-2xl p-6 flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5 border border-border/50">
          <div className="flex-1 pr-2">
            <h3 className="text-lg font-bold text-foreground">{config.label}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {hasImages ? (
              <div className="flex -space-x-2">
                {recentImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-card ring-2 ring-primary/20"
                    style={{ zIndex: recentImages.length - idx }}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </Link>

      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {onEdit && (
                <DropdownMenuItem
                  onClick={() => onEdit(id, config.label)}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  편집하기
                </DropdownMenuItem>
              )}
              {onDelete && !isDefault && (
                <DropdownMenuItem
                  onClick={() => onDelete(id, config.label)}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제하기
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
