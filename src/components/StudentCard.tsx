import React from 'react';
import { AsignacionTutorado } from '../types/tutoria';
import { formatSemestre, getCarreraCorta, getEstadoConfig } from '../utils/tutoriaUtils';
import { AvatarWithFallback } from './AvatarWithFallback';
import { Award, ArrowRight, BookOpen } from 'lucide-react';

interface StudentCardProps {
  asignacion: AsignacionTutorado;
  onSeleccionar: (asignacion: AsignacionTutorado) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({ asignacion, onSeleccionar }) => {
  const est = asignacion.estudiante;
  const estadoCfg = getEstadoConfig(asignacion.estado);
  const esRiesgo = asignacion.estado === 'EN_RIESGO';
  const esCondicionado = asignacion.estado === 'CONDICIONADO';

  // Porcentaje estimado de avance curricular (base 9 semestres)
  const avanceEstimado = Math.min(100, Math.round((est.semestre / 9) * 100));

  return (
    <div
      onClick={() => onSeleccionar(asignacion)}
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden ${
        esRiesgo
          ? 'border-rose-300 dark:border-rose-500/60 shadow-rose-100/40 dark:shadow-rose-950/20'
          : esCondicionado
          ? 'border-amber-300 dark:border-amber-500/50'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-[#EE7402]/60 dark:hover:border-[#EE7402]/50'
      }`}
    >
      {/* Indicador de riesgo sutil en el borde izquierdo */}
      {esRiesgo && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />}
      {esCondicionado && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />}

      <div>
        {/* Cabecera limpia: Avatar, Nombre, Matrícula y Estado */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <AvatarWithFallback
              src={est.avatar}
              alt={est.nombre}
              className="w-11 h-11 rounded-xl ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
            />
            <div className="min-w-0">
              <h4 className="font-heading font-semibold text-sm text-slate-900 dark:text-white group-hover:text-[#EE7402] transition-colors truncate">
                {est.nombre}
              </h4>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block tracking-tight">
                {est.matricula}
              </span>
            </div>
          </div>

          <div
            className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shrink-0 flex items-center gap-1.5 ${estadoCfg.badgeClass}`}
            title={`Estado: ${estadoCfg.label}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dotClass}`} />
            <span>{estadoCfg.label}</span>
          </div>
        </div>

        {/* Datos Académicos Clave sin saturación de cajas */}
        <div className="space-y-2 text-xs py-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>{getCarreraCorta(est.carrera)}</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatSemestre(est.semestre)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Promedio general:</span>
            <span
              className={`font-mono font-bold text-xs flex items-center gap-1 ${
                est.promedio >= 8.5
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : est.promedio >= 7.0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400 font-extrabold'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              {est.promedio.toFixed(1)}
            </span>
          </div>

          {/* Barra de progreso de carrera limpia */}
          <div className="pt-1.5">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Avance curricular</span>
              <span className="font-mono">{avanceEstimado}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#EE7402] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${avanceEstimado}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pie de Tarjeta directo y despejado */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-2 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400">
          {asignacion.notas?.length || 0} sesiones registradas
        </span>

        <span className="text-xs font-semibold text-[#EE7402] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          <span>Ver Ficha</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
