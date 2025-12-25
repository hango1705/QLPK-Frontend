import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui';

interface ImageViewerProps {
  open: boolean;
  imageUrl: string | null;
  alt?: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ open, imageUrl, alt = 'Image', onClose }) => {
  console.log('ImageViewer render:', { open, imageUrl, hasImageUrl: !!imageUrl });
  
  if (!imageUrl) {
    console.warn('ImageViewer: imageUrl is null/empty');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none !z-[70]">
        <DialogHeader className="sr-only">
          <DialogTitle>Xem ảnh</DialogTitle>
          <DialogDescription>{alt}</DialogDescription>
        </DialogHeader>
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[95vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            onLoad={() => {
              console.log('ImageViewer: Image loaded successfully:', imageUrl);
            }}
            onError={(e) => {
              console.error('ImageViewer: Failed to load image:', {
                imageUrl,
                error: e
              });
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;

