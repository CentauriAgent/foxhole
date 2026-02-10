import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2 } from 'lucide-react';

export interface UploadedImage {
  url: string;
  mimeType: string;
  dimensions?: { width: number; height: number };
}

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  images: UploadedImage[];
  compact?: boolean;
  disabled?: boolean;
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp';

export function ImageUpload({ onImagesChange, images, compact, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const dims = await getImageDimensions(file);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('https://nostr.build/api/v2/upload/files', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const data = await res.json();
      const uploaded = data?.data?.[0];
      if (!uploaded?.url) throw new Error('No URL in response');

      const newImage: UploadedImage = {
        url: uploaded.url,
        mimeType: file.type,
        dimensions: dims.width ? dims : undefined,
      };

      onImagesChange([...images, newImage]);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [images, onImagesChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={compact ? 'inline-flex items-center gap-1' : 'space-y-2'}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        type="button"
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
        className={compact ? 'h-8 w-8 p-0' : 'gap-2'}
      >
        {uploading ? (
          <Loader2 className={compact ? 'h-3.5 w-3.5 animate-spin' : 'h-4 w-4 animate-spin'} />
        ) : (
          <ImagePlus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        )}
        {!compact && (uploading ? 'Uploading...' : 'Add Image')}
      </Button>

      {images.length > 0 && (
        <div className={`flex gap-2 flex-wrap ${compact ? 'ml-1' : ''}`}>
          {images.map((img, i) => (
            <div key={img.url} className="relative group">
              <img
                src={img.url}
                alt=""
                className={`rounded border object-cover ${compact ? 'h-10 w-10' : 'h-20 w-20'}`}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Build imeta tags for uploaded images (NIP-92) */
export function buildImetaTags(images: UploadedImage[]): string[][] {
  return images.map((img) => {
    const tag = ['imeta', `url ${img.url}`];
    if (img.mimeType) tag.push(`m ${img.mimeType}`);
    if (img.dimensions?.width) tag.push(`dim ${img.dimensions.width}x${img.dimensions.height}`);
    return tag;
  });
}

/** Append image URLs to content text */
export function appendImageUrls(content: string, images: UploadedImage[]): string {
  if (!images.length) return content;
  const urls = images.map((img) => img.url).join('\n');
  return content.trim() + '\n\n' + urls;
}
