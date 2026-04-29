'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Calendar, MapPin, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { type Category } from '@/lib/types';
import { fetchRecord, updateRecord, uploadImages, fetchCategories } from '@/lib/api';

interface CategoryOption { id: string; name: string; }

export default function EditRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 기존 서버 이미지 URL (이미 업로드된 것)
  const [existingImages, setExistingImages] = useState<
    { url: string; isPrimary: boolean; order: number }[]
  >([]);
  // 새로 추가한 파일
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<string>('');
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  // 기존 데이터 + 카테고리 목록 불러오기
  useEffect(() => {
    fetchCategories().then((cats) => setCategoryOptions(cats.map((c) => ({ id: c.id, name: c.name })))).catch(console.error);
    fetchRecord(id)
      .then((record) => {
        if (!record) {
          router.replace('/');
          return;
        }
        setDate(record.date.split('T')[0]);
        setCategory(record.category as Category);
        setLocation(record.location ?? '');
        setContent(record.content);
        setSelectedTags(record.tags);

        // 기존 이미지 세팅
        setExistingImages(
          record.images.map((url, i) => ({ url, isPrimary: i === 0, order: i }))
        );
        setPrimaryIndex(0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, router]);

  // --- 전체 이미지 목록 (기존 + 새 파일) ---
  const MAX_IMAGES = 4;
  const totalCount = existingImages.length + newImagePreviews.length;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remaining = MAX_IMAGES - totalCount;
      if (remaining <= 0) return;
      const added = Array.from(files).slice(0, remaining);
      setNewImageFiles((prev) => [...prev, ...added]);

      added.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setNewImagePreviews((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (globalIndex: number) => {
    if (globalIndex < existingImages.length) {
      setExistingImages((prev) => prev.filter((_, i) => i !== globalIndex));
    } else {
      const newIndex = globalIndex - existingImages.length;
      setNewImageFiles((prev) => prev.filter((_, i) => i !== newIndex));
      setNewImagePreviews((prev) => prev.filter((_, i) => i !== newIndex));
    }
    if (primaryIndex >= totalCount - 1) {
      setPrimaryIndex(Math.max(0, totalCount - 2));
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
      // 1. 새 이미지 업로드
      let newUrls: string[] = [];
      if (newImageFiles.length > 0) {
        newUrls = await uploadImages(newImageFiles);
      }

      // 2. 기존 이미지 URL + 새 이미지 URL 합치기
      const allUrls = [
        ...existingImages.map((img) => img.url),
        ...newUrls,
      ];

      // 3. 업데이트
      await updateRecord(id, {
        content,
        location,
        category,
        date,
        tags: selectedTags,
        images: allUrls.map((url, i) => ({
          image_url: url,
          is_primary: i === primaryIndex,
          order: i,
        })),
      });

      router.push(`/record/${id}`);
    } catch (e) {
      console.error(e);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  // 이미지 미리보기 목록 (기존 URL + 새 파일 프리뷰)
  const allPreviews = [
    ...existingImages.map((img) => img.url),
    ...newImagePreviews,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => router.back()} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
          <Button onClick={handleSave} size="sm" className="rounded-full px-5" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pb-24">
        {/* Image Upload Section */}
        <div className="mb-5">
          <label className="block">
            <div className={cn(
              'bg-card border-2 border-dashed rounded-2xl p-8 text-center transition-colors',
              totalCount >= MAX_IMAGES
                ? 'border-muted cursor-not-allowed opacity-50'
                : 'border-border cursor-pointer hover:border-primary/50'
            )}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={totalCount >= MAX_IMAGES} />
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm text-muted-foreground">탭하여 사진 추가하기</p>
              <p className="text-xs text-muted-foreground mt-1">최대 {MAX_IMAGES}장 ({totalCount}/{MAX_IMAGES})</p>
            </div>
          </label>

          {allPreviews.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {allPreviews.map((img, index) => (
                <div
                  key={index}
                  className={cn(
                    'relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2',
                    primaryIndex === index ? 'border-primary' : 'border-transparent'
                  )}
                >
                  <Image src={img} alt={`이미지 ${index + 1}`} fill className="object-cover" />
                  <button
                    onClick={() => setPrimaryIndex(index)}
                    className={cn(
                      'absolute top-1 left-1 p-1 rounded-full',
                      primaryIndex === index ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-muted-foreground'
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
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />날짜
            </label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-card border-0 rounded-xl h-12" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                    category === cat.name
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />장소
            </label>
            <Input placeholder="장소를 입력하세요" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-card border-0 rounded-xl h-12" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">내용</label>
            <Textarea placeholder="오늘 어땠나요?" value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="bg-card border-0 rounded-xl resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">해시태그</label>
            <div className="flex gap-2">
              <Input placeholder="태그 직접 입력" value={customTag} onChange={(e) => setCustomTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustomTag()} className="bg-card border-0 rounded-xl h-11" />
              <Button variant="outline" onClick={addCustomTag} className="rounded-xl">추가</Button>
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedTags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-full text-sm bg-accent text-accent-foreground flex items-center gap-1">
                    {tag}
                    <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-5">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full h-12" onClick={() => router.back()}>취소</Button>
            <Button className="flex-1 rounded-full h-12" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
