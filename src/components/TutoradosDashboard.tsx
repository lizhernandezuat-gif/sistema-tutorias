import React, { useState, useEffect, useMemo } from 'react';
import { Tutor, AsignacionTutorado, EstadoTutorado } from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { formatSemestre, getCarreraCorta, getEstadoConfig } from '../utils/tutoriaUtils';
import { StatCard } from './StatCard';
import { StudentCard } from './StudentCard';
import { FilterBar, OrdenOpcion } from './FilterBar';
import { AvatarWithFallback } from './AvatarWithFallback';
import {
  Users,
  AlertTriangle,
  Award,
  Clock,
  GraduationCap,
  RotateCcw,
  Download,
  UserPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface TutoradosDashboardProps {
  tutorActivo: Tutor;
  onAbrirAsignarModal: () => void;
  onSeleccionarTutorado: (asignacion: AsignacionTutorado) => void;
  onActualizacionGlobal: () => void;
}

export const TutoradosDashboard: React.FC<TutoradosDashboardProps> = ({
  tutorActivo,
  onAbrirAsignarModal,
  onSeleccionarTutorado,
  onActualizacionGlobal
}) => {
  const [tutorados, setTutorados] = useState<AsignacionTutorado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('TODOS');
  const [filtroSemestre, setFiltroSemestre] = useState<string>('TODOS');
  const [orden, setOrden] = useState<OrdenOpcion>('prioridad_riesgo');
  const [vistaModo, setVistaModo] = useState<'tarjetas' | 'tabla'>('tarjetas');
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 6;

  const cargarTutorados = async () => {
    setCargando(true);
    const res = await tutoriaService.getMisTutorados(tutorActivo.id, {
      search: busqueda,
      estado: filtroEstado,
      periodo: filtroPeriodo,
      semestre: filtroSemestre
    });
    if (res.success && res.data) {
      setTutorados(res.data);
    }
    setCargando(false);
  };

  useEffect(() => {
    setPaginaActual(1);
    cargarTutorados();
    const unsub = tutoriaService.subscribe(() => {
      cargarTutorados();
    });
    return () => unsub();
  }, [tutorActivo.id, busqueda, filtroEstado, filtroPeriodo, filtroSemestre]);

  // Ordenamiento cliente sobre los resultados filtrados
  const tutoradosOrdenados = useMemo(() => {
    const lista = [...tutorados];
    switch (orden) {
      case 'promedio_desc':
        return lista.sort((a, b) => b.estudiante.promedio - a.estudiante.promedio);
      case 'semestre_asc':
        return lista.sort((a, b) => a.estudiante.semestre - b.estudiante.semestre);
      case 'prioridad_riesgo':
        const peso: Record<EstadoTutorado, number> = {
          'EN_RIESGO': 0,
          'CONDICIONADO': 1,
          'ACTIVO': 2,
          'CONCLUIDO': 3
        };
        return lista.sort((a, b) => (peso[a.estado] ?? 99) - (peso[b.estado] ?? 99));
      case 'nombre':
      default:
        return lista.sort((a, b) => a.estudiante.nombre.localeCompare(b.estudiante.nombre));
    }
  }, [tutorados, orden]);

  // Paginación para evitar sobrecarga visual
  const totalPaginas = Math.max(1, Math.ceil(tutoradosOrdenados.length / elementosPorPagina));
  const tutoradosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return tutoradosOrdenados.slice(inicio, inicio + elementosPorPagina);
  }, [tutoradosOrdenados, paginaActual, elementosPorPagina]);

  // Cálculos de métricas
  const total = tutorados.length;
  const enRiesgo = tutorados.filter(t => t.estado === 'EN_RIESGO' || t.estado === 'CONDICIONADO').length;
  const promedioGeneral = total > 0
    ? (tutorados.reduce((acc, curr) => acc + curr.estudiante.promedio, 0) / total).toFixed(1)
    : '0.0';
  const totalNotas = tutorados.reduce((acc, curr) => acc + (curr.notas?.length || 0), 0);

  const resetearFiltros = () => {
    setBusqueda('');
    setFiltroEstado('TODOS');
    setFiltroPeriodo('TODOS');
    setFiltroSemestre('TODOS');
    setOrden('prioridad_riesgo');
  };

  const handleExportarCSV = () => {
    if (tutoradosOrdenados.length === 0) return;
    const headers = ['Matricula', 'Nombre', 'Email', 'Carrera', 'Semestre', 'Promedio', 'Periodo', 'Estado', 'Fecha Asignacion', 'Total Sesiones'];
    const rows = tutoradosOrdenados.map(t => [
      `"${t.estudiante.matricula}"`,
      `"${t.estudiante.nombre}"`,
      `"${t.estudiante.email}"`,
      `"${t.estudiante.carrera}"`,
      `"${formatSemestre(t.estudiante.semestre)}"`,
      t.estudiante.promedio,
      `"${t.periodoEscolar}"`,
      `"${t.estado}"`,
      `"${new Date(t.fechaAsignacion).toLocaleDateString()}"`,
      t.notas?.length || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tutorados_${tutorActivo.nombre.replace(/\s+/g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior con Identidad Profesional "Tutoría Pro" */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
        {/* Decoración de fondo suave */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-[#EE7402]/5 dark:bg-[#EE7402]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <AvatarWithFallback
              src={tutorActivo.avatar}
              alt={tutorActivo.nombre}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ring-2 ring-[#EE7402]/40 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                  {tutorActivo.nombre}
                </h2>
                <span className="bg-[#002B49]/10 dark:bg-sky-950/60 text-[#002B49] dark:text-sky-300 border border-[#002B49]/20 dark:border-sky-800/40 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-[#EE7402]" />
                  Docente Tutor
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                <span>{tutorActivo.departamento}</span>
                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">&bull;</span>
                <span>{tutorActivo.cubículo}</span>
              </p>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                <span className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-[10px] font-medium">
                  Periodo Escolar 2026-1
                </span>
                <span className="text-[#EE7402] dark:text-[#EE7402] font-medium flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Asignaciones activas en sistema
                </span>
              </div>
            </div>
          </div>

          {/* Acciones del Banner */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap pt-3 lg:pt-0 border-t border-slate-100 dark:border-slate-800 lg:border-t-0">
            <button
              onClick={handleExportarCSV}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
              title="Descargar lista de tutorados en CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onAbrirAsignarModal}
              className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-[#EE7402]/30 transition-all hover:scale-[1.01] shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Asignar Tutorado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas (Componente Reutilizable StatCard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Tutorados Activos"
          value={total}
          subtitle="Bajo tu acompañamiento escolar"
          icon={Users}
          variant="default"
        />

        <StatCard
          title="En Riesgo / Alerta"
          value={enRiesgo}
          badge={total > 0 && enRiesgo > 0 ? `(${Math.round((enRiesgo / total) * 100)}%)` : undefined}
          subtitle="Requieren seguimiento prioritario"
          icon={AlertTriangle}
          variant="rose"
        />

        <StatCard
          title="Promedio del Grupo"
          value={`${promedioGeneral}`}
          badge="/ 10"
          subtitle="Rendimiento curricular global"
          icon={Award}
          variant="emerald"
        />

        <StatCard
          title="Sesiones Registradas"
          value={totalNotas}
          subtitle="Bitácora activa en ciclo escolar"
          icon={Clock}
          variant="blue"
        />
      </div>

      {/* Barra de Búsqueda y Filtros Avanzados (Componente FilterBar) */}
      <FilterBar
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtroSemestre={filtroSemestre}
        onFiltroSemestreChange={setFiltroSemestre}
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={setFiltroEstado}
        filtroPeriodo={filtroPeriodo}
        onFiltroPeriodoChange={setFiltroPeriodo}
        orden={orden}
        onOrdenChange={setOrden}
        vistaModo={vistaModo}
        onVistaModoChange={setVistaModo}
        totalVisible={tutoradosOrdenados.length}
        totalGeneral={total}
        onResetFiltros={resetearFiltros}
      />

      {/* Contenido Principal: Grilla de Tarjetas o Tabla */}
      {cargando ? (
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Cargando tutorados de {tutorActivo.nombre}...</p>
        </div>
      ) : tutoradosOrdenados.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            No se encontraron tutorados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {busqueda || filtroEstado !== 'TODOS' || filtroPeriodo !== 'TODOS' || filtroSemestre !== 'TODOS'
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : `El tutor ${tutorActivo.nombre} aún no tiene alumnos asignados en este ciclo.`}
          </p>

          <div className="flex items-center justify-center gap-3">
            {(busqueda || filtroEstado !== 'TODOS' || filtroPeriodo !== 'TODOS' || filtroSemestre !== 'TODOS') && (
              <button
                onClick={resetearFiltros}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
            <button
              onClick={onAbrirAsignarModal}
              className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-sm shadow-[#EE7402]/30 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Asignar nuevo tutorado</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {vistaModo === 'tarjetas' ? (
            /* VISTA EN TARJETAS REUTILIZABLES (StudentCard) */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
              {tutoradosPaginados.map((asig) => (
                <StudentCard
                  key={asig.id}
                  asignacion={asig}
                  onSeleccionar={onSeleccionarTutorado}
                />
              ))}
            </div>
          ) : (
            /* VISTA TABULAR PROFESIONAL */
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Estudiante</th>
                      <th className="py-3.5 px-4 font-semibold">Semestre</th>
                      <th className="py-3.5 px-4 font-semibold">Carrera</th>
                      <th className="py-3.5 px-4 font-semibold">Promedio</th>
                      <th className="py-3.5 px-4 font-semibold">Periodo</th>
                      <th className="py-3.5 px-4 font-semibold">Estado</th>
                      <th className="py-3.5 px-4 font-semibold">Sesiones</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {tutoradosPaginados.map((asig) => {
                      const est = asig.estudiante;
                      const estadoCfg = getEstadoConfig(asig.estado);

                      return (
                        <tr
                          key={asig.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <AvatarWithFallback
                                src={est.avatar}
                                alt={est.nombre}
                                className="w-8 h-8 rounded-lg"
                              />
                              <div>
                                <span className="font-heading font-semibold text-slate-900 dark:text-white block">
                                  {est.nombre}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  {est.matricula}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EE7402]/10 border border-[#EE7402]/20 text-[#EE7402] font-semibold text-xs">
                              {formatSemestre(est.semestre)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-700 dark:text-slate-200 block truncate max-w-[200px]" title={est.carrera}>
                              {getCarreraCorta(est.carrera)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-mono font-bold tabular-nums ${
                              est.promedio >= 8.5 ? 'text-emerald-600 dark:text-emerald-400' : est.promedio >= 7.0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {est.promedio.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                            {asig.periodoEscolar}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${estadoCfg.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dotClass}`} />
                              <span>{estadoCfg.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                            {asig.notas?.length || 0} notas
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onSeleccionarTutorado(asig)}
                              className="px-3 py-1.5 bg-[#EE7402]/10 hover:bg-[#EE7402] text-[#EE7402] hover:text-white dark:bg-[#EE7402]/20 dark:hover:bg-[#EE7402] dark:text-[#EE7402] dark:hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                            >
                              Ver Ficha
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Control de Paginación Elegante para Reducir Saturación */}
          {totalPaginas > 1 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Mostrando <strong className="text-slate-800 dark:text-white">{(paginaActual - 1) * elementosPorPagina + 1}</strong> - <strong className="text-slate-800 dark:text-white">{Math.min(paginaActual * elementosPorPagina, tutoradosOrdenados.length)}</strong> de <strong className="text-slate-800 dark:text-white">{tutoradosOrdenados.length}</strong> tutorados
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPaginaActual(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                        paginaActual === num
                          ? 'bg-[#EE7402] text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
