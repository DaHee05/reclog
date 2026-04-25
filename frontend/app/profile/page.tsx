'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Bell,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  User,
} from 'lucide-react';
import type { Category } from '@/lib/types';
import { BottomNav } from '@/components/bottom-nav';
import { Button } from '@/components/ui/button';
import { fetchRecords } from '@/lib/api';
import type { TravelRecord } from '@/lib/types';

const menuItems = [
  { icon: Bell, label: '알림 설정', href: '/profile/notifications' },
  { icon: Globe, label: '언어', href: '/profile/language', value: '한국어' },
  { icon: HelpCircle, label: '도움말', href: '/profile/help' },
];

const categoryEmoji: Record<string, string> = {
  travel: '✈️',
  daily: '📖',
};

const categoryLabel: Record<string, string> = {
  travel: '여행',
  daily: '일상',
};

export default function ProfilePage() {
  const [records, setRecords] = useState<TravelRecord[]>([]);

  useEffect(() => {
    fetchRecords().then(setRecords).catch(console.error);
  }, []);

  const categoryStats: Record<string, number> = {};
  records.forEach((record) => {
    categoryStats[record.category] = (categoryStats[record.category] || 0) + 1;
  });

  const handleLogout = () => {
    alert('로그아웃 되었습니다.');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        <header className="px-5 pt-14 pb-6">
          <h1 className="text-2xl font-bold text-primary tracking-tight italic">내 정보</h1>
        </header>

        <main className="px-5 space-y-4">
          {/* Profile Card */}
          <div className="bg-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">테스트유저</h2>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>서비스 이용 중</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-border">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="text-center bg-muted rounded-xl py-3">
                  <p className="text-2xl font-bold text-foreground">{records.length}</p>
                  <p className="text-sm text-muted-foreground">총 기록</p>
                </div>
                <div className="text-center bg-muted rounded-xl py-3">
                  <p className="text-2xl font-bold text-foreground">{new Set(records.map((r) => r.location)).size}</p>
                  <p className="text-sm text-muted-foreground">방문 장소</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.keys(categoryEmoji).map((cat) => (
                  <div key={cat} className="text-center py-3 bg-muted/50 rounded-xl">
                    <span className="text-lg">{categoryEmoji[cat]}</span>
                    <p className="text-lg font-semibold text-foreground mt-1">{categoryStats[cat] || 0}</p>
                    <p className="text-xs text-muted-foreground">{categoryLabel[cat]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Photobook Banner */}
          <div className="bg-card rounded-2xl p-5 border-2 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">📚</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground">포토북 만들기</h3>
                <p className="text-sm text-muted-foreground mt-0.5 mb-3">쌓인 기록을 예쁜 포토북으로 만들어 보세요</p>
                <Button size="sm" className="rounded-full">시작하기</Button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-card rounded-2xl overflow-hidden">
            {menuItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-4 py-4 hover:bg-muted transition-colors ${index !== menuItems.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && <span className="text-sm text-muted-foreground">{item.value}</span>}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-2xl h-12"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            로그아웃
          </Button>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
