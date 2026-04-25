'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Plus, ChevronDown, List, Grid3X3, Search, Users, Copy, Check, X } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { ImageCollage } from '@/components/image-collage';
import { fetchRecords } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Category, TravelRecord } from '@/lib/types';

const categoryConfig: Record<Category | 'all', { label: string; emoji: string }> = {
  all: { label: '전체 기록', emoji: '' },
  travel: { label: '여행', emoji: '' },
  daily: { label: '일상', emoji: '' },
};

const VIEW_TABS = [
  { id: 'feed', label: '피드', icon: List },
  { id: 'calendar', label: '달력', icon: Grid3X3 },
];

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function getYearMonth(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear().toString().slice(2)}년 ${date.getMonth() + 1}월`;
}

// Calendar Component
function CalendarView({ records, category }: { records: TravelRecord[]; category: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const recordsByDate: Record<number, TravelRecord[]> = {};
  records.forEach((record) => {
    const recordDate = new Date(record.date);
    if (recordDate.getFullYear() === year && recordDate.getMonth() === month) {
      const day = recordDate.getDate();
      if (!recordsByDate[day]) recordsByDate[day] = [];
      recordsByDate[day].push(record);
    }
  });

  const days = [];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayRecords = recordsByDate[day] || [];
    const hasRecords = dayRecords.length > 0;
    const firstRecord = dayRecords[0];

    days.push(
      <div key={day} className="aspect-square relative">
        {hasRecords && firstRecord?.images[0] ? (
          <Link href={`/record/${firstRecord.id}`} className="block w-full h-full relative group">
            <Image src={firstRecord.images[0]} alt="" fill className="object-cover" />
            {dayRecords.length > 1 && (
              <div className="absolute top-1 right-1 bg-foreground/70 text-background text-xs px-1.5 py-0.5 rounded">
                +{dayRecords.length - 1}
              </div>
            )}
          </Link>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className={cn(
              "text-sm",
              hasRecords ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {day}
            </span>
          </div>
        )}
      </div>
    );
  }

  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div>
      <div className="flex items-center justify-between px-2 mb-4">
        <button onClick={goToPreviousMonth} className="p-2 text-muted-foreground hover:text-foreground">
          <ChevronDown className="h-5 w-5 rotate-90" />
        </button>
        <span className="font-bold text-lg">
          {year.toString().slice(2)}년 {month + 1}월
        </span>
        <button onClick={goToNextMonth} className="p-2 text-muted-foreground hover:text-foreground">
          <ChevronDown className="h-5 w-5 -rotate-90" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm text-muted-foreground py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 bg-border">
        {days.map((day, index) => (
          <div key={index} className="bg-background">{day}</div>
        ))}
      </div>
    </div>
  );
}

// Feed View Component
function FeedView({ records }: { records: TravelRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">아직 기록이 없어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {records.map((record) => (
        <Link key={record.id} href={`/record/${record.id}`} className="block group">
          {record.images.length > 0 && (
            <div className="mb-3">
              <ImageCollage images={record.images} />
            </div>
          )}
          <div className="px-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{formatDate(record.date)}</span>
              <span className="text-xs text-muted-foreground">{record.location}</span>
            </div>
            {record.contentPreview && (
              <p className="text-sm text-muted-foreground">
                {record.contentPreview}
              </p>
            )}
            {record.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {record.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs text-primary">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function CategoryRecordsPage() {
  const params = useParams();
  const categoryParam = params.category as string;
  const category = categoryParam as Category | 'all';

  const [viewType, setViewType] = useState<'feed' | 'calendar'>('feed');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<TravelRecord[]>([]);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareTab, setShareTab] = useState<'create' | 'join'>('create');

  useEffect(() => {
    fetchRecords(category !== 'all' ? category : undefined)
      .then(setRecords)
      .catch(console.error);
  }, [category]);

  const handleGenerateCode = () => setShareCode(generateShareCode());

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinWithCode = () => {
    if (joinCode.trim().length === 6) {
      alert(`코드 "${joinCode}"로 공유 공간에 참여했습니다!`);
      setJoinCode('');
      setShowShareModal(false);
    }
  };

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((record) =>
        record.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        record.content.toLowerCase().includes(query)
      );
    }
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }, [records, searchQuery]);

  const yearMonth = filteredRecords[0] ? getYearMonth(filteredRecords[0].date) : getYearMonth(new Date().toISOString());

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground flex items-center gap-1">
                  {yearMonth}
                  <ChevronDown className="h-5 w-5" />
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSearch(!showSearch)} className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card hover:bg-muted transition-colors">
                  <Search className="h-5 w-5 text-foreground" />
                </button>
                <button onClick={() => setShowShareModal(true)} className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card hover:bg-muted transition-colors">
                  <Users className="h-5 w-5 text-foreground" />
                </button>
                <Link href={`/record/new?category=${category}`} className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card hover:bg-muted transition-colors">
                  <Plus className="h-5 w-5 text-foreground" />
                </Link>
              </div>
            </div>

            {showSearch && (
              <div className="mb-4 relative">
                <Input
                  placeholder="해시태그 또는 내용으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted border-0 rounded-xl h-11 pr-10"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {VIEW_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setViewType(tab.id as 'feed' | 'calendar')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
                      viewType === tab.id
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={cn(viewType === 'feed' ? 'px-4 py-4' : '')}>
          {viewType === 'feed' ? (
            <FeedView records={filteredRecords} />
          ) : (
            <CalendarView records={filteredRecords} category={category} />
          )}
        </main>

        <BottomNav />
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">친구와 공유하기</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button onClick={() => setShareTab('create')} className={cn('flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all', shareTab === 'create' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
              코드 생성
            </button>
            <button onClick={() => setShareTab('join')} className={cn('flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all', shareTab === 'join' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
              코드 입력
            </button>
          </div>

          {shareTab === 'create' ? (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground text-center">
                코드를 생성하여 친구에게 공유하세요.<br />코드를 가진 사람은 기록을 보고 작성할 수 있습니다.
              </p>
              {shareCode ? (
                <div className="space-y-3">
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold tracking-widest text-primary">{shareCode}</p>
                  </div>
                  <Button onClick={handleCopyCode} variant="outline" className="w-full rounded-full h-12 gap-2">
                    {copied ? (<><Check className="h-4 w-4" />복사됨!</>) : (<><Copy className="h-4 w-4" />코드 복사하기</>)}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleGenerateCode} className="w-full rounded-full h-12">공유 코드 생성하기</Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground text-center">
                친구에게 받은 6자리 코드를 입력하세요.<br />공유 공간에 참여하여 함께 기록할 수 있습니다.
              </p>
              <Input placeholder="코드 6자리 입력" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} className="bg-muted border-0 rounded-xl h-14 text-center text-2xl tracking-widest font-bold" />
              <Button onClick={handleJoinWithCode} disabled={joinCode.length !== 6} className="w-full rounded-full h-12">참여하기</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
