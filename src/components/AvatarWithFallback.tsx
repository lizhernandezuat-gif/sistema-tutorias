import React, { useState } from 'react';

interface AvatarWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AvatarWithFallback: React.FC<AvatarWithFallbackProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  size = 'md'
}) => {
  const [error, setError] = useState(false);

  // Generar iniciales a partir del nombre o fallbackText
  const getInitials = (name: string): string => {
    if (!name) return 'EST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = fallbackText || getInitials(alt);

  // Paleta de degradados según las iniciales
  const getBgGradient = (str: string) => {
    const charCode = str.charCodeAt(0) || 0;
    const gradients = [
      'from-indigo-600 to-blue-700',
      'from-violet-600 to-indigo-800',
      'from-cyan-600 to-blue-800',
      'from-teal-600 to-emerald-800',
      'from-fuchsia-600 to-purple-800',
      'from-sky-600 to-indigo-700'
    ];
    return gradients[charCode % gradients.length];
  };

  if (error || !src) {
    return (
      <div
        className={`bg-gradient-to-br ${getBgGradient(alt)} flex items-center justify-center font-bold text-white tracking-wider select-none shrink-0 ${className}`}
        aria-label={alt}
      >
        <span className="text-[11px] font-mono leading-none">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={`shrink-0 object-cover ${className}`}
    />
  );
};
