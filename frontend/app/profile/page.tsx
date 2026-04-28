'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  User,
  Pencil,
  Camera,
  Trash2,
} from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchRecordStats, fetchMe, updateProfile, uploadImages, type UserProfile } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const menuItems = [
  { icon: Bell, label: '포토북 주문 내역', href: '/photobook' },
  { icon: Globe, label: '언어', href: '/profile/language', value: '한국어' },
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
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [uniqueLocations, setUniqueLocations] = useState(0);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});

  // 편집 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [deleteAvatar, setDeleteAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMe().then(setProfile).catch(console.error);
    fetchRecordStats().then((data) => {
      setTotalRecords(data.total_records);
      setUniqueLocations(data.unique_locations);
      const cats: Record<string, number> = {};
      data.category_counts.forEach(({ category, count }: { category: string; count: number }) => {
        cats[category] = count;
      });
      setCategoryStats(cats);
    }).catch(console.error);
  }, []);

  const openEditModal = () => {
    setEditNickname(profile?.nickname ?? '');
    setAvatarPreview(null);
    setAvatarFile(null);
    setDeleteAvatar(false);
    setShowEditModal(true);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setDeleteAvatar(false);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setDeleteAvatar(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const urls = await uploadImages([avatarFile]);
        avatarUrl = urls[0];
      }

      const updated = await updateProfile({
        nickname: editNickname.trim() || undefined,
        avatar_url: avatarUrl,
        delete_avatar: deleteAvatar,
      });
      setProfile(updated);
      setShowEditModal(false);
    } catch {
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = deleteAvatar ? null : (avatarPreview ?? profile?.avatar_url ?? null);

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
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 bg-muted flex items-center justify-center flex-shrink-0">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="프로필" width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{profile?.nickname ?? '사용자'}</h2>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>서비스 이용 중</span>
                </div>
              </div>
              <button
                onClick={openEditModal}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-5 pt-5 border-t border-border">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="text-center bg-muted rounded-xl py-3">
                  <p className="text-2xl font-bold text-foreground">{totalRecords}</p>
                  <p className="text-sm text-muted-foreground">총 기록</p>
                </div>
                <div className="text-center bg-muted rounded-xl py-3">
                  <p className="text-2xl font-bold text-foreground">{uniqueLocations}</p>
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
                <Button size="sm" className="rounded-full" asChild>
                  <Link href="/photobook/new">시작하기</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-card rounded-2xl overflow-hidden">
            <button
              onClick={openEditModal}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-muted transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <Pencil className="h-5 w-5 text-muted-foreground" />
                <span className="text-foreground">프로필 편집</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
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
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            로그아웃
          </Button>
        </main>

        <BottomNav />
      </div>

      {/* 프로필 편집 모달 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">프로필 편집</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* 프로필 사진 */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 bg-muted flex items-center justify-center">
                  {currentAvatar ? (
                    <Image src={currentAvatar} alt="프로필" width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md"
                >
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary underline-offset-2 hover:underline"
                >
                  사진 변경
                </button>
                {(currentAvatar || profile?.avatar_url) && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <button
                      onClick={handleDeleteAvatar}
                      className="text-sm text-destructive underline-offset-2 hover:underline"
                    >
                      사진 삭제
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">닉네임</label>
              <Input
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="bg-muted border-0 rounded-xl h-12"
                maxLength={50}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-full h-12"
            >
              {saving ? '저장 중...' : '저장하기'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
