/**
 * Constantes y definiciones del Calendario Escolar Oficial UAT (Universidad Autónoma de Tamaulipas) 2026
 * Incluye días inhábiles, periodos vacacionales institucionales y semanas de evaluación.
 */

export interface EventoEscolarUAT {
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;    // YYYY-MM-DD
  nombre: string;
  tipo: 'INHABIL' | 'VACACIONES' | 'EXAMENES' | 'INSCRIPCIONES' | 'INICIO_CLASES';
  colorBadge: string;
  descripcion?: string;
}

export const EVENTOS_CALENDARIO_UAT_2026: EventoEscolarUAT[] = [
  // Enero 2026
  {
    fechaInicio: '2026-01-01',
    fechaFin: '2026-01-01',
    nombre: 'Año Nuevo',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Descanso obligatorio conforme a la Ley y contrato colectivo UAT'
  },
  {
    fechaInicio: '2026-01-19',
    fechaFin: '2026-01-19',
    nombre: 'Inicio de Clases Periodo 2026-1',
    tipo: 'INICIO_CLASES',
    colorBadge: 'bg-emerald-600 text-white',
    descripcion: 'Apertura oficial del periodo lectivo Primavera 2026'
  },

  // Febrero 2026
  {
    fechaInicio: '2026-02-02',
    fechaFin: '2026-02-02',
    nombre: 'Día de la Constitución Política',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Inhábil oficial (conmemoración del 5 de febrero)'
  },

  // Marzo 2026
  {
    fechaInicio: '2026-03-02',
    fechaFin: '2026-03-06',
    nombre: 'Primer Periodo de Exámenes Parciales',
    tipo: 'EXAMENES',
    colorBadge: 'bg-amber-500 text-slate-950 font-bold',
    descripcion: 'Evaluaciones del primer tercio del semestre 2026-1'
  },
  {
    fechaInicio: '2026-03-16',
    fechaFin: '2026-03-16',
    nombre: 'Natalicio de Benito Juárez',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Inhábil oficial (conmemoración del 21 de marzo)'
  },
  {
    fechaInicio: '2026-03-30',
    fechaFin: '2026-04-10',
    nombre: 'Periodo Vacacional de Primavera (Semana Santa)',
    tipo: 'VACACIONES',
    colorBadge: 'bg-indigo-600 text-white',
    descripcion: 'Receso vacacional de primavera para personal académico y estudiantado'
  },

  // Abril 2026
  {
    fechaInicio: '2026-04-20',
    fechaFin: '2026-04-24',
    nombre: 'Segundo Periodo de Exámenes Parciales',
    tipo: 'EXAMENES',
    colorBadge: 'bg-amber-500 text-slate-950 font-bold',
    descripcion: 'Segunda ronda de evaluaciones parciales institucionales'
  },

  // Mayo 2026
  {
    fechaInicio: '2026-05-01',
    fechaFin: '2026-05-01',
    nombre: 'Día Internacional del Trabajo',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Inhábil oficial nacional'
  },
  {
    fechaInicio: '2026-05-05',
    fechaFin: '2026-05-05',
    nombre: 'Conmemoración de la Batalla de Puebla',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Suspensión de labores académicas y administrativas'
  },
  {
    fechaInicio: '2026-05-15',
    fechaFin: '2026-05-15',
    nombre: 'Día del Maestro (Inhábil UAT)',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Festejo institucional del personal docente UAT'
  },
  {
    fechaInicio: '2026-05-18',
    fechaFin: '2026-05-29',
    nombre: 'Exámenes Ordinarios y Finales',
    tipo: 'EXAMENES',
    colorBadge: 'bg-amber-500 text-slate-950 font-bold',
    descripcion: 'Cierre del periodo lectivo 2026-1'
  },

  // Julio 2026
  {
    fechaInicio: '2026-07-13',
    fechaFin: '2026-07-31',
    nombre: 'Periodo Vacacional de Verano UAT',
    tipo: 'VACACIONES',
    colorBadge: 'bg-indigo-600 text-white',
    descripcion: 'Receso de verano institucional'
  },

  // Agosto 2026
  {
    fechaInicio: '2026-08-03',
    fechaFin: '2026-08-14',
    nombre: 'Inscripciones y Reinscripciones Periodo 2026-3',
    tipo: 'INSCRIPCIONES',
    colorBadge: 'bg-sky-600 text-white',
    descripcion: 'Trámite de matrícula y registro de materias en el SIA UAT'
  },
  {
    fechaInicio: '2026-08-17',
    fechaFin: '2026-08-17',
    nombre: 'Inicio de Clases Periodo 2026-3 (Otoño)',
    tipo: 'INICIO_CLASES',
    colorBadge: 'bg-emerald-600 text-white',
    descripcion: 'Apertura del periodo lectivo Otoño 2026'
  },

  // Septiembre 2026
  {
    fechaInicio: '2026-09-16',
    fechaFin: '2026-09-16',
    nombre: 'Día de la Independencia de México',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Aniversario de la Independencia Nacional'
  },

  // Octubre 2026
  {
    fechaInicio: '2026-10-12',
    fechaFin: '2026-10-12',
    nombre: 'Día de la Raza / Encuentro de Culturas',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Suspensión oficial de labores docentes'
  },

  // Noviembre 2026
  {
    fechaInicio: '2026-11-02',
    fechaFin: '2026-11-02',
    nombre: 'Día de Muertos (Tradición UAT)',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Inhábil oficial universitario por conmemoración cultural tradicional'
  },
  {
    fechaInicio: '2026-11-16',
    fechaFin: '2026-11-16',
    nombre: 'Aniversario de la Revolución Mexicana',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Inhábil oficial (tercer lunes de noviembre)'
  },

  // Diciembre 2026
  {
    fechaInicio: '2026-12-21',
    fechaFin: '2026-12-31',
    nombre: 'Periodo Vacacional de Invierno UAT',
    tipo: 'VACACIONES',
    colorBadge: 'bg-indigo-600 text-white',
    descripcion: 'Receso institucional de fin de año y año nuevo'
  },
  {
    fechaInicio: '2026-12-25',
    fechaFin: '2026-12-25',
    nombre: 'Navidad',
    tipo: 'INHABIL',
    colorBadge: 'bg-red-600 text-white',
    descripcion: 'Inhábil oficial de descanso obligatorio'
  }
];

/**
 * Obtiene el evento oficial de la UAT para una fecha específica (YYYY-MM-DD).
 */
export function getEventoEscolarUat(fechaIso: string): EventoEscolarUAT | null {
  if (!fechaIso) return null;
  // Búsqueda de coincidencia puntual o dentro de rango
  for (const evento of EVENTOS_CALENDARIO_UAT_2026) {
    if (fechaIso >= evento.fechaInicio && fechaIso <= evento.fechaFin) {
      return evento;
    }
  }
  return null;
}

/**
 * Indica si una fecha es inhábil o receso vacacional en la UAT
 */
export function esInhabilOVacacionesUat(fechaIso: string): boolean {
  const ev = getEventoEscolarUat(fechaIso);
  return ev !== null && (ev.tipo === 'INHABIL' || ev.tipo === 'VACACIONES');
}
