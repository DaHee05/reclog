'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, User } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { CategoryCard } from '@/components/category-card';
import { fetchCategories, createCategory } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CategoryData {
  id: string;
  name: string;
  emoji: string;
  is_default: boolean;
  record_count: number;
}

export default function HomePage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📝');

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        await createCategory(newCategoryName.trim(), newCategoryEmoji);
        const updated = await fetchCategories();
        setCategories(updated);
        setNewCategoryName('');
        setNewCategoryEmoji('📝');
        setShowCategoryModal(false);
      } catch (e) {
        console.error(e);
      }
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
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-border bg-card hover:bg-muted transition-colors"
              >
                <Plus className="h-5 w-5 text-foreground" />
              </button>
              <Link href="/profile" className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-primary/30 bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
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
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat.name as any}
              count={cat.record_count}
              recentImage={null}
            />
          ))}
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
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                이모지
              </label>
              <Input
                placeholder="📝"
                value={newCategoryEmoji}
                onChange={(e) => setNewCategoryEmoji(e.target.value)}
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
