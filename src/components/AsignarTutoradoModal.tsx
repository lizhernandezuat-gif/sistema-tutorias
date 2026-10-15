import React, { useState, useEffect, useMemo } from 'react';
import { Tutor, EstadoTutorado, EstudianteCatalogo } from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { formatSemestre, getCarreraCorta } from '../utils/tutoriaUtils';
import { AvatarWithFallback } from './AvatarWithFallback';
import {
  UserPlus,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Calendar,
  Award,
  Check,
  Info,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface AsignarTutoradoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorActivo: Tutor;
  catalogoEstudiantes?: EstudianteCatalogo[];
  onAsignacionExitosa: () => void;
}

type ValidationStatus = 'idle' | 'valid' | 'invalid_format' | 'not_found' | 'already_assigned';

export const AsignarTutoradoModal: React.FC<AsignarTutoradoModalProps> = ({
  isOpen,
  onClose,
  tutorActivo,
  catalogoEstudiantes: propCatalogo,
  onAsignacionExitosa
}) => {
  const [identificador, setIdentificador] = useState('');
  const [touchedIdentificador, setTouchedIdentificador] = useState(false);
  const [periodoEscolar, setPeriodoEscolar] = useState('2026-1');
  const [estadoInicial, setEstadoInicial] = useState<EstadoTutorado>('ACTIVO');
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeErrorServidor, setMensajeErrorServidor] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [catalogoLocal, setCatalogoLocal] = useState<EstudianteCatalogo[]>([]);

  useEffect(() => {
    if (propCatalogo && propCatalogo.length > 0) {
      setCatalogoLocal(propCatalogo);
    } else {
      tutoriaService.getCatalogoEstudiantes().then(res => setCatalogoLocal(res));
    }
  }, [propCatalogo, isOpen]);

  const catalogoDisponible = propCatalogo && propCatalogo.length > 0 ? propCatalogo : catalogoLocal;


  // Escuchar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Al abrir/cerrar reiniciar estados
  useEffect(() => {
    if (!isOpen) {
      setIdentificador('');
      setTouchedIdentificador(false);
      setObservaciones('');
      setMensajeErrorServidor(null);
      setMensajeExito(null);
    }
  }, [isOpen]);

  // Buscar coincidencia en catálogo
  const estudianteEncontrado = useMemo<EstudianteCatalogo | null>(() => {
    const term = identificador.trim().toLowerCase();
    if (!term) return null;
    return catalogoDisponible.find(
      e => e.email.toLowerCase() === term || e.matricula.toLowerCase() === term
    ) || null;
  }, [identificador, catalogoDisponible]);

  // Sugerencias de autocompletado en tiempo real
  const sugerencias = useMemo<EstudianteCatalogo[]>(() => {
    const query = identificador.trim().toLowerCase();
    if (query.length < 2) return [];
    return catalogoDisponible.filter(e =>
      e.nombre.toLowerCase().includes(query) ||
      e.email.toLowerCase().includes(query) ||
      e.matricula.toLowerCase().includes(query)
    ).slice(0, 4);
  }, [identificador, catalogoDisponible]);


  // Validación interactiva en tiempo real del campo Identificador
  const validacion = useMemo<{ status: ValidationStatus; mensaje?: string }>(() => {
    const term = identificador.trim();
    if (!term) {
      return { status: 'idle' };
    }

    // Si coincide con un estudiante en el catálogo
    if (estudianteEncontrado) {
      return {
        status: 'valid',
        mensaje: `Estudiante verificado: ${estudianteEncontrado.nombre}`
      };
    }

    // Regla de sintaxis básica para correo o matrícula
    const esEmail = term.includes('@');
    const esMatriculaFormat = /^[0-9]{4}-[A-Za-z]{3,4}-[0-9]{3}$/.test(term);

    if (esEmail && !term.includes('@alumno.universidad.edu.mx') && !term.includes('.')) {
      return {
        status: 'invalid_format',
        mensaje: 'El correo debe tener formato institucional (ej. nombre@alumno.universidad.edu.mx).'
      };
    }

    if (term.length >= 3 && !esEmail && !esMatriculaFormat && !term.includes('-')) {
      return {
        status: 'invalid_format',
        mensaje: 'Formato sugerido de matrícula: YYYY-CARRERA-NUM (ej. 2024-ISC-099).'
      };
    }

    if (term.length >= 6) {
      return {
        status: 'not_found',
        mensaje: 'No se encontró ningún estudiante con esa matrícula o correo en el catálogo.'
      };
    }

    return { status: 'idle' };
  }, [identificador, estudianteEncontrado]);

  if (!isOpen) return null;

  const handleSeleccionarSugerencia = (est: EstudianteCatalogo) => {
    setIdentificador(est.email);
    setTouchedIdentificador(true);
    setMensajeErrorServidor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedIdentificador(true);
    setMensajeErrorServidor(null);
    setMensajeExito(null);

    if (!identificador.trim()) {
      setMensajeErrorServidor('Por favor ingresa la matrícula o correo institucional.');
      return;
    }

    if (validacion.status === 'invalid_format') {
      setMensajeErrorServidor('Corrige el formato del identificador antes de continuar.');
      return;
    }

    setCargando(true);
    try {
      const response = await tutoriaService.asignarTutorado(tutorActivo.id, {
        estudianteEmailOrMatricula: identificador.trim(),
        periodoEscolar,
        estadoInicial,
        observaciones: observaciones.trim()
      });

      if (response.success) {
        setMensajeExito(response.message);
        setTimeout(() => {
          onAsignacionExitosa();
          onClose();
        }, 1200);
      } else {
        setMensajeErrorServidor(response.message);
      }
    } catch {
      setMensajeErrorServidor('Ocurrió un error inesperado al procesar la asignación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Cabecera del Modal */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                Asignar Nuevo Tutorado
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px] sm:max-w-md">
                Vincular alumno a la tutela de <strong className="text-slate-700 dark:text-slate-200">{tutorActivo.nombre}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario con Validaciones Interactivas */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Mensaje de Error del Servidor */}
          {mensajeErrorServidor && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-100">No se pudo completar la asignación</p>
                <p className="mt-0.5 leading-relaxed">{mensajeErrorServidor}</p>
              </div>
            </div>
          )}

          {/* Mensaje de Éxito */}
          {mensajeExito && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="font-semibold">{mensajeExito}</p>
            </div>
          )}

          {/* CAMPO: IDENTIFICADOR CON VALIDACIÓN EN TIEMPO REAL (Requerimiento 4) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Matrícula o Correo Institucional <span className="text-rose-500">*</span>
              </label>
              {validacion.status === 'valid' && (
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Válido
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={identificador}
                onChange={(e) => {
                  setIdentificador(e.target.value);
                  setTouchedIdentificador(true);
                  setMensajeErrorServidor(null);
                }}
                onBlur={() => setTouchedIdentificador(true)}
                placeholder="Ej. 2024-ISC-099 o leonardo.fuentes@alumno.universidad.edu.mx"
                className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all ${
                  validacion.status === 'valid'
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-500 focus:ring-2 focus:ring-emerald-500/40'
                    : validacion.status === 'invalid_format' && touchedIdentificador
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-500 focus:ring-2 focus:ring-rose-500/40'
                    : validacion.status === 'not_found' && touchedIdentificador
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-500 focus:ring-2 focus:ring-amber-500/40'
                    : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500'
                }`}
                required
                autoFocus
              />

              {/* Icono de estado a la derecha */}
              <div className="absolute right-3 top-3 pointer-events-none flex items-center">
                {validacion.status === 'valid' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : validacion.status === 'invalid_format' && touchedIdentificador ? (
                  <XCircle className="w-4 h-4 text-rose-500" />
                ) : validacion.status === 'not_found' && touchedIdentificador ? (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                ) : (
                  <Search className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Mensaje de validación contextual */}
            {touchedIdentificador && validacion.mensaje && (
              <p
                className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                  validacion.status === 'valid'
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : validacion.status === 'invalid_format'
                    ? 'text-rose-600 dark:text-rose-400 font-medium'
                    : 'text-amber-600 dark:text-amber-400 font-medium'
                }`}
              >
                {validacion.status === 'valid' ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{validacion.mensaje}</span>
              </p>
            )}

            {/* Sugerencias de Autocompletado mientras escribe */}
            {sugerencias.length > 0 && !estudianteEncontrado && (
              <div className="mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1 shadow-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Sugerencias del Directorio:
                </span>
                {sugerencias.map((est) => (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => handleSeleccionarSugerencia(est)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarWithFallback
                        src={est.avatar}
                        alt={est.nombre}
                        className="w-7 h-7 rounded-md"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block truncate">
                          {est.nombre}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                          {est.matricula} &bull; {getCarreraCorta(est.carrera)}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md shrink-0 ml-2">
                      {formatSemestre(est.semestre)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* PREVISUALIZACIÓN EN TIEMPO REAL DEL ESTUDIANTE VERIFICADO */}
            {estudianteEncontrado && (
              <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/40 flex items-start justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <AvatarWithFallback
                    src={estudianteEncontrado.avatar}
                    alt={estudianteEncontrado.nombre}
                    className="w-12 h-12 rounded-xl ring-2 ring-emerald-500/30 shadow-xs shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {estudianteEncontrado.nombre}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verificado
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        {estudianteEncontrado.matricula}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                      <span>{estudianteEncontrado.carrera}</span>
                    </p>

                    <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                      {/* Etiqueta del Semestre */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        <BookOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {formatSemestre(estudianteEncontrado.semestre)}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                        <Award className="w-3 h-3 text-amber-500" />
                        Promedio: <strong className="text-slate-900 dark:text-white font-mono">{estudianteEncontrado.promedio.toFixed(1)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIdentificador('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors shrink-0"
                  title="Cambiar estudiante"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Periodo Escolar y Estado Inicial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Periodo Escolar / Ciclo <span className="text-rose-500">*</span>
              </label>
              <select
                value={periodoEscolar}
                onChange={(e) => setPeriodoEscolar(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                <option value="2026-1">2026-1 (Ciclo Actual Activo)</option>
                <option value="2026-2">2026-2 (Próximo Semestre)</option>
                <option value="2025-2">2025-2 (Periodo Anterior)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                La regla 1:N previene duplicar asesorías en el mismo periodo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Estado Inicial de Asesoría
              </label>
              <select
                value={estadoInicial}
                onChange={(e) => setEstadoInicial(e.target.value as EstadoTutorado)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                <option value="ACTIVO">ACTIVO (Regular)</option>
                <option value="EN_RIESGO">EN RIESGO (Alerta Temprana)</option>
                <option value="CONDICIONADO">CONDICIONADO (Seguimiento)</option>
                <option value="CONCLUIDO">CONCLUIDO (Finalizado)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Prioridad visual en el tablero de control.
              </p>
            </div>
          </div>

          {/* Observaciones con Contador de Caracteres */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Observaciones / Diagnóstico Inicial (Opcional)
              </label>
              <span className={`text-[10px] font-mono ${observaciones.length > 250 ? 'text-amber-500' : 'text-slate-400'}`}>
                {observaciones.length} / 300
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={300}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Solicitud voluntaria. El estudiante requiere apoyo para materias de cálculo..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Información de confirmación */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              El alumno será registrado bajo tu tutela para el periodo escolar seleccionado y tendrá acceso inmediato a tus horarios de asesoría.
            </p>
          </div>

          {/* Acciones del Modal */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando || (validacion.status !== 'valid' && identificador.trim().length === 0)}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {cargando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Validando y Guardando...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Completar Asignación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
