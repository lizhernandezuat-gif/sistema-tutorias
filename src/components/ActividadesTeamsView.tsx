import React, { useState, useEffect, useRef } from 'react';
import {
  ActividadAsignada,
  EntregaActividad,
  RolSimulado,
  Tutor,
  EstudianteCatalogo,
  EstadoEntregaActividad
} from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { descargarDocumento } from '../utils/tutoriaUtils';
import { AvatarWithFallback } from './AvatarWithFallback';
import {
  FileCheck,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  UploadCloud,
  Users,
  Search,
  Trash2,
  Edit3,
  X,
  Paperclip,
  Check,
  Eye,
  RefreshCw,
  Send,
  Calendar,
  FolderOpen,
  RotateCcw,
  MessageSquare
} from 'lucide-react';

interface ActividadesTeamsViewProps {
  rolActivo: RolSimulado;
  tutorActivo: Tutor;
  estudianteActivo: EstudianteCatalogo;
  catalogoEstudiantes: EstudianteCatalogo[];
}

export const ActividadesTeamsView: React.FC<ActividadesTeamsViewProps> = ({
  rolActivo,
  tutorActivo,
  estudianteActivo,
  catalogoEstudiantes
}) => {
  const [actividades, setActividades] = useState<ActividadAsignada[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mensajeAlerta, setMensajeAlerta] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);

  // Pestañas Alumno
  const [tabAlumno, setTabAlumno] = useState<'pendientes' | 'vencidas' | 'completadas'>('pendientes');

  // Pestañas Tutor
  const [tabTutor, setTabTutor] = useState<'activas' | 'programadas' | 'cerradas' | 'todas'>('activas');

  // Modal / Detalle de Entrega del Alumno (Soporta Nueva Entrega y Re-entrega / Edición)
  const [modalDetalleAlumnoAbierto, setModalDetalleAlumnoAbierto] = useState(false);
  const [actividadDetalleAlumno, setActividadDetalleAlumno] = useState<ActividadAsignada | null>(null);
  const [modoEdicionEntrega, setModoEdicionEntrega] = useState(false);
  const [archivoEntrega, setArchivoEntrega] = useState<{ nombre: string; dataUrl: string; tamano: string; tipo: string } | null>(null);
  const [comentariosEntrega, setComentariosEntrega] = useState('');
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const fileInputEntregaRef = useRef<HTMLInputElement>(null);

  // Modales Tutor
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [actividadAEditar, setActividadAEditar] = useState<ActividadAsignada | null>(null);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [actividadAEliminar, setActividadAEliminar] = useState<ActividadAsignada | null>(null);

  // Panel "Ver Entregas" (Tutor)
  const [modalEntregasAbierto, setModalEntregasAbierto] = useState(false);
  const [actividadSeleccionadaEntregas, setActividadSeleccionadaEntregas] = useState<ActividadAsignada | null>(null);
  const [filtroEntregasModal, setFiltroEntregasModal] = useState<'todos' | 'por_calificar' | 'revisadas' | 'sin_entrega'>('todos');

  // Modal para Calificar / Editar Calificación y Retroalimentación (Tutor)
  const [modalRevisarEntregaAbierto, setModalRevisarEntregaAbierto] = useState(false);
  const [entregaARevisar, setEntregaARevisar] = useState<EntregaActividad | null>(null);
  const [nuevoEstadoEntrega, setNuevoEstadoEntrega] = useState<EstadoEntregaActividad>('Revisada');
  const [retroalimentacionTutor, setRetroalimentacionTutor] = useState('');
  const [calificacionTutor, setCalificacionTutor] = useState('100/100');

  // Formulario Crear / Editar Actividad (Tutor)
  const [tituloForm, setTituloForm] = useState('');
  const [descripcionForm, setDescripcionForm] = useState('');
  const [instruccionesForm, setInstruccionesForm] = useState('');
  const [fechaLimiteForm, setFechaLimiteForm] = useState('');
  const [estudianteDestinoId, setEstudianteDestinoId] = useState('TODOS');
  const [archivoAdjuntoGuia, setArchivoAdjuntoGuia] = useState<{ nombre: string; dataUrl: string; tamano: string } | undefined>(undefined);
  const fileInputGuiaRef = useRef<HTMLInputElement>(null);

  const cargarActividades = async () => {
    setCargando(true);
    try {
      const res = await tutoriaService.getActividades();
      if (res.data) {
        setActividades(res.data);
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarActividades();
    const unsub = tutoriaService.subscribe(() => {
      cargarActividades();
    });
    return () => unsub();
  }, [tutorActivo.id, estudianteActivo.id]);

  // Sincronizar automáticamente la actividad abierta en el modal cuando cambia la lista de actividades
  useEffect(() => {
    if (actividadSeleccionadaEntregas) {
      const actual = actividades.find((a) => a.id === actividadSeleccionadaEntregas.id);
      if (actual) {
        setActividadSeleccionadaEntregas(actual);
      }
    }
  }, [actividades]);

  const mostrarAlerta = (texto: string, tipo: 'ok' | 'error' = 'ok') => {
    setMensajeAlerta({ texto, tipo });
    setTimeout(() => setMensajeAlerta(null), 3500);
  };

  const hoyStr = new Date().toISOString().split('T')[0];

  // Helper para determinar con precisión reactiva si una entrega ya fue revisada/evaluada
  const esEntregaRevisada = (entrega?: EntregaActividad | null): boolean => {
    if (!entrega) return false;
    if (entrega.estado === 'Revisada') return true;
    if (Boolean(entrega.calificacion && entrega.calificacion.trim())) return true;
    if (Boolean(entrega.retroalimentacionTutor && entrega.retroalimentacionTutor.trim())) return true;
    if (Boolean(entrega.fechaRevision)) return true;
    return false;
  };

  // Helper para determinar si una entrega está efectivamente pendiente por calificar
  const esEntregaPorCalificar = (entrega?: EntregaActividad | null): boolean => {
    if (!entrega) return false;
    // Si ya cuenta con calificación o retroalimentación guardada, NUNCA debe estar en "Por Calificar"
    if (esEntregaRevisada(entrega)) return false;
    return entrega.estado === 'Entregada' || entrega.estado === 'Pendiente';
  };

  const getEntregaAlumno = (act: ActividadAsignada) => {
    return act.entregas?.find((e) => e.estudianteId === estudianteActivo.id);
  };

  const getCategoriaAlumno = (act: ActividadAsignada): 'pendientes' | 'vencidas' | 'completadas' => {
    const entrega = getEntregaAlumno(act);
    if (entrega) {
      return 'completadas';
    }
    const esVencida = act.fechaLimite < hoyStr;
    if (esVencida) {
      return 'vencidas';
    }
    return 'pendientes';
  };

  const getCategoriaTutor = (act: ActividadAsignada): 'activas' | 'programadas' | 'cerradas' => {
    const esVencida = act.fechaLimite < hoyStr;
    if (esVencida) {
      return 'cerradas';
    }
    const fechaLimTime = new Date(act.fechaLimite + 'T23:59:59').getTime();
    const hoyTime = new Date(hoyStr + 'T00:00:00').getTime();
    const diasDiferencia = (fechaLimTime - hoyTime) / (1000 * 60 * 60 * 24);
    if (diasDiferencia > 10) {
      return 'programadas';
    }
    return 'activas';
  };

  const actividadesParaAlumno = actividades.filter(
    (act) => act.estudianteId === 'TODOS' || act.estudianteId === estudianteActivo.id
  );

  const conteoAlumnoPendientes = actividadesParaAlumno.filter((a) => getCategoriaAlumno(a) === 'pendientes').length;
  const conteoAlumnoVencidas = actividadesParaAlumno.filter((a) => getCategoriaAlumno(a) === 'vencidas').length;
  const conteoAlumnoCompletadas = actividadesParaAlumno.filter((a) => getCategoriaAlumno(a) === 'completadas').length;

  const conteoTutorActivas = actividades.filter((a) => a.fechaLimite >= hoyStr).length;
  const conteoTutorProgramadas = actividades.filter((a) => getCategoriaTutor(a) === 'programadas').length;
  const conteoTutorCerradas = actividades.filter((a) => a.fechaLimite < hoyStr).length;
  const conteoTutorTodas = actividades.length;

  const actividadesFiltradas = actividades.filter((act) => {
    if (rolActivo === 'ALUMNO') {
      const esParaEl = act.estudianteId === 'TODOS' || act.estudianteId === estudianteActivo.id;
      if (!esParaEl) return false;

      const catAlumno = getCategoriaAlumno(act);
      if (tabAlumno === 'pendientes' && catAlumno !== 'pendientes') return false;
      if (tabAlumno === 'vencidas' && catAlumno !== 'vencidas') return false;
      if (tabAlumno === 'completadas' && catAlumno !== 'completadas') return false;
    }

    if (rolActivo === 'TUTOR') {
      if (tabTutor === 'activas' && act.fechaLimite < hoyStr) return false;
      if (tabTutor === 'programadas' && getCategoriaTutor(act) !== 'programadas') return false;
      if (tabTutor === 'cerradas' && act.fechaLimite >= hoyStr) return false;
    }

    const q = busqueda.toLowerCase().trim();
    if (q) {
      const match =
        act.titulo.toLowerCase().includes(q) ||
        act.descripcion.toLowerCase().includes(q) ||
        (act.instruccionesDetalladas && act.instruccionesDetalladas.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const procesarArchivoEntrega = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setArchivoEntrega({
        nombre: file.name,
        dataUrl,
        tamano: `${(file.size / 1024).toFixed(1)} KB`,
        tipo: file.type || 'application/octet-stream'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSeleccionarArchivoEntrega = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivoEntrega(file);
  };

  const handleDropModal = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingModal(false);
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivoEntrega(file);
  };

  // Abrir modal de entrega para el alumno (modo visualización o nuevo envío)
  const abrirDetalleAlumno = (act: ActividadAsignada, forzarModoEdicion: boolean = false) => {
    const entrega = getEntregaAlumno(act);
    setActividadDetalleAlumno(act);
    setModoEdicionEntrega(!entrega || forzarModoEdicion);
    setArchivoEntrega(null);
    setComentariosEntrega(entrega?.comentariosEstudiante || '');
    setModalDetalleAlumnoAbierto(true);
  };

  // Enviar entrega inicial o Re-entregar (actualiza estado a "Entregada")
  const handleEntregarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividadDetalleAlumno) return;

    const entregaPrevia = getEntregaAlumno(actividadDetalleAlumno);
    const archivoFinal = archivoEntrega || entregaPrevia?.archivoAdjunto;

    if (!archivoFinal) {
      mostrarAlerta('Debes adjuntar un archivo para la entrega.', 'error');
      return;
    }

    const res = await tutoriaService.entregarActividad({
      actividadId: actividadDetalleAlumno.id,
      estudianteId: estudianteActivo.id,
      estudianteNombre: estudianteActivo.nombre,
      estudianteMatricula: estudianteActivo.matricula,
      comentariosEstudiante: comentariosEntrega.trim(),
      archivoAdjunto: archivoFinal
    });

    if (res.success) {
      mostrarAlerta(
        entregaPrevia
          ? 'Entrega actualizada correctamente. El estado se ha reestablecido a "Entregada".'
          : 'Tarea entregada con éxito.'
      );
      setModalDetalleAlumnoAbierto(false);
      setActividadDetalleAlumno(null);
      setArchivoEntrega(null);
      setComentariosEntrega('');
      setModoEdicionEntrega(false);
      await cargarActividades();
    } else {
      mostrarAlerta(res.message, 'error');
    }
  };

  // Guardar nueva actividad (Tutor)
  const handleCrearActividadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloForm.trim() || !fechaLimiteForm) {
      mostrarAlerta('Ingresa el título y la fecha límite.', 'error');
      return;
    }

    const res = await tutoriaService.crearActividad(
      {
        titulo: tituloForm.trim(),
        descripcion: descripcionForm.trim(),
        instruccionesDetalladas: instruccionesForm.trim(),
        fechaLimite: fechaLimiteForm,
        estudianteId: estudianteDestinoId,
        archivoAdjunto: archivoAdjuntoGuia
      },
      { id: tutorActivo.id, nombre: tutorActivo.nombre }
    );

    if (res.success) {
      mostrarAlerta(`Actividad publicada correctamente.`);
      setModalCrearAbierto(false);
      resetFormTutor();
      await cargarActividades();
    } else {
      mostrarAlerta(res.message, 'error');
    }
  };

  // Guardar edición de actividad (Tutor)
  const handleEditarActividadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividadAEditar) return;

    const res = await tutoriaService.editarActividad(
      {
        actividadId: actividadAEditar.id,
        titulo: tituloForm.trim(),
        descripcion: descripcionForm.trim(),
        instruccionesDetalladas: instruccionesForm.trim(),
        fechaLimite: fechaLimiteForm,
        estudianteId: estudianteDestinoId,
        archivoAdjunto: archivoAdjuntoGuia
      },
      tutorActivo.id
    );

    if (res.success) {
      mostrarAlerta('Actividad actualizada.');
      setModalEditarAbierto(false);
      setActividadAEditar(null);
      resetFormTutor();
      await cargarActividades();
    } else {
      mostrarAlerta(res.message, 'error');
    }
  };

  // Eliminar actividad (Tutor)
  const handleConfirmarEliminar = async () => {
    if (!actividadAEliminar) return;
    const res = await tutoriaService.eliminarActividad(actividadAEliminar.id, tutorActivo.id);
    if (res.success) {
      mostrarAlerta('Actividad eliminada.');
      setModalEliminarAbierto(false);
      setActividadAEliminar(null);
      await cargarActividades();
    } else {
      mostrarAlerta(res.message, 'error');
    }
  };

  // Abrir modal de calificación / edición para el Tutor
  const abrirModalCalificarEntrega = (entrega: EntregaActividad) => {
    setEntregaARevisar(entrega);
    // Al evaluar, por defecto debe quedar en 'Revisada' a menos que el docente seleccione 'Requiere Corrección'
    setNuevoEstadoEntrega(entrega.estado === 'Requiere Corrección' ? 'Requiere Corrección' : 'Revisada');
    setRetroalimentacionTutor(entrega.retroalimentacionTutor || '');
    setCalificacionTutor(entrega.calificacion || '100/100');
    setModalRevisarEntregaAbierto(true);
  };

  // Guardar o Editar Calificación y Retroalimentación (Tutor) con sincronización reactiva inmediata
  const handleGuardarRevisionEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividadSeleccionadaEntregas || !entregaARevisar) return;

    const calificacionFinal = calificacionTutor.trim();
    const retroFinal = retroalimentacionTutor.trim();
    const estadoFinal: EstadoEntregaActividad =
      nuevoEstadoEntrega === 'Requiere Corrección' ? 'Requiere Corrección' : 'Revisada';
    const ahoraIso = new Date().toISOString();

    const entregaActualizada: EntregaActividad = {
      ...entregaARevisar,
      estado: estadoFinal,
      calificacion: calificacionFinal,
      retroalimentacionTutor: retroFinal,
      fechaRevision: ahoraIso
    };

    // 1. Sincronización UI inmediata en la actividad abierta en el modal
    setActividadSeleccionadaEntregas((prev) => {
      if (!prev) return prev;
      const entregasPrevias = prev.entregas || [];
      const existe = entregasPrevias.some((ent) => ent.id === entregaActualizada.id);
      const nuevasEntregas = existe
        ? entregasPrevias.map((ent) => (ent.id === entregaActualizada.id ? entregaActualizada : ent))
        : [...entregasPrevias, entregaActualizada];
      return {
        ...prev,
        entregas: nuevasEntregas
      };
    });

    // 2. Sincronización UI inmediata en el listado general de actividades
    setActividades((prevList) =>
      prevList.map((act) => {
        if (act.id !== actividadSeleccionadaEntregas.id) return act;
        const entregasPrevias = act.entregas || [];
        const existe = entregasPrevias.some((ent) => ent.id === entregaActualizada.id);
        const nuevasEntregas = existe
          ? entregasPrevias.map((ent) => (ent.id === entregaActualizada.id ? entregaActualizada : ent))
          : [...entregasPrevias, entregaActualizada];
        return {
          ...act,
          entregas: nuevasEntregas
        };
      })
    );

    // 3. Mover automáticamente a la pestaña "Revisadas" de forma reactiva
    setFiltroEntregasModal('revisadas');

    // 4. Cerrar modal de evaluación
    setModalRevisarEntregaAbierto(false);
    setEntregaARevisar(null);

    mostrarAlerta(`Evaluación guardada para ${entregaARevisar.estudianteNombre}.`);

    // 5. Persistir en el servicio de tutoría
    try {
      const res = await tutoriaService.revisarEntregaActividad(
        {
          actividadId: actividadSeleccionadaEntregas.id,
          entregaId: entregaARevisar.id,
          estado: estadoFinal,
          retroalimentacionTutor: retroFinal,
          calificacion: calificacionFinal
        },
        tutorActivo.id
      );

      if (res.success) {
        await cargarActividades();
        const resAct = await tutoriaService.getActividades();
        const updated = resAct.data?.find((a) => a.id === actividadSeleccionadaEntregas.id);
        if (updated) {
          setActividadSeleccionadaEntregas(updated);
        }
      } else {
        mostrarAlerta(res.message, 'error');
      }
    } catch {
      mostrarAlerta('Error al persistir la evaluación.', 'error');
    }
  };

  // Aprobación rápida (Tutor) con sincronización reactiva inmediata
  const handleAprobarRapido = async (actId: string, entrega: EntregaActividad) => {
    const ahoraIso = new Date().toISOString();
    const entregaActualizada: EntregaActividad = {
      ...entrega,
      estado: 'Revisada',
      retroalimentacionTutor: 'Actividad revisada y aprobada satisfactoriamente.',
      calificacion: '100/100',
      fechaRevision: ahoraIso
    };

    // Actualización reactiva instantánea en modal y tarjetas
    setActividadSeleccionadaEntregas((prev) => {
      if (!prev || prev.id !== actId) return prev;
      const entregasPrevias = prev.entregas || [];
      const nuevasEntregas = entregasPrevias.map((ent) =>
        ent.id === entregaActualizada.id ? entregaActualizada : ent
      );
      return {
        ...prev,
        entregas: nuevasEntregas
      };
    });

    setActividades((prevList) =>
      prevList.map((act) => {
        if (act.id !== actId) return act;
        const entregasPrevias = act.entregas || [];
        const nuevasEntregas = entregasPrevias.map((ent) =>
          ent.id === entregaActualizada.id ? entregaActualizada : ent
        );
        return {
          ...act,
          entregas: nuevasEntregas
        };
      })
    );

    // Mover automáticamente a la pestaña "Revisadas"
    setFiltroEntregasModal('revisadas');

    mostrarAlerta(`Entrega de ${entrega.estudianteNombre} marcada como Revisada (100/100).`);

    try {
      const res = await tutoriaService.revisarEntregaActividad(
        {
          actividadId: actId,
          entregaId: entrega.id,
          estado: 'Revisada',
          retroalimentacionTutor: 'Actividad revisada y aprobada satisfactoriamente.',
          calificacion: '100/100'
        },
        tutorActivo.id
      );

      if (res.success) {
        await cargarActividades();
        const resAct = await tutoriaService.getActividades();
        const updated = resAct.data?.find((a) => a.id === actId);
        if (updated) {
          setActividadSeleccionadaEntregas(updated);
        }
      }
    } catch {
      mostrarAlerta('Error al persistir la revisión.', 'error');
    }
  };

  const abrirEditarModal = (act: ActividadAsignada) => {
    setActividadAEditar(act);
    setTituloForm(act.titulo);
    setDescripcionForm(act.descripcion);
    setInstruccionesForm(act.instruccionesDetalladas || '');
    setFechaLimiteForm(act.fechaLimite);
    setEstudianteDestinoId(act.estudianteId || 'TODOS');
    setArchivoAdjuntoGuia(act.archivoAdjunto);
    setModalEditarAbierto(true);
  };

  const resetFormTutor = () => {
    setTituloForm('');
    setDescripcionForm('');
    setInstruccionesForm('');
    setFechaLimiteForm('');
    setEstudianteDestinoId('TODOS');
    setArchivoAdjuntoGuia(undefined);
  };

  const handleSeleccionarGuia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setArchivoAdjuntoGuia({
        nombre: file.name,
        dataUrl,
        tamano: `${(file.size / 1024).toFixed(1)} KB`
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* ======================================================== */}
      {/* 1. CABECERA EJECUTIVA Y MINIMALISTA (SIN TEXTOS DE RELLENO)*/}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="h-1 bg-[#EE7402]" />

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EE7402]/10 text-[#EE7402]">
                UAT &bull; Tutorías
              </span>
              <span className="text-xs text-slate-400 font-mono">Ciclo 2026-1</span>
            </div>
            <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white mt-1">
              Actividades y Tareas
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {rolActivo === 'TUTOR' && (
              <button
                type="button"
                onClick={() => {
                  resetFormTutor();
                  const proxima = new Date();
                  proxima.setDate(proxima.getDate() + 7);
                  setFechaLimiteForm(proxima.toISOString().split('T')[0]);
                  setModalCrearAbierto(true);
                }}
                className="px-3.5 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nueva Actividad</span>
              </button>
            )}
            <button
              type="button"
              onClick={cargarActividades}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* PESTAÑAS DIRECTAS CON CONTADORES Y BUSCADOR */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
          {rolActivo === 'ALUMNO' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setTabAlumno('pendientes')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tabAlumno === 'pendientes'
                    ? 'bg-[#EE7402] text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Próximas / Pendientes</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/15">
                  {conteoAlumnoPendientes}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTabAlumno('vencidas')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tabAlumno === 'vencidas'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Vencidas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/15">
                  {conteoAlumnoVencidas}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTabAlumno('completadas')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tabAlumno === 'completadas'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completadas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/15">
                  {conteoAlumnoCompletadas}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setTabTutor('activas')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tabTutor === 'activas'
                    ? 'bg-[#EE7402] text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Activas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/15">
                  {conteoTutorActivas}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTabTutor('programadas')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tabTutor === 'programadas'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Programadas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/15">
                  {conteoTutorProgramadas}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTabTutor('cerradas')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tabTutor === 'cerradas'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Cerradas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/15">
                  {conteoTutorCerradas}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTabTutor('todas')}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  tabTutor === 'todas'
                    ? 'bg-slate-200 dark:bg-slate-700 font-bold text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todas ({conteoTutorTodas})
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="pl-7 pr-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs w-full sm:w-52 focus:outline-none focus:ring-1 focus:ring-[#EE7402]"
            />
          </div>
        </div>
      </div>

      {/* Alerta de notificación */}
      {mensajeAlerta && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            mensajeAlerta.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200'
          }`}
        >
          {mensajeAlerta.tipo === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{mensajeAlerta.texto}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TARJETAS DE ACTIVIDADES LIMPIAS Y DIRECTAS            */}
      {/* ======================================================== */}
      <div className="space-y-3">
        {actividadesFiltradas.length > 0 ? (
          actividadesFiltradas.map((act) => {
            const entregasCount = act.entregas?.length || 0;
            const revisadasCount = act.entregas?.filter((e) => esEntregaRevisada(e)).length || 0;
            const porCalificarCount = act.entregas?.filter((e) => esEntregaPorCalificar(e)).length || 0;
            const totalAsignadosCount =
              act.estudianteId === 'TODOS' ? catalogoEstudiantes.length : 1;

            const miEntrega = rolActivo === 'ALUMNO' ? getEntregaAlumno(act) : undefined;
            const esVencida = act.fechaLimite < hoyStr;

            let bordeEstilo = 'border-slate-200 dark:border-slate-800';
            let fondoAcento = 'bg-white dark:bg-slate-900';

            if (rolActivo === 'ALUMNO') {
              if (miEntrega) {
                bordeEstilo = 'border-emerald-300 dark:border-emerald-800/60';
                fondoAcento = 'bg-emerald-50/15 dark:bg-emerald-950/10';
              } else if (esVencida) {
                bordeEstilo = 'border-rose-300 dark:border-rose-900/60';
                fondoAcento = 'bg-rose-50/15 dark:bg-rose-950/10';
              } else {
                bordeEstilo = 'border-[#EE7402]/40 hover:border-[#EE7402]';
              }
            }

            return (
              <div
                key={act.id}
                className={`${fondoAcento} ${bordeEstilo} border rounded-xl p-4 sm:p-5 shadow-2xs space-y-3 transition-colors`}
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <span className="font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {act.estudianteId === 'TODOS' ? 'Grupal' : 'Individual'}
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                          esVencida
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Límite: {act.fechaLimite}</span>
                      </span>

                      {rolActivo === 'ALUMNO' && (
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-full ${
                            !miEntrega
                              ? esVencida
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : miEntrega.estado === 'Revisada'
                              ? 'bg-emerald-600 text-white'
                              : miEntrega.estado === 'Requiere Corrección'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-sky-600 text-white'
                          }`}
                        >
                          {!miEntrega ? (esVencida ? 'No Entregada' : 'Pendiente') : miEntrega.estado}
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      {act.titulo}
                    </h3>

                    {act.descripcion && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                        {act.descripcion}
                      </p>
                    )}
                  </div>

                  {rolActivo === 'TUTOR' && (
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={() => abrirEditarModal(act)}
                        className="p-1 rounded text-slate-500 hover:text-[#EE7402] hover:bg-orange-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActividadAEliminar(act);
                          setModalEliminarAbierto(true);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Material adjunto si existe */}
                {act.archivoAdjunto && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50/40 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/50 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-3.5 h-3.5 text-[#EE7402] shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate text-[11px]">
                        Guía: {act.archivoAdjunto.nombre}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => descargarDocumento(act.archivoAdjunto!.dataUrl, act.archivoAdjunto!.nombre)}
                      className="px-2 py-0.5 rounded text-[11px] font-bold text-[#EE7402] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Descargar</span>
                    </button>
                  </div>
                )}

                {/* SECCIÓN INFERIOR TUTOR: MÉTRICAS SÓLIDAS Y BOTÓN "VER ENTREGAS" */}
                {rolActivo === 'TUTOR' && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 🟠 Totales asignadas */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EE7402] text-white">
                        <Users className="w-3 h-3" />
                        <span>{totalAsignadosCount} Asignadas</span>
                      </span>

                      {/* 🔵 Por calificar */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          porCalificarCount > 0
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{porCalificarCount} Por calificar</span>
                      </span>

                      {/* 🟢 Revisadas */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                        <Check className="w-3 h-3" />
                        <span>{revisadasCount} Revisadas</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActividadSeleccionadaEntregas(act);
                        setFiltroEntregasModal('todos');
                        setModalEntregasAbierto(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Entregas ({entregasCount})</span>
                    </button>
                  </div>
                )}

                {/* SECCIÓN INFERIOR ALUMNO: ACCIONES DIRECTAS Y CAPACIDAD DE RE-ENTREGA */}
                {rolActivo === 'ALUMNO' && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div>
                      {miEntrega ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {miEntrega.archivoAdjunto.nombre}
                          </span>
                          {miEntrega.calificacion && (
                            <span className="px-2 py-0.5 rounded bg-[#EE7402] text-white font-bold text-[10px]">
                              Nota: {miEntrega.calificacion}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Sin entrega registrada</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {miEntrega ? (
                        <>
                          <button
                            type="button"
                            onClick={() => abrirDetalleAlumno(act, false)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ver Entrega</span>
                          </button>

                          {/* BOTÓN VOLVER A ENVIAR / EDITAR ENTREGA */}
                          <button
                            type="button"
                            onClick={() => abrirDetalleAlumno(act, true)}
                            className="px-3 py-1.5 rounded-lg bg-[#EE7402] hover:bg-[#D96200] text-white font-bold cursor-pointer text-xs flex items-center gap-1.5 shadow-2xs"
                            title="Reemplazar archivo o actualizar entrega"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Volver a Enviar</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => abrirDetalleAlumno(act, true)}
                          className="px-4 py-1.5 rounded-lg bg-[#EE7402] hover:bg-[#D96200] text-white font-bold cursor-pointer text-xs flex items-center gap-1.5 shadow-2xs"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Entregar Tarea</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No hay actividades en esta vista.
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL ALUMNO: DETALLE, ENTREGA Y RE-ENTREGA              */}
      {/* ======================================================== */}
      {modalDetalleAlumnoAbierto && actividadDetalleAlumno && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalDetalleAlumnoAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-6">
            <div className="p-4 bg-gradient-to-r from-[#EE7402] to-[#D96200] text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base">
                  {actividadDetalleAlumno.titulo}
                </h3>
                <span className="text-[11px] text-orange-100">
                  Límite: {actividadDetalleAlumno.fechaLimite} &bull; Tutor: {actividadDetalleAlumno.tutorNombre}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalleAlumnoAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Instrucciones */}
              {actividadDetalleAlumno.instruccionesDetalladas && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700 leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {actividadDetalleAlumno.instruccionesDetalladas}
                </div>
              )}

              {/* Guía oficial */}
              {actividadDetalleAlumno.archivoAdjunto && (
                <div className="p-2.5 bg-orange-50/40 dark:bg-orange-950/20 rounded-lg border border-orange-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-[#EE7402] shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {actividadDetalleAlumno.archivoAdjunto.nombre}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      descargarDocumento(
                        actividadDetalleAlumno.archivoAdjunto!.dataUrl,
                        actividadDetalleAlumno.archivoAdjunto!.nombre
                      )
                    }
                    className="text-[#EE7402] font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar Guía</span>
                  </button>
                </div>
              )}

              {/* ESTADO ACTUAL Y DICTAMEN (SI YA HABÍA ENTREGADO) */}
              {getEntregaAlumno(actividadDetalleAlumno) && (
                <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Entrega actual registrada</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                      {getEntregaAlumno(actividadDetalleAlumno)!.estado}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-emerald-200 dark:border-emerald-800">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                      {getEntregaAlumno(actividadDetalleAlumno)!.archivoAdjunto.nombre}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        descargarDocumento(
                          getEntregaAlumno(actividadDetalleAlumno)!.archivoAdjunto.dataUrl,
                          getEntregaAlumno(actividadDetalleAlumno)!.archivoAdjunto.nombre
                        )
                      }
                      className="text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Download className="w-3 h-3" />
                      <span>Descargar</span>
                    </button>
                  </div>

                  {getEntregaAlumno(actividadDetalleAlumno)!.retroalimentacionTutor && (
                    <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 space-y-1">
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="text-[#EE7402]">Comentarios del Tutor:</span>
                        {getEntregaAlumno(actividadDetalleAlumno)!.calificacion && (
                          <span className="px-1.5 py-0.2 rounded bg-[#EE7402] text-white text-[10px]">
                            {getEntregaAlumno(actividadDetalleAlumno)!.calificacion}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                        {getEntregaAlumno(actividadDetalleAlumno)!.retroalimentacionTutor}
                      </p>
                    </div>
                  )}

                  {!modoEdicionEntrega && (
                    <button
                      type="button"
                      onClick={() => setModoEdicionEntrega(true)}
                      className="w-full py-2 bg-orange-100 hover:bg-orange-200 dark:bg-slate-800 text-[#EE7402] font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Editar Entrega / Volver a Enviar Archivo</span>
                    </button>
                  )}
                </div>
              )}

              {/* FORMULARIO DE ENTREGA / RE-ENTREGA */}
              {modoEdicionEntrega && (
                <form onSubmit={handleEntregarSubmit} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {getEntregaAlumno(actividadDetalleAlumno) ? 'Reemplazar Entrega' : 'Adjuntar Archivo'}
                    </span>
                    {getEntregaAlumno(actividadDetalleAlumno) && (
                      <button
                        type="button"
                        onClick={() => setModoEdicionEntrega(false)}
                        className="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputEntregaRef}
                    onChange={handleSeleccionarArchivoEntrega}
                    className="hidden"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingModal(true);
                    }}
                    onDragLeave={() => setIsDraggingModal(false)}
                    onDrop={handleDropModal}
                    onClick={() => fileInputEntregaRef.current?.click()}
                    className={`p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                      isDraggingModal
                        ? 'border-[#EE7402] bg-[#EE7402]/10'
                        : archivoEntrega
                        ? 'border-emerald-500 bg-emerald-50/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-[#EE7402] bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 mx-auto mb-1 text-[#EE7402]" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      {archivoEntrega ? archivoEntrega.nombre : 'Haz clic o arrastra tu archivo (PDF, Word, Excel, Imagen)'}
                    </span>
                    {archivoEntrega && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {archivoEntrega.tamano}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Notas o Comentarios (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={comentariosEntrega}
                      onChange={(e) => setComentariosEntrega(e.target.value)}
                      placeholder="Observaciones sobre la entrega..."
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402] resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalDetalleAlumnoAbierto(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={!archivoEntrega && !getEntregaAlumno(actividadDetalleAlumno)}
                      className="px-4 py-1.5 bg-[#EE7402] hover:bg-[#D96200] disabled:opacity-40 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{getEntregaAlumno(actividadDetalleAlumno) ? 'Guardar y Volver a Enviar' : 'Enviar Tarea'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TUTOR: PANEL "VER ENTREGAS"                        */}
      {/* ======================================================== */}
      {modalEntregasAbierto && actividadSeleccionadaEntregas && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEntregasAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[85vh]">
            <div className="p-4 bg-gradient-to-r from-[#002B49] to-[#003860] text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base">
                  Entregas: {actividadSeleccionadaEntregas.titulo}
                </h3>
                <span className="text-[11px] text-orange-200">
                  Límite: {actividadSeleccionadaEntregas.fechaLimite}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalEntregasAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros rápidos del modal con contadores reactivos inmediatos */}
            {(() => {
              const alumnosRelevantesModal =
                actividadSeleccionadaEntregas.estudianteId === 'TODOS'
                  ? catalogoEstudiantes
                  : catalogoEstudiantes.filter((e) => e.id === actividadSeleccionadaEntregas.estudianteId);

              const entregasActuales = actividadSeleccionadaEntregas.entregas || [];
              const entregasMap = new Map<string, EntregaActividad>();
              entregasActuales.forEach((ent) => {
                entregasMap.set(ent.estudianteId, ent);
              });

              const conteoModalPorCalificar = alumnosRelevantesModal.filter((alumno) => {
                const ent = entregasMap.get(alumno.id);
                return esEntregaPorCalificar(ent);
              }).length;

              const conteoModalRevisadas = alumnosRelevantesModal.filter((alumno) => {
                const ent = entregasMap.get(alumno.id);
                return esEntregaRevisada(ent);
              }).length;

              const conteoModalSinEntrega = alumnosRelevantesModal.filter((alumno) => {
                const ent = entregasMap.get(alumno.id);
                return !ent;
              }).length;

              return (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFiltroEntregasModal('todos')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      filtroEntregasModal === 'todos'
                        ? 'bg-slate-800 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Todos ({alumnosRelevantesModal.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEntregasModal('por_calificar')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      filtroEntregasModal === 'por_calificar'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    Por Calificar ({conteoModalPorCalificar})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEntregasModal('revisadas')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      filtroEntregasModal === 'revisadas'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    Revisadas ({conteoModalRevisadas})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEntregasModal('sin_entrega')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                      filtroEntregasModal === 'sin_entrega'
                        ? 'bg-slate-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    Sin Entrega ({conteoModalSinEntrega})
                  </button>
                </div>
              );
            })()}

            {/* Listado de entregas */}
            <div className="p-4 space-y-2.5 overflow-y-auto flex-1 text-xs">
              {(() => {
                const alumnosRelevantes =
                  actividadSeleccionadaEntregas.estudianteId === 'TODOS'
                    ? catalogoEstudiantes
                    : catalogoEstudiantes.filter((e) => e.id === actividadSeleccionadaEntregas.estudianteId);

                const alumnosFiltrados = alumnosRelevantes.filter((alumno) => {
                  const entrega = actividadSeleccionadaEntregas.entregas?.find(
                    (e) => e.estudianteId === alumno.id
                  );
                  if (filtroEntregasModal === 'por_calificar') return esEntregaPorCalificar(entrega);
                  if (filtroEntregasModal === 'revisadas') return esEntregaRevisada(entrega);
                  if (filtroEntregasModal === 'sin_entrega') return !entrega;
                  return true;
                });

                if (alumnosFiltrados.length === 0) {
                  return (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No hay registros en este filtro.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {alumnosFiltrados.map((alumno) => {
                      const entrega = actividadSeleccionadaEntregas.entregas?.find(
                        (e) => e.estudianteId === alumno.id
                      );

                      return (
                        <div
                          key={alumno.id}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <AvatarWithFallback
                                src={alumno.avatar}
                                alt={alumno.nombre}
                                className="w-8 h-8 rounded-lg shrink-0"
                              />
                              <div>
                                <h4 className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                                  {alumno.nombre} &bull;{' '}
                                  <span className="font-mono text-slate-400 font-normal">
                                    {alumno.matricula}
                                  </span>
                                </h4>
                                <span className="text-[10px] text-slate-400">
                                  {alumno.carrera}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {entrega ? (
                                <>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      esEntregaRevisada(entrega)
                                        ? 'bg-emerald-600 text-white'
                                        : entrega.estado === 'Requiere Corrección'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-blue-600 text-white'
                                    }`}
                                  >
                                    {esEntregaRevisada(entrega) ? 'Revisada' : entrega.estado}
                                  </span>

                                  {entrega.calificacion && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#EE7402] text-white font-bold text-[10px]">
                                      {entrega.calificacion}
                                    </span>
                                  )}

                                  {!esEntregaRevisada(entrega) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAprobarRapido(actividadSeleccionadaEntregas.id, entrega)
                                      }
                                      className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold border border-emerald-300 text-[11px] cursor-pointer"
                                    >
                                      ✓ 100/100
                                    </button>
                                  )}

                                  {/* BOTÓN EVALUAR O EDITAR CALIFICACIÓN */}
                                  <button
                                    type="button"
                                    onClick={() => abrirModalCalificarEntrega(entrega)}
                                    className="px-2.5 py-1 rounded bg-[#EE7402] hover:bg-[#D96200] text-white font-bold text-[11px] cursor-pointer flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>
                                      {esEntregaRevisada(entrega) ? 'Editar Nota' : 'Evaluar'}
                                    </span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  Sin entrega
                                </span>
                              )}
                            </div>
                          </div>

                          {entrega && (
                            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-[11px]">
                              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                                {entrega.archivoAdjunto.nombre}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  descargarDocumento(
                                    entrega.archivoAdjunto.dataUrl,
                                    entrega.archivoAdjunto.nombre
                                  )
                                }
                                className="text-[#EE7402] font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Download className="w-3 h-3" />
                                <span>Descargar</span>
                              </button>
                            </div>
                          )}

                          {entrega?.retroalimentacionTutor && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-emerald-50/40 p-2 rounded border border-emerald-100">
                              <strong>Retroalimentación:</strong> {entrega.retroalimentacionTutor}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TUTOR: EVALUAR / EDITAR CALIFICACIÓN Y RETRO       */}
      {/* ======================================================== */}
      {modalRevisarEntregaAbierto && entregaARevisar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden my-6">
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm">
                  Evaluar Entrega: {entregaARevisar.estudianteNombre}
                </h3>
                <span className="text-[11px] text-emerald-100 font-mono">
                  {entregaARevisar.estudianteMatricula}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalRevisarEntregaAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarRevisionEntrega} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estatus *
                  </label>
                  <select
                    value={nuevoEstadoEntrega}
                    onChange={(e) => setNuevoEstadoEntrega(e.target.value as EstadoEntregaActividad)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Revisada">Revisada / Aprobada</option>
                    <option value="Requiere Corrección">Requiere Corrección</option>
                    <option value="Entregada">En Revisión</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Calificación
                  </label>
                  <input
                    type="text"
                    value={calificacionTutor}
                    onChange={(e) => setCalificacionTutor(e.target.value)}
                    placeholder="Ej. 100/100, 95/100"
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Retroalimentación al Alumno *
                </label>
                <textarea
                  rows={3}
                  required
                  value={retroalimentacionTutor}
                  onChange={(e) => setRetroalimentacionTutor(e.target.value)}
                  placeholder="Escribe comentarios u observaciones formativas..."
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalRevisarEntregaAbierto(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer"
                >
                  Guardar Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TUTOR: CREAR ACTIVIDAD                             */}
      {/* ======================================================== */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden my-6">
            <div className="p-4 bg-gradient-to-r from-[#EE7402] to-[#D96200] text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm sm:text-base">Nueva Actividad</h3>
              <button
                type="button"
                onClick={() => setModalCrearAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearActividadSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={tituloForm}
                  onChange={(e) => setTituloForm(e.target.value)}
                  placeholder="Título de la tarea o formato..."
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  value={descripcionForm}
                  onChange={(e) => setDescripcionForm(e.target.value)}
                  placeholder="Objetivo breve..."
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instrucciones Detalladas
                </label>
                <textarea
                  rows={3}
                  value={instruccionesForm}
                  onChange={(e) => setInstruccionesForm(e.target.value)}
                  placeholder="Paso a paso para el tutorado..."
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaLimiteForm}
                    onChange={(e) => setFechaLimiteForm(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asignar A
                  </label>
                  <select
                    value={estudianteDestinoId}
                    onChange={(e) => setEstudianteDestinoId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="TODOS">Todos (Grupal)</option>
                    {catalogoEstudiantes.map((es) => (
                      <option key={es.id} value={es.id}>
                        {es.nombre} ({es.matricula})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjuntar Guía / Plantilla (Opcional)
                </label>
                <input
                  type="file"
                  ref={fileInputGuiaRef}
                  onChange={handleSeleccionarGuia}
                  className="hidden"
                />
                {archivoAdjuntoGuia ? (
                  <div className="flex items-center justify-between p-2 rounded-lg border border-orange-200 bg-orange-50/50">
                    <span className="truncate">{archivoAdjuntoGuia.nombre}</span>
                    <button
                      type="button"
                      onClick={() => setArchivoAdjuntoGuia(undefined)}
                      className="text-rose-600 font-bold ml-2 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputGuiaRef.current?.click()}
                    className="w-full py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#EE7402] text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Seleccionar archivo...</span>
                  </button>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#EE7402] hover:bg-[#D96200] text-white font-bold rounded-lg cursor-pointer shadow-2xs"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TUTOR: EDITAR ACTIVIDAD                            */}
      {/* ======================================================== */}
      {modalEditarAbierto && actividadAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden my-6">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm">Editar Actividad</h3>
              <button
                type="button"
                onClick={() => setModalEditarAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditarActividadSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={tituloForm}
                  onChange={(e) => setTituloForm(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción</label>
                <input
                  type="text"
                  value={descripcionForm}
                  onChange={(e) => setDescripcionForm(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Instrucciones</label>
                <textarea
                  rows={3}
                  value={instruccionesForm}
                  onChange={(e) => setInstruccionesForm(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1">Fecha Límite *</label>
                  <input
                    type="date"
                    required
                    value={fechaLimiteForm}
                    onChange={(e) => setFechaLimiteForm(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Asignar A</label>
                  <select
                    value={estudianteDestinoId}
                    onChange={(e) => setEstudianteDestinoId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="TODOS">Todos (Grupal)</option>
                    {catalogoEstudiantes.map((es) => (
                      <option key={es.id} value={es.id}>
                        {es.nombre} ({es.matricula})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#EE7402] hover:bg-[#D96200] text-white font-bold rounded-lg cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TUTOR: ELIMINAR ACTIVIDAD                          */}
      {/* ======================================================== */}
      {modalEliminarAbierto && actividadAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-xl p-5 shadow-xl space-y-3">
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              Eliminar Actividad
            </h4>
            <p className="text-xs text-slate-500">
              ¿Confirmas eliminar &quot;{actividadAEliminar.titulo}&quot;?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setModalEliminarAbierto(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
