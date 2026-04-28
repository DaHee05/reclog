'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { X, Calendar, MapPin, Star, Trash2, ImagePlus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { DEFAULT_TAGS } from '@/lib/types';
import { createRecord, uploadImages, generateOverlay } from '@/lib/api';
import { LocationSearch } from '@/components/location-search';

export default function NewRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('travel');
  const [saving, setSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');
  const [enableOverlay, setEnableOverlay] = useState(false);
  const [spaceId, setSpaceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== 'all') {
      setCategory(categoryParam);
    }
    const spaceIdParam = searchParams.get('spaceId');
    if (spaceIdParam) setSpaceId(spaceIdParam);
  }, [searchParams]);

  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const MAX_IMAGES = 4;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remaining = MAX_IMAGES - imageFiles.length;
      if (remaining <= 0) return;
      const newFiles = Array.from(files).slice(0, remaining);
      setImageFiles((prev) => [...prev, ...newFiles]);

      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagePreviews((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIndex >= imagePreviews.length - 1) {
      setPrimaryImageIndex(Math.max(0, imagePreviews.length - 2));
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag && !selectedTags.includes(`#${customTag}`)) {
      const formattedTag = customTag.startsWith('#') ? customTag : `#${customTag}`;
      setSelectedTags((prev) => [...prev, formattedTag]);
      setCustomTag('');
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      let imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        if (enableOverlay) {
          // 감성 메모 생성 모드: 각 이미지를 AI로 변환
          const tagsStr = selectedTags.length > 0 ? selectedTags.join(' ') : undefined;
          const urls: string[] = [];
          for (let i = 0; i < imageFiles.length; i++) {
            setSavingMessage(`감성 메모 생성 중... (${i + 1}/${imageFiles.length})`);
            const url = await generateOverlay(imageFiles[i], tagsStr);
            urls.push(url);
          }
          imageUrls = urls;
        } else {
          // 일반 업로드
          setSavingMessage('이미지 업로드 중...');
          imageUrls = await uploadImages(imageFiles);
        }
      }

      setSavingMessage('기록 저장 중...');
      await createRecord({
        content,
        location: location || undefined,
        category,
        date,
        tags: selectedTags,
        images: imageUrls.map((url, i) => ({
          image_url: url,
          is_primary: i === primaryImageIndex,
          order: i,
        })),
        space_id: spaceId,
      });

      router.push(spaceId ? `/spaces/${spaceId}` : '/');
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error && (e as Error & { status?: number }).status === 403) {
        router.push('/subscribe');
        return;
      }
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
      setSavingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - glass effect */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">새 기록</h1>
          <Button onClick={handleSave} size="sm" className="rounded-full px-5" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-6 pb-28">
        {/* Image Upload Section */}
        <div className="mb-6">
          <label className="block">
            <div className={cn(
              'relative overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200',
              imageFiles.length >= MAX_IMAGES
                ? 'border-muted cursor-not-allowed opacity-50'
                : 'border-border bg-gradient-to-br from-muted/50 to-card cursor-pointer hover:border-primary/40 hover:from-primary/5 hover:to-card'
            )}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={imageFiles.length >= MAX_IMAGES} />
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImagePlus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">사진 추가하기</p>
                <p className="text-xs text-muted-foreground">최대 {MAX_IMAGES}장 ({imageFiles.length}/{MAX_IMAGES})</p>
              </div>
            </div>
          </label>

          {imagePreviews.length > 0 && (
            <div className="mt-4 flex gap-2.5 overflow-x-auto pb-2">
              {imagePreviews.map((img, index) => (
                <div
                  key={index}
                  className={cn(
                    'relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all',
                    primaryImageIndex === index ? 'border-primary shadow-md shadow-primary/20' : 'border-transparent'
                  )}
                >
                  <Image src={img} alt={`업로드 이미지 ${index + 1}`} fill className="object-cover" />
                  <button
                    onClick={() => setPrimaryImageIndex(index)}
                    className={cn(
                      'absolute top-1 left-1 p-1 rounded-full transition-colors',
                      primaryImageIndex === index ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-muted-foreground'
                    )}
                  >
                    <Star className="h-3 w-3" />
                  </button>
                  <button onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Overlay Toggle */}
          {imageFiles.length > 0 && (
            <div className="mt-4 flex items-center justify-between bg-card border border-border/50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">감성 손글씨 메모</p>
                  <p className="text-xs text-muted-foreground">AI가 폴라로이드 스타일 메모를 그려요</p>
                </div>
              </div>
              <Switch checked={enableOverlay} onCheckedChange={setEnableOverlay} />
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5">
              <Calendar className="h-3.5 w-3.5" />날짜
            </label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-card border border-border/50 rounded-xl h-12 focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5">
              <MapPin className="h-3.5 w-3.5" />장소
            </label>
            <LocationSearch value={location} onChange={setLocation} />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5 block">내용</label>
            <Textarea placeholder="오늘 어땠나요?" value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="bg-card border border-border/50 rounded-xl resize-none focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5 block">해시태그</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-all',
                    selectedTags.includes(tag)
                      ? 'bg-foreground text-background'
                      : 'bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/20'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="태그 직접 입력" value={customTag} onChange={(e) => setCustomTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomTag()} className="bg-card border border-border/50 rounded-xl h-11 focus:border-primary transition-colors" />
              <Button variant="outline" onClick={addCustomTag} className="rounded-xl border-border/50">추가</Button>
            </div>
            {selectedTags.filter((tag) => !DEFAULT_TAGS.includes(tag)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedTags.filter((tag) => !DEFAULT_TAGS.includes(tag)).map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-full text-sm bg-accent text-accent-foreground flex items-center gap-1">
                    {tag}
                    <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Actions - glass effect */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border/50 p-5">
        <div className="max-w-lg mx-auto">
          {saving && savingMessage && (
            <div className="flex items-center justify-center gap-2 mb-3 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{savingMessage}</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full h-12 border-border/50" onClick={() => router.back()}>취소</Button>
            <Button className="flex-1 rounded-full h-12" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
