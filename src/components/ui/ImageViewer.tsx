import React from 'react';
import { Dialog, DialogContent } from '@/components/ui';

interface ImageViewerProps {
  open: boolean;
  imageUrl: string | null;
  alt?: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ open, imageUrl, alt = 'Image', onClose }) => {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[95vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;

