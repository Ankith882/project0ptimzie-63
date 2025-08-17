import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  preload?: boolean;
}

// Global image cache to store loaded images
const imageCache = new Map<string, HTMLImageElement>();

// Preload critical images immediately
const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src)!);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  preload = false 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (preload) {
      preloadImage(src)
        .then(() => setIsLoaded(true))
        .catch(() => setHasError(true));
    }
  }, [src, preload]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (!imageCache.has(src)) {
      const img = new Image();
      img.src = src;
      imageCache.set(src, img);
    }
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <span className="text-xs text-muted-foreground">Image failed to load</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-md" />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

// Preload critical images when the module loads
const criticalImages = [
  '/lovable-uploads/b273f989-257a-4ea6-a3e8-7654e6581de8.png' // Calendar icon
];

// Preload critical images immediately
criticalImages.forEach(src => {
  preloadImage(src).catch(() => {
    console.warn(`Failed to preload critical image: ${src}`);
  });
});