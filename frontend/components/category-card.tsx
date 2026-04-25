'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import type { Category } from '@/lib/types';
import { dummyRecords } from '@/lib/dummy-data';

// Category config for labels and descriptions
const categoryConfig: Record<Category, { 
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
  category: Category;
  count: number;
  recentImage: string | null;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const config = categoryConfig[category];
  
  // Get recent images for this category (up to 3)
  const recentImages = dummyRecords
    .filter((r) => r.category === category && r.images.length > 0)
    .slice(0, 3)
    .map((r) => r.images[0]);

  const hasImages = recentImages.length > 0;
  
  return (
    <Link href={`/records/${category}`}>
      <div className="bg-card rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5 border border-border/50">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground">{config.label}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasImages ? (
            // Show recent images as small circles when photos exist
            <div className="flex -space-x-2">
              {recentImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-card ring-2 ring-primary/20"
                  style={{ zIndex: recentImages.length - idx }}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            // Show default icon when no photos
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
