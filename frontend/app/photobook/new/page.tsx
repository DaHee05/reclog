'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPhotobook } from '@/lib/api';

const categories = [
  { id: 'travel', label: '여행', emoji: '✈️' },
  { id: 'daily', label: '일상', emoji: '📖' },
];

export default function NewPhotobookPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('travel');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        category,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground">포토북 만들기</h1>
          </div>
        </header>

        <main className="px-5 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Category Selection */}
            <section className="space-y-3">
              <label className="text-sm font-semibold text-foreground">어떤 기록을 모아볼까요?</label>
              <div className="flex gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${
                      category === cat.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-muted'
                    }`}
                  >
                    <span className="text-2xl mb-1">{cat.emoji}</span>
                    <span className={`text-sm font-medium ${category === cat.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      {cat.label} 기록
                    </span>
                  </button>
                ))}
              </div>
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
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-full h-12 font-bold">
                {isSubmitting ? '요청 중...' : '포토북 주문하기'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
