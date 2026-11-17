import React from 'react';

interface UisaLogoProps {
  variant?: 'color' | 'white' | 'carbon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  alt?: string;
}

/**
 * Uisa Logo Component
 * Uses the official brand image asset provided by UISA (/assets/aistudio/image_e9e500fe.png)
 * featuring the triangular Mobius symbol in gradient, the UISA wordmark, and BIOENERGIA + AÇÚCAR.
 */
export const UisaLogo: React.FC<UisaLogoProps> = ({
  size = 'md',
  className = '',
  alt = 'uisa — Bioenergia + Açúcar',
}) => {
  // Height classes aligned with container sizes
  const heightClass = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
    xl: 'h-14',
  }[size];

  return (
    <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
      <img
        src="/assets/aistudio/image_e9e500fe.png"
        alt={alt}
        className={`${heightClass} w-auto object-contain shrink-0`}
        loading="eager"
      />
    </div>
  );
};
