'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPhotobook, fetchCategories, fetchMySpaces } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { SharedSpace } from '@/lib/api';

interface CategoryData {
  id: string;
  name: string;
  emoji: string;
}

type SelectionType = { kind: 'category'; id: string; name: string; emoji: string } | { kind: 'space'; id: string; name: string; emoji: string };

export default function NewPhotobookPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [selection, setSelection] = useState<SelectionType | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchMySpaces()])
      .then(([cats, sps]) => {
        setCategories(cats);
        setSpaces(sps);
        if (cats.length > 0) {
          setSelection({ kind: 'category', id: cats[0].id, name: cats[0].name, emoji: cats[0].emoji });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('포토북 제목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPhotobook({
        title,
        category: selection?.kind === 'category' ? selection.name : undefined,
        space_id: selection?.kind === 'space' ? selection.id : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      router.push('/photobook');
    } catch (error) {
      console.error(error);
      alert('주문 생성에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  const selectionLabel = selection
    ? `${selection.emoji} ${selection.name}${selection.kind === 'space' ? ' (공유)' : ''}`
    : '선택';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">포토북 만들기</h1>
          </div>
        </header>

        <main className="px-5 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Category / Space Selection */}
            <section className="space-y-3">
              <label className="text-sm font-semibold text-foreground">어떤 카테고리를 담을까요?</label>
              {loading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-4 h-12 bg-card rounded-xl border border-border hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{selectionLabel}</span>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', dropdownOpen && 'rotate-180')} />
                  </button>

                  {dropdownOpen && (
                    <div className="mt-1 bg-card border border-border rounded-xl overflow-hidden shadow-md max-h-64 overflow-y-auto">
                      {categories.length > 0 && (
                        <>
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">개인 카테고리</div>
                          {categories.map((cat) => {
                            const isSelected = selection?.kind === 'category' && selection.id === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => { setSelection({ kind: 'category', id: cat.id, name: cat.name, emoji: cat.emoji }); setDropdownOpen(false); }}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0"
                              >
                                <span className="text-sm text-foreground">{cat.emoji} {cat.name}</span>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            );
                          })}
                        </>
                      )}
                      {spaces.length > 0 && (
                        <>
                          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50">공유 스페이스</div>
                          {spaces.map((space) => {
                            const isSelected = selection?.kind === 'space' && selection.id === space.id;
                            return (
                              <button
                                key={space.id}
                                type="button"
                                onClick={() => { setSelection({ kind: 'space', id: space.id, name: space.category_name, emoji: space.category_emoji }); setDropdownOpen(false); }}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0"
                              >
                                <div className="text-left">
                                  <span className="text-sm text-foreground">{space.category_emoji} {space.category_name}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">멤버 {space.member_count}명</span>
                                </div>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Date Range Selection */}
            <section className="space-y-3">
              <label className="text-sm font-semibold text-foreground">기록 기간 선택 (선택사항)</label>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-card rounded-xl h-12"
                />
                <span className="text-muted-foreground">~</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-card rounded-xl h-12"
                />
              </div>
            </section>

            {/* Title Input */}
            <section className="space-y-3">
              <label className="text-sm font-semibold text-foreground">포토북 제목</label>
              <Input
                placeholder="예: 2026년 봄 제주도 여행기"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-card rounded-xl h-14 text-base"
                maxLength={40}
              />
            </section>

            {/* Submit Banner */}
            <div className="bg-primary/10 rounded-2xl p-5 mt-8 text-center border border-primary/20">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1">소중한 추억을 책으로</h3>
              <p className="text-sm text-muted-foreground mb-4">입력하신 정보로 포토북 주문이 등록됩니다.<br/>결제나 실제 배송은 이루어지지 않습니다.</p>
              <Button type="submit" disabled={isSubmitting || !selection} className="w-full rounded-full h-12 font-bold">
                {isSubmitting ? '요청 중...' : '포토북 주문하기'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
