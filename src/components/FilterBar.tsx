import React from 'react';
import { Search, Filter, BookOpen, Calendar, ArrowUpDown, LayoutGrid, List, X, ChevronDown, RotateCcw } from 'lucide-react';
import { formatSemestre } from '../utils/tutoriaUtils';

export type OrdenOpcion = 'prioridad_riesgo' | 'semestre_asc' | 'promedio_desc' | 'nombre';

interface FilterBarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  filtroSemestre: string;
  onFiltroSemestreChange: (val: string) => void;
  filtroEstado: string;
  onFiltroEstadoChange: (val: string) => void;
  filtroPeriodo: string;
  onFiltroPeriodoChange: (val: string) => void;
  orden: OrdenOpcion;
  onOrdenChange: (val: OrdenOpcion) => void;
  vistaModo: 'tarjetas' | 'tabla';
  onVistaModoChange: (val: 'tarjetas' | 'tabla') => void;
  totalVisible: number;
  totalGeneral: number;
  onResetFiltros: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  busqueda,
  onBusquedaChange,
  filtroSemestre,
  onFiltroSemestreChange,
  filtroEstado,
  onFiltroEstadoChange,
  filtroPeriodo,
  onFiltroPeriodoChange,
  orden,
  onOrdenChange,
  vistaModo,
  onVistaModoChange,
  totalVisible,
  totalGeneral,
  onResetFiltros
}) => {
  const hayFiltrosActivos =
    busqueda !== '' ||
    filtroSemestre !== 'TODOS' ||
    filtroEstado !== 'TODOS' ||
    filtroPeriodo !== 'TODOS';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs space-y-3">
      {/* Fila Principal: Buscador y Selectores */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Buscador Interactivo */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar por alumno, matrícula, carrera o semestre..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all"
          />
          {busqueda && (
            <button
              onClick={() => onBusquedaChange('')}
              className="absolute right-2.5 top-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Borrar texto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controles de Filtros */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Selector de Semestre */}
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs transition-colors">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mr-1.5 shrink-0" />
            <label htmlFor="filter-semestre" className="text-slate-500 dark:text-slate-400 text-[11px] mr-1 shrink-0">Semestre:</label>
            <select
              id="filter-semestre"
              value={filtroSemestre}
              onChange={(e) => onFiltroSemestreChange(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none text-xs cursor-pointer pr-4 appearance-none"
            >
              <option value="TODOS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todos</option>
              <option value="1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">1er Semestre</option>
              <option value="2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2do Semestre</option>
              <option value="3" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">3er Semestre</option>
              <option value="4" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">4to Semestre</option>
              <option value="5" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">5to Semestre</option>
              <option value="6" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">6to Semestre</option>
              <option value="7" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">7mo Semestre</option>
              <option value="8" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">8vo Semestre</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2" />
          </div>

          {/* Selector de Estado */}
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs transition-colors">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <label htmlFor="filter-estado" className="text-slate-500 dark:text-slate-400 text-[11px] mr-1 shrink-0">Estado:</label>
            <select
              id="filter-estado"
              value={filtroEstado}
              onChange={(e) => onFiltroEstadoChange(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none text-xs cursor-pointer pr-4 appearance-none"
            >
              <option value="TODOS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todos</option>
              <option value="ACTIVO" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400">Activo (Regular)</option>
              <option value="EN_RIESGO" className="bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400">En Riesgo</option>
              <option value="CONDICIONADO" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400">Condicionado</option>
              <option value="CONCLUIDO" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">Concluido</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2" />
          </div>

          {/* Selector de Periodo */}
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs transition-colors">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <label htmlFor="filter-periodo" className="text-slate-500 dark:text-slate-400 text-[11px] mr-1 shrink-0">Ciclo:</label>
            <select
              id="filter-periodo"
              value={filtroPeriodo}
              onChange={(e) => onFiltroPeriodoChange(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none text-xs cursor-pointer pr-4 appearance-none"
            >
              <option value="TODOS" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todos</option>
              <option value="2026-1" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2026-1</option>
              <option value="2026-2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2026-2</option>
              <option value="2025-2" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">2025-2</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2" />
          </div>

          {/* Ordenamiento */}
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <select
              value={orden}
              onChange={(e) => onOrdenChange(e.target.value as OrdenOpcion)}
              className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none text-xs cursor-pointer pr-4 appearance-none"
              title="Criterio de orden"
            >
              <option value="prioridad_riesgo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Prioridad: En Riesgo</option>
              <option value="semestre_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Semestre (Menor a Mayor)</option>
              <option value="promedio_desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Promedio (Mayor a Menor)</option>
              <option value="nombre" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nombre (A - Z)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2" />
          </div>

          {/* Selector de Modo Tarjeta / Tabla */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => onVistaModoChange('tarjetas')}
              title="Vista de cuadrícula"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                vistaModo === 'tarjetas'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onVistaModoChange('tabla')}
              title="Vista de lista / tabla"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                vistaModo === 'tabla'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Fila Secundaria: Filtros activos y conteo */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Mostrando <strong className="text-slate-900 dark:text-white font-mono">{totalVisible}</strong> de <span className="font-mono">{totalGeneral}</span> tutorados
          </span>

          {hayFiltrosActivos && (
            <>
              <span className="text-slate-300 dark:text-slate-600">&bull;</span>
              <span className="text-slate-400">Filtros aplicados:</span>

              {busqueda && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                  &ldquo;{busqueda}&rdquo;
                  <button onClick={() => onBusquedaChange('')} className="hover:text-emerald-900 dark:hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtroSemestre !== 'TODOS' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                  Semestre: {formatSemestre(Number(filtroSemestre))}
                  <button onClick={() => onFiltroSemestreChange('TODOS')} className="hover:text-emerald-900 dark:hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtroEstado !== 'TODOS' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  Estado: {filtroEstado}
                  <button onClick={() => onFiltroEstadoChange('TODOS')} className="hover:text-slate-900 dark:hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtroPeriodo !== 'TODOS' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  Ciclo: {filtroPeriodo}
                  <button onClick={() => onFiltroPeriodoChange('TODOS')} className="hover:text-slate-900 dark:hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={onResetFiltros}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold ml-1 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Filtro reactivo</span>
        </div>
      </div>
    </div>
  );
};
