import React from 'react';
import uatHorizontalImg from '../assets/logos/uat-horizontal.png';
import uatCrestImg from '../assets/logos/uat-crest.png';
import uatSiglasImg from '../assets/logos/uat-siglas.png';

export type UatLogoVariant =
  | 'corporate'     // Logo oficial horizontal UAT (Escudo + Universidad Autónoma de Tamaulipas)
  | 'seal'          // Escudo circular oficial UAT
  | 'horizontal'    // Logo horizontal oficial
  | 'compact'       // Isotipo / Escudo compacto para barras superiores o móviles
  | 'shield'        // Escudo institucional oficial
  | 'siglas'        // Siglas estilizadas UAT
  | 'icon';         // Solo el escudo/ícono UAT

interface UatLogoProps {
  variant?: UatLogoVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  textColor?: 'dark' | 'light' | 'auto';
  className?: string;
  showSubtitle?: boolean;
  showMotto?: boolean;
}

/**
 * Escudo Heráldico Circular Oficial de la UAT
 * Archivo: uat-universidad-autonoma-de-tamaulipas-logo-png_seeklogo-143945.png
 */
export const UatHeraldicSeal: React.FC<{
  size?: number | string;
  className?: string;
  textColor?: 'dark' | 'light' | 'auto';
  showMotto?: boolean;
}> = ({ size = 96, className = '', textColor = 'auto', showMotto = false }) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex flex-col items-center select-none text-center ${className}`}>
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className="relative flex items-center justify-center shrink-0"
      >
        <img
          src={uatCrestImg}
          alt="Escudo Oficial de la Universidad Autónoma de Tamaulipas"
          loading="eager"
          decoding="async"
          className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200"
        />
      </div>

      {showMotto && (
        <span
          className={`text-[10px] sm:text-xs font-serif italic tracking-wider mt-2 block font-medium ${
            textColor === 'light'
              ? 'text-white/90 drop-shadow-xs'
              : textColor === 'dark'
              ? 'text-slate-800'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          &ldquo;Verdad, Belleza, Probidad&rdquo;
        </span>
      )}
    </div>
  );
};

/**
 * Logo Corporativo Oficial Horizontal de la UAT
 * Archivo: uat_horizontal_2026.png
 */
export const UatCorporateLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  textColor?: 'dark' | 'light' | 'auto';
  showSubtitle?: boolean;
}> = ({ size = 'md', className = '', textColor = 'auto', showSubtitle = true }) => {
  const heightClass = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24'
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <img
        src={uatHorizontalImg}
        alt="Universidad Autónoma de Tamaulipas"
        loading="eager"
        decoding="async"
        className={`${heightClass} w-auto object-contain drop-shadow-xs max-w-full`}
      />

      {showSubtitle && (
        <div className="hidden lg:flex flex-col border-l border-slate-300 dark:border-slate-700 pl-3">
          <span
            className={`font-heading font-bold text-xs uppercase tracking-wider ${
              textColor === 'light'
                ? 'text-white'
                : textColor === 'dark'
                ? 'text-slate-900'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            Tutorías Institucionales
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Acompañamiento Académico UAT
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Logo con las Siglas Estilizadas Oficiales UAT
 * Archivo: Siglas-UAT.png
 */
export const UatSiglasLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const heightClass = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-10',
    lg: 'h-12 sm:h-14'
  }[size];

  return (
    <img
      src={uatSiglasImg}
      alt="Siglas Oficiales UAT"
      loading="eager"
      decoding="async"
      className={`${heightClass} w-auto object-contain drop-shadow-xs ${className}`}
    />
  );
};

/**
 * Componente Principal Unificado UatLogo
 * Reemplaza los logos con IA por los oficiales de la UAT (Escudo, Horizontal y Siglas)
 */
export const UatLogo: React.FC<UatLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  textColor = 'auto',
  className = '',
  showSubtitle = true,
  showMotto = false
}) => {
  // 1. Escudo heráldico oficial
  if (variant === 'seal' || variant === 'shield') {
    const sealSizes = {
      sm: 40,
      md: 64,
      lg: 96,
      xl: 128,
      '2xl': 160
    };
    return (
      <UatHeraldicSeal
        size={sealSizes[size]}
        className={className}
        textColor={textColor}
        showMotto={showMotto}
      />
    );
  }

  // 2. Solo las siglas UAT
  if (variant === 'siglas') {
    const siglasSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';
    return <UatSiglasLogo size={siglasSize} className={className} />;
  }

  // 3. Ícono solo (Escudo UAT)
  if (variant === 'icon') {
    const iconSize = {
      sm: 32,
      md: 44,
      lg: 56,
      xl: 72,
      '2xl': 96
    }[size];
    return (
      <div className={`shrink-0 flex items-center justify-center ${className}`}>
        <img
          src={uatCrestImg}
          alt="UAT"
          style={{ width: iconSize, height: iconSize }}
          className="object-contain drop-shadow-xs"
        />
      </div>
    );
  }

  // 4. Compacto para barras superiores / Navbar / Sidebar colapsado
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
        <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
          <img
            src={uatCrestImg}
            alt="UAT"
            className="w-full h-full object-contain drop-shadow-2xs"
          />
        </div>

        {showSubtitle && (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-heading font-black text-sm tracking-wider text-[#EE7402]">
                UAT
              </span>
              <span className="text-slate-300 dark:text-slate-600 text-xs font-light">|</span>
              <span
                className={`font-heading font-bold text-xs tracking-tight ${
                  textColor === 'light'
                    ? 'text-white'
                    : textColor === 'dark'
                    ? 'text-slate-900'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                Tutorías
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
              Portal Institucional
            </span>
          </div>
        )}
      </div>
    );
  }

  // 5. Por defecto: Logo Corporativo Horizontal Oficial UAT
  const corpSize = size === '2xl' || size === 'xl' ? 'xl' : size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
  return (
    <UatCorporateLogo
      size={corpSize}
      className={className}
      textColor={textColor}
      showSubtitle={showSubtitle}
    />
  );
};

/**
 * Modal / Galería de Identidad Institucional Oficial UAT
 */
export const UatOfficialBrandShowcase: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              Logotipos Oficiales &bull; Universidad Autónoma de Tamaulipas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identidad visual oficial integrada en el Sistema de Tutorías
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Logo Horizontal */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center flex flex-col items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-[#EE7402] uppercase tracking-wider">
              Logo Horizontal
            </span>
            <div className="h-16 flex items-center justify-center">
              <img
                src={uatHorizontalImg}
                alt="Logo Horizontal UAT"
                className="max-h-12 w-auto object-contain"
              />
            </div>
            <span className="text-[10px] text-slate-500">Encabezados y Login</span>
          </div>

          {/* 2. Escudo Heráldico */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center flex flex-col items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-[#EE7402] uppercase tracking-wider">
              Escudo Oficial
            </span>
            <div className="h-16 flex items-center justify-center">
              <img
                src={uatCrestImg}
                alt="Escudo UAT"
                className="w-14 h-14 object-contain"
              />
            </div>
            <span className="text-[10px] text-slate-500">Favicon y Credenciales</span>
          </div>

          {/* 3. Siglas UAT */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center flex flex-col items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-[#EE7402] uppercase tracking-wider">
              Siglas UAT
            </span>
            <div className="h-16 flex items-center justify-center">
              <img
                src={uatSiglasImg}
                alt="Siglas UAT"
                className="max-h-10 w-auto object-contain"
              />
            </div>
            <span className="text-[10px] text-slate-500">Emblema Institucional</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
