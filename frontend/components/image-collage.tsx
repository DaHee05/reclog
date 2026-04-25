import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageCollageProps {
  images: string[];
  className?: string;
}

export function ImageCollage({ images, className }: ImageCollageProps) {
  const count = images.length;
  if (count === 0) return null;

  return (
    <div className={cn('relative aspect-square w-full rounded-2xl overflow-hidden', className)}>
      {count === 1 && (
        <Image src={images[0]} alt="" fill className="object-cover" />
      )}

      {count === 2 && (
        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
          {images.map((img, i) => (
            <div key={i} className="relative w-full h-full">
              <Image src={img} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {count === 3 && (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
          <div className="relative row-span-2">
            <Image src={images[0]} alt="" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src={images[1]} alt="" fill className="object-cover" />
          </div>
          <div className="relative">
            <Image src={images[2]} alt="" fill className="object-cover" />
          </div>
        </div>
      )}

      {count >= 4 && (
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
          {images.slice(0, 4).map((img, i) => (
            <div key={i} className="relative w-full h-full">
              <Image src={img} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
