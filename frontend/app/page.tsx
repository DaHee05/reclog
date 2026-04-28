'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, User, AlertCircle, RefreshCw, Users, Copy, Check } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { CategoryCard } from '@/components/category-card';
import { fetchCategories, createCategory, updateCategory, deleteCategory, fetchMySpaces, createSharedSpace, joinSharedSpace, type SharedSpace } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CategoryData {
  id: string;
  name: string;
  emoji: string;
  is_default: boolean;
  record_count: number;
}

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [spaces, setSpaces] = useState<SharedSpace[]>([]);

  // 카테고리 생성 모달
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // 카테고리 편집 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; emoji: string; isDefault: boolean } | null>(null);
  const [editName, setEditName] = useState('');

  // 공유 공간 모달
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<'create' | 'join'>('create');
  // 코드 생성
  const [spaceCategoryName, setSpaceCategoryName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  // 코드 입력
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [catData, spaceData] = await Promise.all([fetchCategories(), fetchMySpaces()]);
      setCategories(catData);
      setSpaces(spaceData);
    } catch {
      setError('불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenEdit = (id: string, name: string) => {
    const cat = categories.find((c) => c.id === id);
    setEditTarget({ id, name, emoji: '', isDefault: cat?.is_default ?? false });
    setEditName(name);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editTarget || editTarget.isDefault) return;
    try {
      await updateCategory(editTarget.id, editName.trim() || undefined);
      await loadData();
      setShowEditModal(false);
    } catch {
      alert('편집에 실패했습니다.');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?\n해당 카테고리의 기록은 삭제되지 않습니다.`)) return;
    try {
      await deleteCategory(id);
      await loadData();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategory(newCategoryName.trim());
      const updated = await fetchCategories();
      setCategories(updated);
      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSpace = async () => {
    if (!spaceCategoryName.trim()) return;
    setCreateLoading(true);
    try {
      const space = await createSharedSpace(spaceCategoryName.trim(), '📝');
      setGeneratedCode(space.code);
      setSpaces((prev) => [...prev, space]);
    } catch {
      alert('코드 생성에 실패했습니다.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSpace = async () => {
    if (joinCode.length !== 6) return;
    setJoinLoading(true);
    setJoinError('');
    try {
      const space = await joinSharedSpace(joinCode);
      setShowShareModal(false);
      setJoinCode('');
      router.push(`/spaces/${space.id}`);
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      if (err.status === 404) setJoinError('존재하지 않는 코드입니다.');
      else if (err.status === 409) setJoinError('이미 참여한 공유 카테고리입니다.');
      else setJoinError('참여에 실패했습니다.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCloseShareModal = (open: boolean) => {
    setShowShareModal(open);
    if (!open) {
      setGeneratedCode('');
      setSpaceCategoryName('');
      setJoinCode('');
      setJoinError('');
      setShareTab('create');
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
                onClick={() => setShowShareModal(true)}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-border bg-card hover:bg-muted transition-colors"
              >
                <Users className="h-5 w-5 text-foreground" />
              </button>
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
          {loading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-5 animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 rounded-2xl p-5 text-center">
              <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive mb-3">{error}</p>
              <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={loadData}>
                <RefreshCw className="h-3.5 w-3.5" />다시 시도
              </Button>
            </div>
          )}

          {!loading && !error && spaces.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">공유 카테고리</p>
              {spaces.map((space) => (
                <Link key={space.id} href={`/spaces/${space.id}`}>
                  <div className="bg-card rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all hover:-translate-y-0.5 border border-border/50">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{space.category_emoji} {space.category_name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{space.member_count}명이 함께 기록 중</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  id={cat.id}
                  category={cat.name as any}
                  count={cat.record_count}
                  recentImage={null}
                  isDefault={cat.is_default}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteCategory}
                />
              ))}
            </div>
          )}
        </main>

        <BottomNav />
      </div>

      {/* 공유 공간 모달 */}
      <Dialog open={showShareModal} onOpenChange={handleCloseShareModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">공유 카테고리</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setShareTab('create')}
              className={cn('flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all', shareTab === 'create' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              코드 생성
            </button>
            <button
              onClick={() => setShareTab('join')}
              className={cn('flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all', shareTab === 'join' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              코드 입력
            </button>
          </div>

          {shareTab === 'create' ? (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground text-center">
                공유할 카테고리 이름을 입력하고 코드를 생성하세요.<br />코드를 받은 친구가 함께 기록할 수 있어요.
              </p>
              {generatedCode ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">"{spaceCategoryName}" 공유 코드</p>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold tracking-widest text-primary">{generatedCode}</p>
                  </div>
                  <Button onClick={handleCopyCode} variant="outline" className="w-full rounded-full h-12 gap-2">
                    {copied ? (<><Check className="h-4 w-4" />복사됨!</>) : (<><Copy className="h-4 w-4" />코드 복사하기</>)}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="카테고리 이름 (예: 제주도 여행, 일상)"
                    value={spaceCategoryName}
                    onChange={(e) => setSpaceCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSpace()}
                    className="bg-muted border-0 rounded-xl h-12"
                  />
                  <Button
                    onClick={handleCreateSpace}
                    disabled={!spaceCategoryName.trim() || createLoading}
                    className="w-full rounded-full h-12"
                  >
                    {createLoading ? '생성 중...' : '공유 코드 생성하기'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground text-center">
                친구에게 받은 6자리 코드를 입력하세요.<br />공유 카테고리에 참여하여 함께 기록할 수 있습니다.
              </p>
              <Input
                placeholder="코드 6자리 입력"
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinSpace()}
                maxLength={6}
                className="bg-muted border-0 rounded-xl h-14 text-center text-2xl tracking-widest font-bold"
              />
              {joinError && <p className="text-sm text-destructive text-center">{joinError}</p>}
              <Button
                onClick={handleJoinSpace}
                disabled={joinCode.length !== 6 || joinLoading}
                className="w-full rounded-full h-12"
              >
                {joinLoading ? '참여 중...' : '참여하기'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 카테고리 편집 모달 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">카테고리 편집</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
              className="bg-muted border-0 rounded-xl h-12"
            />
            <Button onClick={handleEditSave} disabled={!editName.trim()} className="w-full rounded-full h-12">
              저장하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 카테고리 생성 모달 */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">새 카테고리 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="예: 맛집, 운동, 독서..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
              className="bg-muted border-0 rounded-xl h-12"
            />
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
