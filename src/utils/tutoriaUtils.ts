import { EstadoTutorado } from '../types/tutoria';

/**
 * Retorna la representación ordinal del semestre escolar en español
 * Ejemplo: 1 -> "1er Semestre", 3 -> "3er Semestre", 5 -> "5to Semestre"
 */
export function formatSemestre(semestre: number): string {
  const ordinals: Record<number, string> = {
    1: '1er Semestre',
    2: '2do Semestre',
    3: '3er Semestre',
    4: '4to Semestre',
    5: '5to Semestre',
    6: '6to Semestre',
    7: '7mo Semestre',
    8: '8vo Semestre',
    9: '9no Semestre',
    10: '10mo Semestre'
  };
  return ordinals[semestre] || `${semestre}° Semestre`;
}

/**
 * Retorna abreviatura o etiqueta corta de la carrera para visualización compacta
 */
export function getCarreraCorta(carrera: string): string {
  if (carrera.includes('Sistemas')) return 'Ing. Sistemas (ISC)';
  if (carrera.includes('Industrial')) return 'Ing. Industrial (IND)';
  if (carrera.includes('Administración')) return 'Lic. Administración (ADM)';
  return carrera;
}

/**
 * Clases y estilos de accesibilidad de alto contraste para estados de tutoría
 */
export interface EstadoBadgeConfig {
  label: string;
  sublabel: string;
  badgeClass: string;
  dotClass: string;
  cardBorderClass: string;
  accentBg: string;
}

export function getEstadoConfig(estado: EstadoTutorado): EstadoBadgeConfig {
  switch (estado) {
    case 'ACTIVO':
      return {
        label: 'ACTIVO',
        sublabel: 'Regular',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-500/50 shadow-xs font-semibold',
        dotClass: 'bg-emerald-500 dark:bg-emerald-400',
        cardBorderClass: 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40',
        accentBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
      };
    case 'EN_RIESGO':
      return {
        label: 'EN RIESGO',
        sublabel: 'Atención Prioritaria',
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-500/70 shadow-xs font-bold ring-1 ring-rose-400/30 dark:ring-rose-500/40',
        dotClass: 'bg-rose-500 dark:bg-rose-400 animate-ping',
        cardBorderClass: 'border-rose-300 dark:border-rose-500/50 hover:border-rose-400 bg-rose-50/20 dark:bg-rose-950/15',
        accentBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40'
      };
    case 'CONDICIONADO':
      return {
        label: 'CONDICIONADO',
        sublabel: 'Seguimiento Estricto',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-500/60 shadow-xs font-semibold',
        dotClass: 'bg-amber-500 dark:bg-amber-400',
        cardBorderClass: 'border-amber-300 dark:border-amber-500/40 hover:border-amber-400/70 bg-amber-50/20 dark:bg-amber-950/10',
        accentBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
      };
    case 'CONCLUIDO':
    default:
      return {
        label: 'CONCLUIDO',
        sublabel: 'Egresado / Baja',
        badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 font-medium',
        dotClass: 'bg-slate-400 dark:bg-slate-400',
        cardBorderClass: 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600',
        accentBg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      };
  }
}

/**
 * Convierte un Data URL o Base64 a un Blob con su MIME type correcto
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    if (!dataUrl) return null;
    if (dataUrl.startsWith('blob:')) {
      return null;
    }
    if (!dataUrl.includes(',')) {
      // Intentar decodificar como base64 puro
      try {
        const binary = atob(dataUrl.trim());
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        return new Blob([array], { type: 'application/octet-stream' });
      } catch {
        return null;
      }
    }
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Decodifica texto legible a partir de un Data URL Base64 (txt, csv, md, json, codigo, etc.)
 */
export function decodeTextFromDataUrl(dataUrl: string): string | null {
  try {
    if (!dataUrl) return null;
    let base64Part = dataUrl;
    if (dataUrl.includes(',')) {
      base64Part = dataUrl.split(',')[1];
    }
    const binary = atob(base64Part.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(bytes);
    // Verificar si es mayormente texto imprimible
    return text;
  } catch {
    return null;
  }
}

/**
 * Abre de forma segura un documento en una pestaña nueva usando un Blob URL seguro
 */
export function abrirDocumentoEnPestana(dataUrl: string, nombre?: string): void {
  try {
    const blob = dataUrlToBlob(dataUrl);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const nuevaVentana = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!nuevaVentana) {
        // Si el navegador bloqueó la ventana emergente en el iframe, descargar como respaldo
        descargarDocumento(dataUrl, nombre || 'documento');
      }
    } else if (dataUrl && (dataUrl.startsWith('http') || dataUrl.startsWith('data:'))) {
      const nuevaVentana = window.open(dataUrl, '_blank', 'noopener,noreferrer');
      if (!nuevaVentana) {
        descargarDocumento(dataUrl, nombre || 'documento');
      }
    } else if (nombre) {
      descargarDocumento(dataUrl, nombre);
    }
  } catch {
    if (nombre) descargarDocumento(dataUrl, nombre);
  }
}

/**
 * Descarga forzada de un archivo a partir de un DataURL o Blob
 */
export function descargarDocumento(dataUrl: string, nombre: string): void {
  try {
    let url = dataUrl;
    let blob: Blob | null = null;

    if (!dataUrl) {
      console.warn('No hay contenido para descargar');
      return;
    }

    if (dataUrl.startsWith('data:')) {
      blob = dataUrlToBlob(dataUrl);
      if (blob) {
        url = URL.createObjectURL(blob);
      }
    }

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre || 'documento-descargado';
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();

    setTimeout(() => {
      try {
        document.body.removeChild(enlace);
        if (blob) {
          URL.revokeObjectURL(url);
        }
      } catch {}
    }, 500);
  } catch (err) {
    console.warn('Error al descargar documento:', err);
  }
}

