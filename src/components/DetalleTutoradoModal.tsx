import React, { useState, useEffect } from 'react';
import { AsignacionTutorado, EstadoTutorado, NotaSeguimiento, Tutor, ArchivoSistema } from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { formatSemestre, getCarreraCorta, getEstadoConfig } from '../utils/tutoriaUtils';
import { AvatarWithFallback } from './AvatarWithFallback';
import {
  X,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  AlertTriangle,
  FileText,
  PlusCircle,
  Trash2,
  CheckCircle,
  Hash,
  Award,
  GraduationCap,
  Download,
  FolderOpen
} from 'lucide-react';

interface DetalleTutoradoModalProps {
  asignacion: AsignacionTutorado | null;
  onClose: () => void;
  tutorActivo: Tutor;
  onActualizacion: () => void;
}

export const DetalleTutoradoModal: React.FC<DetalleTutoradoModalProps> = ({
  asignacion,
  onClose,
  tutorActivo,
  onActualizacion
}) => {
  const [nuevoEstado, setNuevoEstado] = useState<EstadoTutorado>(asignacion?.estado || 'ACTIVO');
  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoNota, setTipoNota] = useState<NotaSeguimiento['tipo']>('Sesión Ordinaria');
  const [cargando, setCargando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);
  const [archivosAlumno, setArchivosAlumno] = useState<ArchivoSistema[]>([]);

  const cargarArchivos = async () => {
    if (asignacion) {
      const res = await tutoriaService.getArchivos({ tutoradoId: asignacion.estudianteId });
      if (res.data) setArchivosAlumno(res.data);
    }
  };

  useEffect(() => {
    if (asignacion) {
      setNuevoEstado(asignacion.estado);
      setConfirmarEliminar(false);
      setMensaje(null);
      cargarArchivos();
    }
  }, [asignacion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && asignacion) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asignacion, onClose]);

  if (!asignacion) return null;

  const estudiante = asignacion.estudiante;
  const estadoCfg = getEstadoConfig(asignacion.estado);

  const handleGuardarEstado = async () => {
    setCargando(true);
    setMensaje(null);
    try {
      const res = await tutoriaService.actualizarEstado(tutorActivo.id, asignacion.id, nuevoEstado);
      if (res.success) {
        setMensaje({ texto: `Estado actualizado a ${nuevoEstado} exitosamente.`, tipo: 'ok' });
        onActualizacion();
      } else {
        setMensaje({ texto: res.message, tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error al actualizar estado en la base de datos.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const handleAgregarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNota.trim()) return;

    setCargando(true);
    setMensaje(null);
    try {
      const res = await tutoriaService.agregarNota(tutorActivo.id, asignacion.id, tipoNota, nuevaNota.trim());
      if (res.success) {
        setNuevaNota('');
        setMensaje({ texto: 'Nota de seguimiento añadida a la bitácora.', tipo: 'ok' });
        onActualizacion();
      } else {
        setMensaje({ texto: res.message, tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error al registrar nota.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const handleDesasignar = async () => {
    setCargando(true);
    try {
      const res = await tutoriaService.desasignarTutorado(tutorActivo.id, asignacion.id);
      if (res.success) {
        onActualizacion();
        onClose();
      } else {
        setMensaje({ texto: res.message, tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error al desvincular estudiante.', tipo: 'error' });
    } finally {
      setCargando(false);
      setConfirmarEliminar(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Cabecera del Modal */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <AvatarWithFallback
              src={estudiante.avatar}
              alt={estudiante.nombre}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-2 ring-emerald-500/30 shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                  {estudiante.nombre}
                </h2>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${estadoCfg.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dotClass}`} />
                  <span>{estadoCfg.label}</span>
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-500/30">
                  <BookOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {formatSemestre(estudiante.semestre)}
                </span>
                <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{estudiante.matricula}</span>
                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">&bull;</span>
                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px] hidden sm:inline">{estudiante.carrera}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {mensaje && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 shadow-2xs ${
              mensaje.tipo === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/50 text-rose-800 dark:text-rose-200'
            }`}>
              {mensaje.tipo === 'ok' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-medium leading-relaxed">{mensaje.texto}</span>
            </div>
          )}

          {/* Grilla Académica y de Contacto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Semestre Escolar</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {formatSemestre(estudiante.semestre)}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Promedio General</span>
              <span className={`text-sm font-bold font-mono tabular-nums flex items-center gap-1 ${
                estudiante.promedio >= 8.5 ? 'text-emerald-600 dark:text-emerald-400' : estudiante.promedio >= 7.0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                <Award className="w-3.5 h-3.5" />
                {estudiante.promedio.toFixed(1)} / 10
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Ciclo Asignado</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {asignacion.periodoEscolar}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Contacto del Alumno</span>
              <div className="space-y-0.5">
                <a
                  href={`mailto:${estudiante.email}`}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline truncate block text-[11px]"
                  title={estudiante.email}
                >
                  {estudiante.email}
                </a>
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {estudiante.telefono}
                </span>
              </div>
            </div>
          </div>

          {/* Gestión del Estado de Asesoría */}
          <div className="bg-slate-50/60 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Actualizar Condición del Alumno</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Cambia el estado a <strong className="text-rose-600 dark:text-rose-400">EN RIESGO</strong> para alertar sobre reprobaciones o a <strong className="text-emerald-600 dark:text-emerald-400">ACTIVO</strong> para condición regular.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value as EstadoTutorado)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ACTIVO">ACTIVO (Regular)</option>
                <option value="EN_RIESGO">EN RIESGO (Prioritario)</option>
                <option value="CONDICIONADO">CONDICIONADO</option>
                <option value="CONCLUIDO">CONCLUIDO</option>
              </select>
              <button
                type="button"
                onClick={handleGuardarEstado}
                disabled={cargando || nuevoEstado === asignacion.estado}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>

          {/* Bitácora de Sesiones y Notas */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-heading font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Bitácora de Sesiones y Seguimiento ({asignacion.notas?.length || 0})</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Ciclo {asignacion.periodoEscolar}
              </span>
            </div>

            {/* Formulario para registrar una nueva nota */}
            <form onSubmit={handleAgregarNota} className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 mb-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Registrar Nueva Sesión:</span>
                <select
                  value={tipoNota}
                  onChange={(e) => setTipoNota(e.target.value as NotaSeguimiento['tipo'])}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="Sesión Ordinaria">Sesión Ordinaria</option>
                  <option value="Alerta Académica">Alerta Académica</option>
                  <option value="Canalización Psicológica">Canalización Psicológica</option>
                  <option value="Orientación Vocacional">Orientación Vocacional</option>
                </select>
              </div>

              <textarea
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                placeholder="Escribe los acuerdos alcanzados con el estudiante, tareas o compromisos..."
                rows={2}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={cargando || !nuevaNota.trim()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Añadir a Bitácora</span>
                </button>
              </div>
            </form>

            {/* Historial de notas */}
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {asignacion.notas && asignacion.notas.length > 0 ? (
                asignacion.notas.map((n) => (
                  <div key={n.id} className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/90 rounded-xl p-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-indigo-500/20">
                        {n.tipo}
                      </span>
                      <span className="font-mono text-slate-400">
                        {new Date(n.fecha).toLocaleDateString()} &bull; {new Date(n.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{n.contenido}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No hay sesiones ni notas registradas para este alumno aún.
                </div>
              )}
            </div>
          </div>

          {/* Desvincular Tutorado */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block">Desvincular Alumno de mi Tutela</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Remueve la relación en la base de datos para este ciclo escolar.
              </span>
            </div>

            {confirmarEliminar ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">¿Confirmar acción?</span>
                <button
                  type="button"
                  onClick={handleDesasignar}
                  disabled={cargando}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Sí, Desasignar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmarEliminar(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmarEliminar(true)}
                className="px-3.5 py-1.5 border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desvincular Alumno</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
