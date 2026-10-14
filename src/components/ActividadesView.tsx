import React, { useState, useEffect, useRef } from 'react';
import { ActividadAsignada, EstudianteCatalogo, RolSimulado, Tutor } from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { AvatarWithFallback } from './AvatarWithFallback';
import {
  FileCheck,
  PlusCircle,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Trash2,
  Eye,
  Download,
  Paperclip,
  UploadCloud,
  X,
  Users,
  User,
  GraduationCap,
  Sparkles,
  FileText,
  Filter,
  CheckCircle
} from 'lucide-react';

interface ActividadesViewProps {
  rolActivo: RolSimulado;
  tutorActivo: Tutor;
  estudianteActivo: EstudianteCatalogo;
  catalogoEstudiantes: EstudianteCatalogo[];
}

export const ActividadesView: React.FC<ActividadesViewProps> = ({
  rolActivo,
  tutorActivo,
  estudianteActivo,
  catalogoEstudiantes
}) => {
  const [actividades, setActividades] = useState<ActividadAsignada[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODAS' | 'Pendiente' | 'Entregada' | 'Revisada'>('TODAS');
  const [filtroDestinatario, setFiltroDestinatario] = useState<string>('TODOS');

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);

  // Actividad seleccionada para detalle/edición/eliminación
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadAsignada | null>(null);

  // Formulario Creación / Edición
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formFechaLimite, setFormFechaLimite] = useState('');
  const [formEstudianteId, setFormEstudianteId] = useState('TODOS');
  const [formEstado, setFormEstado] = useState<'Pendiente' | 'Entregada' | 'Revisada'>('Pendiente');
  const [formArchivoAdjunto, setFormArchivoAdjunto] = useState<{
    nombre: string;
    dataUrl: string;
    tamano: string;
  } | undefined>(undefined);

  // Formulario de Entrega (para Alumno)
  const [archivoEntrega, setArchivoEntrega] = useState<{
    nombre: string;
    dataUrl: string;
    tamano: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileEntregaRef = useRef<HTMLInputElement>(null);

  // Mensaje de notificación / toast
  const [mensajeNotificacion, setMensajeNotificacion] = useState<{
    tipo: 'ok' | 'error';
    texto: string;
  } | null>(null);

  const notificar = (tipo: 'ok' | 'error', texto: string) => {
    setMensajeNotificacion({ tipo, texto });
    setTimeout(() => setMensajeNotificacion(null), 4000);
  };

  const cargarActividades = async () => {
    setCargando(true);
    const filtros =
      rolActivo === 'TUTOR'
        ? { tutorId: tutorActivo.id }
        : { estudianteId: estudianteActivo.id };

    const res = await tutoriaService.getActividades(filtros);
    if (res.success && res.data) {
      setActividades(res.data);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarActividades();
    const unsub = tutoriaService.subscribe(() => {
      cargarActividades();
    });
    return () => unsub();
  }, [rolActivo, tutorActivo.id, estudianteActivo.id]);

  // Manejo de archivo adjunto en creación/edición
  const handleSeleccionarArchivoGuia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      notificar('error', 'El archivo no puede exceder los 15 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const bytes = file.size;
      const sizeStr = bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      setFormArchivoAdjunto({
        nombre: file.name,
        dataUrl: reader.result as string,
        tamano: sizeStr
      });
    };
    reader.readAsDataURL(file);
  };

  // Abrir Modal de Creación
  const handleAbrirCrear = () => {
    setFormTitulo('');
    setFormDescripcion('');
    // Fecha límite predeterminada: 7 días adelante
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setFormFechaLimite(d.toISOString().slice(0, 10));
    setFormEstudianteId('TODOS');
    setFormArchivoAdjunto(undefined);
    setModalCrearAbierto(true);
  };

  // Enviar Creación
  const handleSubmitCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formFechaLimite) {
      notificar('error', 'Por favor completa el título y la fecha límite.');
      return;
    }

    const res = await tutoriaService.crearActividad(
      {
        titulo: formTitulo.trim(),
        descripcion: formDescripcion.trim(),
        fechaLimite: formFechaLimite,
        estudianteId: formEstudianteId,
        archivoAdjunto: formArchivoAdjunto
      },
      {
        id: tutorActivo.id,
        nombre: tutorActivo.nombre
      }
    );

    if (res.success) {
      notificar('ok', `Actividad "${formTitulo}" asignada exitosamente.`);
      setModalCrearAbierto(false);
      cargarActividades();
    } else {
      notificar('error', res.message || 'Error al crear la actividad.');
    }
  };

  // Abrir Modal de Edición
  const handleAbrirEditar = (act: ActividadAsignada) => {
    setActividadSeleccionada(act);
    setFormTitulo(act.titulo);
    setFormDescripcion(act.descripcion);
    setFormFechaLimite(act.fechaLimite);
    setFormEstudianteId(act.estudianteId || 'TODOS');
    setFormEstado(act.estado);
    setFormArchivoAdjunto(act.archivoAdjunto);
    setModalEditarAbierto(true);
  };

  // Enviar Edición
  const handleSubmitEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividadSeleccionada) return;

    const res = await tutoriaService.editarActividad(actividadSeleccionada.id, {
      titulo: formTitulo.trim(),
      descripcion: formDescripcion.trim(),
      fechaLimite: formFechaLimite,
      estudianteId: formEstudianteId,
      estado: formEstado,
      archivoAdjunto: formArchivoAdjunto
    });

    if (res.success) {
      notificar('ok', `Actividad actualizada correctamente.`);
      setModalEditarAbierto(false);
      if (modalDetalleAbierto) {
        setActividadSeleccionada(res.data || null);
      }
      cargarActividades();
    } else {
      notificar('error', res.message || 'Error al actualizar la actividad.');
    }
  };

  // Confirmar Eliminación
  const handleConfirmarEliminar = async () => {
    if (!actividadSeleccionada) return;
    const res = await tutoriaService.eliminarActividad(actividadSeleccionada.id);
    if (res.success) {
      notificar('ok', 'Actividad eliminada con éxito.');
      setModalEliminarAbierto(false);
      setModalDetalleAbierto(false);
      setActividadSeleccionada(null);
      cargarActividades();
    } else {
      notificar('error', res.message || 'No fue posible eliminar la actividad.');
    }
  };

  // Cambio rápido de estado
  const handleCambiarEstadoRapido = async (act: ActividadAsignada, nuevoEstado: 'Pendiente' | 'Entregada' | 'Revisada') => {
    const res = await tutoriaService.actualizarEstadoActividad(act.id, nuevoEstado);
    if (res.success) {
      notificar('ok', `Estado actualizado a "${nuevoEstado}".`);
      cargarActividades();
    }
  };

  // Entrega de alumno
  const handleEntregarComoAlumno = async () => {
    if (!actividadSeleccionada) return;
    const res = await tutoriaService.actualizarEstadoActividad(actividadSeleccionada.id, 'Entregada');
    if (res.success) {
      notificar('ok', '¡Tu entrega ha sido enviada para revisión por tu tutor!');
      setModalDetalleAbierto(false);
      setArchivoEntrega(null);
      cargarActividades();
    }
  };

  // Filtrado de actividades
  const actividadesFiltradas = actividades.filter((act) => {
    const matchEstado = filtroEstado === 'TODAS' || act.estado === filtroEstado;
    const matchDest = filtroDestinatario === 'TODOS' || act.estudianteId === filtroDestinatario || act.estudianteId === 'TODOS';
    const q = busqueda.toLowerCase().trim();
    const matchBusqueda =
      !q ||
      act.titulo.toLowerCase().includes(q) ||
      act.descripcion.toLowerCase().includes(q) ||
      act.tutorNombre.toLowerCase().includes(q);

    return matchEstado && matchDest && matchBusqueda;
  });

  // Métricas
  const total = actividades.length;
  const pendientes = actividades.filter((a) => a.estado === 'Pendiente').length;
  const entregadas = actividades.filter((a) => a.estado === 'Entregada').length;
  const revisadas = actividades.filter((a) => a.estado === 'Revisada').length;

  const calcularDiasRestantes = (fechaLimiteStr: string) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(fechaLimiteStr + 'T00:00:00');
    const diffTime = limite.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================= */}
      {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES                     */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EE7402]/10 text-[#EE7402] border border-[#EE7402]/30 font-heading">
              {rolActivo === 'TUTOR' ? 'Gestión Tutorial UAT' : 'Acompañamiento Académico'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Ciclo 2026-1
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">
            {rolActivo === 'TUTOR'
              ? 'Actividades, Formatos y Tareas Académicas'
              : 'Mis Actividades y Tareas de Tutoría'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {rolActivo === 'TUTOR'
              ? 'Asigna actividades, formatos de diagnóstico inicial y da seguimiento puntual a las entregas de tus tutorados.'
              : 'Consulta las tareas asignadas por tu tutor, descarga formatos oficiales y registra tus avances de asesoría.'}
          </p>
        </div>

        {rolActivo === 'TUTOR' && (
          <button
            onClick={handleAbrirCrear}
            className="px-4 py-2.5 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all hover:scale-[1.01] cursor-pointer shrink-0 self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Actividad</span>
          </button>
        )}
      </div>

      {/* NOTIFICACIÓN TOAST */}
      {mensajeNotificacion && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-1 ${
            mensajeNotificacion.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          {mensajeNotificacion.tipo === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{mensajeNotificacion.texto}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TARJETAS DE KPI Y RESUMEN OPERATIVO                   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Actividades</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white mt-2">
            {total}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Programadas en plataforma</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pendientes</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-amber-600 dark:text-amber-400 mt-2">
            {pendientes}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">En curso de entrega</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Por Revisar</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-sky-600 dark:text-sky-400 mt-2">
            {entregadas}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Entregadas por alumnos</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Revisadas</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-extrabold text-2xl text-emerald-600 dark:text-emerald-400 mt-2">
            {revisadas}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Concluidas y validadas</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. BARRA DE FILTROS Y BÚSQUEDA                           */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Campo de Búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar actividad por título, descripción o docente..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
          />
        </div>

        {/* Pestañas de Estado */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          {(['TODAS', 'Pendiente', 'Entregada', 'Revisada'] as const).map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filtroEstado === est
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {est === 'TODAS' ? 'Todas' : est}
            </button>
          ))}
        </div>

        {/* Filtro por Alumno Destinatario (Sólo para Tutor) */}
        {rolActivo === 'TUTOR' && (
          <div className="shrink-0">
            <select
              value={filtroDestinatario}
              onChange={(e) => setFiltroDestinatario(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 cursor-pointer"
            >
              <option value="TODOS">Todos los destinatarios</option>
              {catalogoEstudiantes.map((es) => (
                <option key={es.id} value={es.id}>
                  {es.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. LISTADO DE ACTIVIDADES EN TARJETAS ELEGANTES           */}
      {/* ========================================================= */}
      {actividadesFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actividadesFiltradas.map((act) => {
            const diasRestantes = calcularDiasRestantes(act.fechaLimite);
            const esVencida = diasRestantes < 0 && act.estado === 'Pendiente';
            const venceHoy = diasRestantes === 0 && act.estado === 'Pendiente';

            // Datos del alumno destinatario si es individual
            const estudianteDestino =
              act.estudianteId && act.estudianteId !== 'TODOS'
                ? catalogoEstudiantes.find((e) => e.id === act.estudianteId)
                : null;

            return (
              <div
                key={act.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  {/* Fila superior: Estado + Fecha Límite */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          act.estado === 'Revisada'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : act.estado === 'Entregada'
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            act.estado === 'Revisada'
                              ? 'bg-emerald-500'
                              : act.estado === 'Entregada'
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span>{act.estado}</span>
                      </span>

                      {/* Pill de Destinatario */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {estudianteDestino ? estudianteDestino.nombre : 'Todos los tutorados'}
                      </span>
                    </div>

                    {/* Fecha Límite con Countdown */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                        {act.fechaLimite}
                      </span>
                      {esVencida && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.2 rounded border border-rose-200">
                          Vencida
                        </span>
                      )}
                      {venceHoy && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-200">
                          Vence hoy
                        </span>
                      )}
                      {!esVencida && !venceHoy && diasRestantes > 0 && diasRestantes <= 5 && (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          ({diasRestantes}d restantes)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Título de la Actividad */}
                  <div>
                    <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white group-hover:text-[#EE7402] transition-colors leading-snug">
                      {act.titulo}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {act.descripcion || 'Sin pautas adicionales especificadas.'}
                    </p>
                  </div>

                  {/* Archivo Adjunto / Guía Oficial (si tiene) */}
                  {act.archivoAdjunto && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3.5 h-3.5 text-[#EE7402] shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {act.archivoAdjunto.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          ({act.archivoAdjunto.tamano})
                        </span>
                      </div>
                      <a
                        href={act.archivoAdjunto.dataUrl}
                        download={act.archivoAdjunto.nombre}
                        className="text-[11px] font-semibold text-[#EE7402] hover:underline flex items-center gap-1 shrink-0 ml-2"
                        title="Descargar archivo guía"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Pie de la tarjeta con acciones */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    Docente: {act.tutorNombre}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Botón Ver Detalle */}
                    <button
                      type="button"
                      onClick={() => {
                        setActividadSeleccionada(act);
                        setModalDetalleAbierto(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Detalle</span>
                    </button>

                    {/* Acciones exclusivas del Tutor */}
                    {rolActivo === 'TUTOR' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAbrirEditar(act)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Editar actividad"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActividadSeleccionada(act);
                            setModalEliminarAbierto(true);
                          }}
                          className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                          title="Eliminar actividad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EE7402]/10 text-[#EE7402] flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            No se encontraron actividades
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {busqueda || filtroEstado !== 'TODAS'
              ? 'No hay actividades que coincidan con los filtros aplicados. Intenta restablecer la búsqueda.'
              : 'Aún no hay actividades o tareas registradas en este periodo escolar.'}
          </p>
          {rolActivo === 'TUTOR' && (
            <button
              onClick={handleAbrirCrear}
              className="mt-2 px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Asignar Primera Actividad</span>
            </button>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: CREAR NUEVA ACTIVIDAD (TUTOR)                   */}
      {/* ========================================================= */}
      {modalCrearAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalCrearAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Asignar Nueva Actividad / Tarea
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Define pautas, fecha límite y adjunta formatos institucionales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCrearAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCrear} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Actividad *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ej. Diagnóstico Inicial de Hábitos de Estudio"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instrucciones y Pautas para los Alumnos
                </label>
                <textarea
                  rows={3}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Escribe claramente los objetivos, formato de entrega y criterios de evaluación..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite de Entrega *
                  </label>
                  <input
                    type="date"
                    required
                    value={formFechaLimite}
                    onChange={(e) => setFormFechaLimite(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alumnos Destinatarios
                  </label>
                  <select
                    value={formEstudianteId}
                    onChange={(e) => setFormEstudianteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="TODOS">Todos mis tutorados</option>
                    {catalogoEstudiantes.map((es) => (
                      <option key={es.id} value={es.id}>
                        {es.nombre} ({es.matricula})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Adjuntar Archivo Guía Opcional */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjuntar Formato o Guía (Opcional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSeleccionarArchivoGuia}
                  className="hidden"
                />
                {formArchivoAdjunto ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-4 h-4 text-[#EE7402] shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-white truncate">
                        {formArchivoAdjunto.nombre}
                      </span>
                      <span className="text-[10px] text-slate-400">({formArchivoAdjunto.tamano})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormArchivoAdjunto(undefined)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:border-[#EE7402] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-[#EE7402]" />
                    <span>Seleccionar archivo (PDF, DOCX, Plantilla)</span>
                  </button>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Asignar Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: EDITAR ACTIVIDAD (TUTOR)                       */}
      {/* ========================================================= */}
      {modalEditarAbierto && actividadSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEditarAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Editar Actividad Institucional
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Modifica título, instrucciones, fecha de vencimiento o estado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditar} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Actividad *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instrucciones y Pautas
                </label>
                <textarea
                  rows={3}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite *
                  </label>
                  <input
                    type="date"
                    required
                    value={formFechaLimite}
                    onChange={(e) => setFormFechaLimite(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destinatarios
                  </label>
                  <select
                    value={formEstudianteId}
                    onChange={(e) => setFormEstudianteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="TODOS">Todos mis tutorados</option>
                    {catalogoEstudiantes.map((es) => (
                      <option key={es.id} value={es.id}>
                        {es.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Entregada">Entregada</option>
                    <option value="Revisada">Revisada</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL: DETALLE COMPLETO DE LA ACTIVIDAD                */}
      {/* ========================================================= */}
      {modalDetalleAbierto && actividadSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalDetalleAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-5">
            {/* Cabecera del Detalle */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      actividadSeleccionada.estado === 'Revisada'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : actividadSeleccionada.estado === 'Entregada'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {actividadSeleccionada.estado}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ID: {actividadSeleccionada.id}
                  </span>
                </div>
                <h3 className="font-heading font-extrabold text-lg text-slate-900 dark:text-white">
                  {actividadSeleccionada.titulo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalleAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ficha de datos clave */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Docente Tutor:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {actividadSeleccionada.tutorNombre}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Fecha Límite:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {actividadSeleccionada.fechaLimite}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Destinatario:</span>
                <span className="font-semibold text-[#EE7402]">
                  {actividadSeleccionada.estudianteId === 'TODOS'
                    ? 'Todos los alumnos'
                    : catalogoEstudiantes.find((e) => e.id === actividadSeleccionada.estudianteId)?.nombre || 'Alumno específico'}
                </span>
              </div>
            </div>

            {/* Instrucciones Detalladas */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Instrucciones de la Actividad:
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {actividadSeleccionada.descripcion || 'Sin instrucciones adicionales provistas.'}
              </div>
            </div>

            {/* Archivo Guía Adjunto */}
            {actividadSeleccionada.archivoAdjunto && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Formato Oficial / Material de Apoyo:
                </h4>
                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#EE7402]" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {actividadSeleccionada.archivoAdjunto.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({actividadSeleccionada.archivoAdjunto.tamano})
                    </span>
                  </div>
                  <a
                    href={actividadSeleccionada.archivoAdjunto.dataUrl}
                    download={actividadSeleccionada.archivoAdjunto.nombre}
                    className="px-3 py-1 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Guía</span>
                  </a>
                </div>
              </div>
            )}

            {/* SECCIÓN DE ENTREGA (PARA EL ALUMNO) */}
            {rolActivo === 'ALUMNO' && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-[#EE7402]" />
                    <span>Mi Entrega de Actividad</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Estado: <strong className="text-[#EE7402]">{actividadSeleccionada.estado}</strong>
                  </span>
                </div>

                {actividadSeleccionada.estado === 'Revisada' ? (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Esta actividad ya fue validada y revisada por tu tutor docente.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileEntregaRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setArchivoEntrega({
                            nombre: file.name,
                            dataUrl: reader.result as string,
                            tamano: `${(file.size / 1024).toFixed(1)} KB`
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {archivoEntrega ? (
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-[#EE7402]" />
                          <span className="font-medium text-slate-900 dark:text-white">
                            {archivoEntrega.nombre}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setArchivoEntrega(null)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileEntregaRef.current?.click()}
                        className="w-full py-2 px-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:border-[#EE7402] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-[#EE7402]" />
                        <span>Adjuntar archivo resuelto (PDF, DOCX, etc.)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleEntregarComoAlumno}
                      className="w-full py-2.5 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      {actividadSeleccionada.estado === 'Entregada' ? 'Reenviar Entrega' : 'Enviar Tarea al Tutor'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Botones del Tutor para cambiar estado directamente */}
            {rolActivo === 'TUTOR' && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Marcar como:</span>
                  <button
                    type="button"
                    onClick={() => handleCambiarEstadoRapido(actividadSeleccionada, 'Revisada')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer border border-emerald-200 dark:border-emerald-800"
                  >
                    Revisada
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCambiarEstadoRapido(actividadSeleccionada, 'Pendiente')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-400 font-semibold cursor-pointer border border-amber-200 dark:border-amber-800"
                  >
                    Pendiente
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalDetalleAbierto(false);
                      handleAbrirEditar(actividadSeleccionada);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalDetalleAbierto(false)}
                    className="px-3.5 py-1.5 bg-[#EE7402] text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MODAL DE CONFIRMACIÓN PARA ELIMINAR ACTIVIDAD          */}
      {/* ========================================================= */}
      {modalEliminarAbierto && actividadSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEliminarAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Eliminar Actividad
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ¿Estás seguro de eliminar &ldquo;{actividadSeleccionada.titulo}&rdquo;? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalEliminarAbierto(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
