import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageCollageProps {
  images: string[];
  className?: string;
}

export function ImageCollage({ images, className }: ImageCollageProps) {
  if (images.length === 0) return null;

  return (
    <div 
      className={cn(
        'flex overflow-x-auto snap-x snap-mandatory rounded-2xl gap-2 [&::-webkit-scrollbar]:hidden w-full',
        className
      )}
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
  );
}
