'use client';

import { useRouter } from 'next/navigation';
import { Check, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FREE_FEATURES = [
  '기록 작성 무제한',
  '캘린더 및 통계 보기',
  'AI 손글씨 하루 5회',
];

const PRO_FEATURES = [
  '기록 작성 무제한',
  '캘린더 및 통계 보기',
  'AI 손글씨 무제한',
  '포토북 제작 할인 10%',
  '광고 없음',
];

export default function SubscribePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-5 pb-16">
        <header className="pt-14 pb-6 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-card transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-primary tracking-tight">구독</h1>
        </header>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">더 많은 기능을 사용해보세요</h2>
          <p className="text-sm text-muted-foreground">AI 손글씨 기능의 일일 한도를 초과했습니다</p>
        </div>

        <div className="grid gap-4">
          {/* 무료 플랜 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-border shadow-sm shadow-stone-200/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">무료</h3>
              <span className="text-2xl font-bold text-foreground">₩0</span>
            </div>
            <ul className="space-y-2">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full mt-5 rounded-xl" disabled>
              현재 플랜
            </Button>
          </div>

          {/* 프로 플랜 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border-2 border-primary relative shadow-md shadow-primary/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">추천</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Pro</h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">₩4,900</span>
                <span className="text-sm text-muted-foreground"> / 월</span>
              </div>
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="w-full mt-5 rounded-xl" disabled>
              준비 중
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
