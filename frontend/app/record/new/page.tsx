'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { X, ImagePlus, Calendar, MapPin, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { DEFAULT_TAGS, type Category } from '@/lib/types';

const categoryOptions: { value: Category; label: string; emoji: string }[] = [
  { value: 'travel', label: '여행', emoji: '✈️' },
  { value: 'daily', label: '일상', emoji: '📖' },
];

export default function NewRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>('travel');

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== 'all' && categoryOptions.some(c => c.value === categoryParam)) {
      setCategory(categoryParam as Category);
    }
  }, [searchParams]);
  
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
            if (newImages.length === files.length) {
              setImages((prev) => [...prev, ...newImages]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIndex >= images.length - 1) {
      setPrimaryImageIndex(Math.max(0, images.length - 2));
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

  const handleSave = () => {
    alert('기록이 저장되었습니다!');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background px-5 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-card transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">새 기록</h1>
          <Button onClick={handleSave} size="sm" className="rounded-full px-4">
            저장
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pb-24">
        {/* Image Upload Section */}
        <div className="mb-5">
          <label className="block">
            <div className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm text-muted-foreground">
                탭하여 사진 추가하기
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                여러 장 선택 가능
              </p>
            </div>
          </label>

          {images.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={cn(
                    'relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2',
                    primaryImageIndex === index
                      ? 'border-primary'
                      : 'border-transparent'
                  )}
                >
                  <Image
                    src={img}
                    alt={`업로드 이미지 ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => setPrimaryImageIndex(index)}
                    className={cn(
                      'absolute top-1 left-1 p-1 rounded-full',
                      primaryImageIndex === index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background/80 text-muted-foreground'
                    )}
                  >
                    <Star className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              날짜
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-card border-0 rounded-xl h-12"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              카테고리
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all',
                    category === cat.value
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                      : 'bg-card text-foreground hover:bg-muted'
                  )}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              장소
            </label>
            <Input
              placeholder="장소를 입력하세요"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-card border-0 rounded-xl h-12"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              내용
            </label>
            <Textarea
              placeholder="오늘 어땠나요?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="bg-card border-0 rounded-xl resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              해시태그
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-all',
                    selectedTags.includes(tag)
                      ? 'bg-foreground text-background'
                      : 'bg-card text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="태그 직접 입력"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                className="bg-card border-0 rounded-xl h-11"
              />
              <Button variant="outline" onClick={addCustomTag} className="rounded-xl">
                추가
              </Button>
            </div>
            {selectedTags.filter((tag) => !DEFAULT_TAGS.includes(tag)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedTags
                  .filter((tag) => !DEFAULT_TAGS.includes(tag))
                  .map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-full text-sm bg-accent text-accent-foreground flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm p-5">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full h-12"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button className="flex-1 rounded-full h-12" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
