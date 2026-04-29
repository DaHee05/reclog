import { cn } from '@/lib/utils';

interface ImageCollageProps {
  images: string[];
  className?: string;
}

export function ImageCollage({ images, className }: ImageCollageProps) {
  if (images.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      <div
        className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl gap-2 [&::-webkit-scrollbar]:hidden w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((src, index) => (
          <div key={index} className="relative flex-none w-full snap-center rounded-2xl overflow-hidden leading-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Image ${index + 1}`}
              className="w-full h-auto object-contain"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          {images.length}
        </div>
      )}
    </div>
  );
}
