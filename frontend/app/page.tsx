'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { CategoryCard } from '@/components/category-card';
import { dummyRecords, userProfile } from '@/lib/dummy-data';
import type { Category } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function getCategoryStats() {
  const stats: Record<Category, number> = {
    travel: 0,
    daily: 0,
  };
  
  dummyRecords.forEach((record) => {
    stats[record.category]++;
  });
  
  return stats;
}

function getCategoryRecentImage(category: Category): string | null {
  const record = dummyRecords.find((r) => r.category === category && r.images.length > 0);
  return record?.images[0] || null;
}

export default function HomePage() {
  const categoryStats = getCategoryStats();
  const categories: Category[] = ['travel', 'daily'];
  
  // Category creation modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      alert(`"${newCategoryName}" 카테고리가 생성되었습니다!`);
      setNewCategoryName('');
      setShowCategoryModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        <header className="px-5 pt-14 pb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary tracking-tight italic">LOG</h1>
            <div className="flex items-center gap-3">
              {/* Add Category button */}
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-border bg-card hover:bg-muted transition-colors"
              >
                <Plus className="h-5 w-5 text-foreground" />
              </button>
              <Link href="/profile" className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-primary/30">
                <Image
                  src={userProfile.profileImage}
                  alt={userProfile.name}
                  fill
                  className="object-cover"
                />
              </Link>
            </div>
          </div>
        </header>

        {/* Tip Banner */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-medium">
              :)
            </span>
            <span>기록을 눌러 자세히 보기</span>
            <span className="text-muted-foreground/50">{'>'}</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-5 space-y-5">
          {categories.map((category) => {
            const count = categoryStats[category];
            const recentImage = getCategoryRecentImage(category);
            
            return (
              <CategoryCard
                key={category}
                category={category}
                count={count}
                recentImage={recentImage}
              />
            );
          })}
        </main>

        <BottomNav />
      </div>

      {/* Category Creation Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">새 카테고리 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                카테고리 이름
              </label>
              <Input
                placeholder="예: 맛집, 운동, 독서..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-muted border-0 rounded-xl h-12"
              />
            </div>

            <Button 
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim()}
              className="w-full rounded-full h-12"
            >
              카테고리 만들기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
