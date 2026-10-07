import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArchivoSistema,
  ActividadAsignada,
  RolSimulado,
  Tutor,
  EstudianteCatalogo,
  CategoriaArchivo,
  EstadoRevisionArchivo,
  EditarArchivoPayload
} from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import {
  dataUrlToBlob,
  descargarDocumento,
  decodeTextFromDataUrl
} from '../utils/tutoriaUtils';
import {
  UploadCloud,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit3,
  Search,
  PlusCircle,
  FileCheck,
  FolderOpen,
  Calendar,
  X,
  MessageSquare,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface ArchivosEvidenciasViewProps {
  rolActivo: RolSimulado;
  tutorActivo: Tutor;
  estudianteActivo: EstudianteCatalogo;
  catalogoEstudiantes: EstudianteCatalogo[];
}

export const ArchivosEvidenciasView: React.FC<ArchivosEvidenciasViewProps> = ({
  rolActivo,
  tutorActivo,
  estudianteActivo,
  catalogoEstudiantes
}) => {
  const [archivos, setArchivos] = useState<ArchivoSistema[]>([]);
  const [actividades, setActividades] = useState<ActividadAsignada[]>([]);
  const [cargando, setCargando] = useState(false);
  const [tabActiva, setTabActiva] = useState<'archivos' | 'actividades'>('archivos');

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 8;

  // Notificación de Alerta
  const [mensajeAlerta, setMensajeAlerta] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);

  // Modales Principales
  const [modalSubirAbierto, setModalSubirAbierto] = useState(false);
  const [modalActividadAbierto, setModalActividadAbierto] = useState(false);
  const [modalRevisarAbierto, setModalRevisarAbierto] = useState(false);
  const [archivoSeleccionadoRevisar, setArchivoSeleccionadoRevisar] = useState<ArchivoSistema | null>(null);

  // Modal Visor de Documentos
  const [modalVisorAbierto, setModalVisorAbierto] = useState(false);
  const [archivoAVisualizar, setArchivoAVisualizar] = useState<ArchivoSistema | null>(null);
  const [blobUrlActual, setBlobUrlActual] = useState<string>('');
  const [textoDecodificado, setTextoDecodificado] = useState<string | null>(null);
  const [zoomImagen, setZoomImagen] = useState<number>(100);
  const [copiadoTexto, setCopiadoTexto] = useState(false);

  // Modal Confirmación de Eliminación
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [archivoAEliminar, setArchivoAEliminar] = useState<ArchivoSistema | null>(null);
  const [eliminandoArchivo, setEliminandoArchivo] = useState(false);

  // Modal Edición de Archivo
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [archivoAEditar, setArchivoAEditar] = useState<ArchivoSistema | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCategoria, setEditCategoria] = useState<CategoriaArchivo>('Evidencia');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editComentarioTutor, setEditComentarioTutor] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Formulario Subir Archivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [archivoDataUrl, setArchivoDataUrl] = useState<string>('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [categoriaSubida, setCategoriaSubida] = useState<CategoriaArchivo>(
    rolActivo === 'TUTOR' ? 'Material de Apoyo' : 'Evidencia'
  );
  const [descripcionSubida, setDescripcionSubida] = useState('');
  const [alumnoAsignadoId, setAlumnoAsignadoId] = useState(estudianteActivo.id);
  const [subiendo, setSubiendo] = useState(false);
  const [isDraggingModal, setIsDraggingModal] = useState(false);

  // Formulario Revisar (Tutor)
  const [nuevoEstadoRevision, setNuevoEstadoRevision] = useState<EstadoRevisionArchivo>('Aprobado');
  const [comentarioRevision, setComentarioRevision] = useState('');

  // Formulario Nueva Actividad (Tutor)
  const [actTitulo, setActTitulo] = useState('');
  const [actDescripcion, setActDescripcion] = useState('');
  const [actFechaLimite, setActFechaLimite] = useState('2026-10-30');
  const [actEstudianteId, setActEstudianteId] = useState('TODOS');
  const [guardandoActividad, setGuardandoActividad] = useState(false);

  // Carga de datos reactiva y persistente
  const cargarDatos = async () => {
    setCargando(true);
    const filtrosArchivos =
      rolActivo === 'TUTOR'
        ? { tutorId: tutorActivo.id }
        : { tutoradoId: estudianteActivo.id };

    const resArchivos = await tutoriaService.getArchivos(filtrosArchivos);
    if (resArchivos.success && resArchivos.data) {
      setArchivos(resArchivos.data);
    }

    const resAct = await tutoriaService.getActividades({
      tutorId: rolActivo === 'TUTOR' ? tutorActivo.id : undefined,
      estudianteId: rolActivo === 'ALUMNO' ? estudianteActivo.id : undefined
    });
    if (resAct.success && resAct.data) {
      setActividades(resAct.data);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
    const unsub = tutoriaService.subscribe(() => {
      cargarDatos();
    });
    return () => unsub();
  }, [rolActivo, tutorActivo.id, estudianteActivo.id]);

  // Selección de archivo en formulario modal
  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoFile(file);
      setNombreArchivo(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setArchivoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop dentro del modal de subida
  const handleDropModal = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingModal(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setArchivoFile(file);
      setNombreArchivo(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setArchivoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Subir Archivo
  const handleSubirArchivoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreArchivo.trim() || !archivoDataUrl) {
      setMensajeAlerta({ texto: 'Por favor selecciona un archivo para cargar.', tipo: 'error' });
      return;
    }

    setSubiendo(true);
    const autor =
      rolActivo === 'TUTOR'
        ? { id: tutorActivo.id, nombre: tutorActivo.nombre, rol: 'TUTOR' as const }
        : { id: estudianteActivo.id, nombre: estudianteActivo.nombre, rol: 'TUTORADO' as const };

    const res = await tutoriaService.subirArchivo(
      {
        nombre: nombreArchivo.trim(),
        tipo: archivoFile?.type || 'application/octet-stream',
        tamano: archivoFile?.size || 1024,
        contenidoDataUrl: archivoDataUrl,
        categoria: categoriaSubida,
        descripcion: descripcionSubida,
        tutoradoId: rolActivo === 'ALUMNO' ? estudianteActivo.id : alumnoAsignadoId,
        tutorId: tutorActivo.id
      },
      autor
    );

    setSubiendo(false);
    if (res.success) {
      setMensajeAlerta({ texto: 'Documento cargado exitosamente en el expediente institucional.', tipo: 'ok' });
      setTimeout(() => {
        setModalSubirAbierto(false);
        setMensajeAlerta(null);
        setArchivoFile(null);
        setArchivoDataUrl('');
        setNombreArchivo('');
        setDescripcionSubida('');
      }, 900);
      cargarDatos();
    } else {
      setMensajeAlerta({ texto: res.message, tipo: 'error' });
    }
  };

  // Guardar Revisión Docente (Tutor)
  const handleGuardarRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoSeleccionadoRevisar) return;

    const res = await tutoriaService.revisarArchivo(
      {
        archivoId: archivoSeleccionadoRevisar.id,
        estadoRevision: nuevoEstadoRevision,
        comentarioTutor: comentarioRevision
      },
      tutorActivo.id
    );

    if (res.success) {
      setModalRevisarAbierto(false);
      setArchivoSeleccionadoRevisar(null);
      setComentarioRevision('');
      setMensajeAlerta({ texto: 'Dictamen de revisión guardado exitosamente.', tipo: 'ok' });
      setTimeout(() => setMensajeAlerta(null), 2500);
      cargarDatos();
    }
  };

  // Crear Actividad (Tutor)
  const handleCrearActividadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitulo.trim() || !actFechaLimite) return;

    setGuardandoActividad(true);
    const res = await tutoriaService.crearActividad(
      {
        titulo: actTitulo.trim(),
        descripcion: actDescripcion.trim(),
        fechaLimite: actFechaLimite,
        estudianteId: actEstudianteId
      },
      { id: tutorActivo.id, nombre: tutorActivo.nombre }
    );
    setGuardandoActividad(false);

    if (res.success) {
      setModalActividadAbierto(false);
      setActTitulo('');
      setActDescripcion('');
      setMensajeAlerta({ texto: 'Actividad asignada y publicada a los tutorados.', tipo: 'ok' });
      setTimeout(() => setMensajeAlerta(null), 2500);
      cargarDatos();
    }
  };

  // Abrir Visor de Archivos
  const handleAbrirVisor = (archivo: ArchivoSistema) => {
    setArchivoAVisualizar(archivo);
    setZoomImagen(100);
    setCopiadoTexto(false);

    const esTexto =
      archivo.tipo.startsWith('text/') ||
      archivo.nombre.match(/\.(txt|md|csv|json|js|ts|py|sql|html|css|xml|log|ini|env)$/i);

    if (esTexto && archivo.contenidoDataUrl) {
      const decoded = decodeTextFromDataUrl(archivo.contenidoDataUrl);
      setTextoDecodificado(decoded);
    } else {
      setTextoDecodificado(null);
    }

    const blob = dataUrlToBlob(archivo.contenidoDataUrl);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setBlobUrlActual(url);
    } else {
      setBlobUrlActual(archivo.contenidoDataUrl || '');
    }
    setModalVisorAbierto(true);
  };

  // Cerrar Visor de Archivos
  const handleCerrarVisor = () => {
    setModalVisorAbierto(false);
    if (blobUrlActual && blobUrlActual.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlActual);
    }
    setBlobUrlActual('');
    setArchivoAVisualizar(null);
    setTextoDecodificado(null);
  };

  // Abrir Modal de Edición
  const handlePedirEditar = (archivo: ArchivoSistema) => {
    setArchivoAEditar(archivo);
    setEditNombre(archivo.nombre);
    setEditCategoria(archivo.categoria);
    setEditDescripcion(archivo.descripcion || '');
    setEditComentarioTutor(archivo.comentarioTutor || '');
    setModalEditarAbierto(true);
  };

  // Guardar Cambios de Edición
  const handleGuardarEdicionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoAEditar || !editNombre.trim()) return;

    setGuardandoEdicion(true);
    const payload: EditarArchivoPayload = {
      archivoId: archivoAEditar.id,
      nombre: editNombre.trim(),
      categoria: editCategoria,
      descripcion: editDescripcion.trim(),
      comentarioTutor: rolActivo === 'TUTOR' ? editComentarioTutor.trim() : undefined
    };

    const res = await tutoriaService.editarArchivo(payload, {
      id: rolActivo === 'TUTOR' ? tutorActivo.id : estudianteActivo.id,
      rol: rolActivo === 'TUTOR' ? 'TUTOR' : 'TUTORADO'
    });

    setGuardandoEdicion(false);
    if (res.success) {
      setModalEditarAbierto(false);
      setArchivoAEditar(null);
      setMensajeAlerta({ texto: 'Documento actualizado con éxito.', tipo: 'ok' });
      setTimeout(() => setMensajeAlerta(null), 2500);
      cargarDatos();
    } else {
      setMensajeAlerta({ texto: res.message || 'Error al actualizar documento.', tipo: 'error' });
      setTimeout(() => setMensajeAlerta(null), 3000);
    }
  };

  // Abrir Modal de Confirmación de Borrado
  const handlePedirEliminar = (archivo: ArchivoSistema) => {
    setArchivoAEliminar(archivo);
    setModalEliminarAbierto(true);
  };

  // Ejecutar Borrado con Persistencia
  const handleEjecutarEliminacion = async () => {
    if (!archivoAEliminar) return;
    const targetId = archivoAEliminar.id;
    setEliminandoArchivo(true);

    // Actualización visual reactiva instantánea
    setArchivos((prev) => prev.filter((a) => a.id !== targetId));

    const res = await tutoriaService.eliminarArchivo(targetId, {
      id: rolActivo === 'TUTOR' ? tutorActivo.id : estudianteActivo.id,
      rol: rolActivo === 'TUTOR' ? 'TUTOR' : 'TUTORADO'
    });

    setEliminandoArchivo(false);
    setModalEliminarAbierto(false);
    setArchivoAEliminar(null);

    if (res.success) {
      setMensajeAlerta({ texto: 'Documento eliminado correctamente del expediente.', tipo: 'ok' });
    } else {
      setMensajeAlerta({ texto: res.message || 'Error al eliminar el archivo.', tipo: 'error' });
    }
    setTimeout(() => setMensajeAlerta(null), 3000);
    cargarDatos();
  };

  // Descarga de Documento
  const handleDescargar = (archivo: ArchivoSistema) => {
    descargarDocumento(archivo.contenidoDataUrl, archivo.nombre);
  };

  // Copiar Texto al Portapapeles
  const handleCopiarAlPortapapeles = (texto: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoTexto(true);
      setTimeout(() => setCopiadoTexto(false), 2000);
    });
  };

  // Icono según extensión de archivo con código de color de alta visibilidad
  const getIconoArchivo = (nombre: string, tipo: string) => {
    if (tipo.startsWith('image/') || nombre.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) {
      return (
        <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-[#EE7402] border border-[#EE7402]/30 flex items-center justify-center shrink-0 shadow-2xs">
          <Eye className="w-4 h-4" />
        </div>
      );
    }
    if (tipo === 'application/pdf' || nombre.endsWith('.pdf')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 border border-rose-300 dark:border-rose-800 flex items-center justify-center shrink-0 shadow-2xs">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (nombre.match(/\.(docx|doc|rtf|odt)$/i)) {
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 border border-blue-300 dark:border-blue-800 flex items-center justify-center shrink-0 shadow-2xs">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (nombre.match(/\.(xlsx|xls|csv)$/i)) {
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
      );
    }
    if (nombre.match(/\.(zip|rar|7z|tar|gz)$/i)) {
      return (
        <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 border border-purple-300 dark:border-purple-800 flex items-center justify-center shrink-0 shadow-2xs">
          <FileArchive className="w-4 h-4" />
        </div>
      );
    }
    if (nombre.match(/\.(js|ts|py|sql|html|css|json|md|txt)$/i)) {
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 border border-amber-300 dark:border-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
          <FileCode className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
        <FileText className="w-4 h-4" />
      </div>
    );
  };

  // Filtrado de Documentos
  const archivosFiltrados = useMemo(() => {
    return archivos.filter((archivo) => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda =
        !q ||
        archivo.nombre.toLowerCase().includes(q) ||
        archivo.autorNombre.toLowerCase().includes(q) ||
        (archivo.descripcion && archivo.descripcion.toLowerCase().includes(q));

      const matchCat = filtroCategoria === 'TODAS' || archivo.categoria === filtroCategoria;
      const matchEst = filtroEstado === 'TODOS' || archivo.estadoRevision === filtroEstado;

      return matchBusqueda && matchCat && matchEst;
    });
  }, [archivos, busqueda, filtroCategoria, filtroEstado]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(archivosFiltrados.length / elementosPorPagina));
  const archivosPaginados = archivosFiltrados.slice(
    (paginaActual - 1) * elementosPorPagina,
    paginaActual * elementosPorPagina
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroCategoria, filtroEstado]);

  const conteoPendientes = archivos.filter((a) => a.estadoRevision === 'Pendiente').length;
  const conteoAprobados = archivos.filter((a) => a.estadoRevision === 'Aprobado').length;
  const conteoRevision = archivos.filter((a) => a.estadoRevision === 'En Revisión').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. CABECERA INSTITUCIONAL ESTRUCTURADA (UAT BRAND BLOCK & VIBRANT STATS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Franja superior institucional UAT */}
        <div className="h-1.5 bg-gradient-to-r from-[#EE7402] via-[#F59E0B] to-[#EE7402]" />

        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-b from-orange-50/20 to-transparent dark:from-slate-900 dark:to-slate-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#EE7402] text-white font-heading shadow-2xs">
                UAT &middot; Gestión Documental
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Expediente Digital de Tutorías 2026
              </span>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1.5 tracking-tight">
              {rolActivo === 'TUTOR'
                ? 'Gestión de Documentos y Evidencias Institucionales'
                : 'Expediente Documental y Evidencias de Tutoría'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {rolActivo === 'TUTOR'
                ? 'Administra formatos oficiales, evalúa evidencias y emite dictámenes de seguimiento formativo.'
                : `Consulta y sube tus comprobantes académicos y avances de titulación para la revisión de tu tutor ${tutorActivo.nombre}.`}
            </p>
          </div>

          {/* Acciones principales centralizadas sin saturación */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {rolActivo === 'TUTOR' && (
              <button
                type="button"
                onClick={() => {
                  setActTitulo('');
                  setActDescripcion('');
                  setModalActividadAbierto(true);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <PlusCircle className="w-4 h-4 text-[#EE7402]" />
                <span>+ Asignar Tarea</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setModalSubirAbierto(true);
                setNombreArchivo('');
                setArchivoDataUrl('');
                setArchivoFile(null);
                setDescripcionSubida('');
              }}
              className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-[1.01] cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{rolActivo === 'TUTOR' ? 'Subir Formato Oficial' : 'Subir Documento'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Contadores Rápidos con Colores Vivos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-xs">
          <div className="p-3.5 sm:px-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Total en Expediente</span>
              <span className="text-base sm:text-lg font-heading font-black text-slate-900 dark:text-white">
                {archivos.length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 sm:px-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">Por Revisar</span>
              <span className="text-base sm:text-lg font-heading font-black text-amber-800 dark:text-amber-300">
                {conteoPendientes}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 sm:px-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">Aprobados</span>
              <span className="text-base sm:text-lg font-heading font-black text-emerald-800 dark:text-emerald-300">
                {conteoAprobados}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 sm:px-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 block">En Revisión</span>
              <span className="text-base sm:text-lg font-heading font-black text-sky-800 dark:text-sky-300">
                {conteoRevision}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de notificación contextual si existe */}
      {mensajeAlerta && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 transition-all animate-in fade-in ${
            mensajeAlerta.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {mensajeAlerta.tipo === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{mensajeAlerta.texto}</span>
        </div>
      )}

      {/* Pestañas de Vista para Tutor: Documentos vs Actividades */}
      {rolActivo === 'TUTOR' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setTabActiva('archivos')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                tabActiva === 'archivos'
                  ? 'bg-white dark:bg-slate-800 text-[#EE7402] font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Documentos y Evidencias ({archivos.length})</span>
            </button>
            <button
              onClick={() => setTabActiva('actividades')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                tabActiva === 'actividades'
                  ? 'bg-white dark:bg-slate-800 text-[#EE7402] font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Actividades Asignadas ({actividades.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 font-semibold flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{conteoPendientes} Por revisar</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>{conteoAprobados} Aprobados</span>
            </span>
          </div>
        </div>
      )}

      {/* 2. CONTENIDO PRINCIPAL: LISTADO DE DOCUMENTOS CON BARRA DE FILTROS LIMPIA */}
      {tabActiva === 'archivos' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4">
          {/* Barra de Filtros y Búsqueda Unificada */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {rolActivo === 'TUTOR' ? 'Expediente Documental' : 'Mis Documentos Entregados'}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ({archivosFiltrados.length} encontrados)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Buscador */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar documento..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402] w-40 sm:w-52"
                />
              </div>

              {/* Filtro Categoría */}
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="TODAS">Todas las categorías</option>
                <option value="Evidencia">Evidencias</option>
                <option value="Material de Apoyo">Material de Apoyo</option>
                <option value="Tarea / Actividad">Tareas</option>
                <option value="Documento Institucional">Institucionales</option>
              </select>

              {/* Filtro Estado */}
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Aprobado">Aprobados</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Requiere Corrección">Requieren Corrección</option>
              </select>
            </div>
          </div>

          {/* Tabla de Documentos */}
          {archivosFiltrados.length > 0 ? (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-3">Documento</th>
                      <th className="py-3 px-3">Categoría</th>
                      <th className="py-3 px-3">Fecha de Subida</th>
                      <th className="py-3 px-3">Estado de Revisión</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {archivosPaginados.map((archivo) => {
                      const esAprobado = archivo.estadoRevision === 'Aprobado';
                      const esPendiente = archivo.estadoRevision === 'Pendiente';
                      const esRevision = archivo.estadoRevision === 'En Revisión';
                      const esCorrec = archivo.estadoRevision === 'Requiere Corrección';

                      // Separación estricta de permisos
                      const puedeEditar =
                        rolActivo === 'TUTOR' ||
                        archivo.autorId === estudianteActivo.id ||
                        archivo.autorRol === 'TUTORADO';

                      const puedeEliminar =
                        rolActivo === 'TUTOR' ||
                        archivo.autorId === estudianteActivo.id;

                      const puedeRevisar = rolActivo === 'TUTOR';

                      // Estilos para categorías
                      const getEstiloCategoria = (cat: string) => {
                        switch (cat) {
                          case 'Evidencia':
                            return 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
                          case 'Material de Apoyo':
                            return 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
                          case 'Tarea / Actividad':
                            return 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                          default:
                            return 'bg-orange-100 dark:bg-orange-950/50 text-[#EE7402] border-orange-200 dark:border-orange-800';
                        }
                      };

                      return (
                        <tr
                          key={archivo.id}
                          className="hover:bg-orange-50/20 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          {/* Documento y Metadatos */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {getIconoArchivo(archivo.nombre, archivo.tipo)}
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleAbrirVisor(archivo)}
                                  className="font-heading font-bold text-slate-900 dark:text-white truncate hover:text-[#EE7402] dark:hover:text-[#EE7402] text-left cursor-pointer transition-colors max-w-[240px] sm:max-w-xs block"
                                  title="Haz clic para previsualizar documento"
                                >
                                  {archivo.nombre}
                                </button>
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {archivo.tamanoFormateado} &bull; Por <span className="font-medium text-slate-600 dark:text-slate-300">{archivo.autorNombre}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Categoría con fondo colorido */}
                          <td className="py-3.5 px-3">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getEstiloCategoria(archivo.categoria)}`}>
                              {archivo.categoria}
                            </span>
                          </td>

                          {/* Fecha */}
                          <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                            {new Date(archivo.fechaSubida).toLocaleDateString()}
                          </td>

                          {/* Estado de Revisión con Fondos Sólidos Vibrantes */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-2xs ${
                                esAprobado
                                  ? 'bg-emerald-600 text-white'
                                  : esPendiente
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : esRevision
                                  ? 'bg-blue-600 text-white'
                                  : esCorrec
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-700 text-white'
                              }`}
                            >
                              <span>{archivo.estadoRevision}</span>
                            </span>

                            {archivo.comentarioTutor && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-[#EE7402] shrink-0" />
                                <span className="truncate max-w-[200px]">{archivo.comentarioTutor}</span>
                              </p>
                            )}
                          </td>

                          {/* Acciones Optimizadas y Limpias */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Principal de Revisión (Tutor) */}
                              {puedeRevisar && esPendiente && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setArchivoSeleccionadoRevisar(archivo);
                                    setNuevoEstadoRevision(archivo.estadoRevision);
                                    setComentarioRevision(archivo.comentarioTutor || '');
                                    setModalRevisarAbierto(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                  title="Emitir dictamen docente"
                                >
                                  Dictaminar
                                </button>
                              )}

                              {puedeRevisar && !esPendiente && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setArchivoSeleccionadoRevisar(archivo);
                                    setNuevoEstadoRevision(archivo.estadoRevision);
                                    setComentarioRevision(archivo.comentarioTutor || '');
                                    setModalRevisarAbierto(true);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Editar dictamen docente"
                                >
                                  Revisar
                                </button>
                              )}

                              {/* Abrir / Visor */}
                              <button
                                type="button"
                                onClick={() => handleAbrirVisor(archivo)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                                title="Previsualizar en visor"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Descargar */}
                              <button
                                type="button"
                                onClick={() => handleDescargar(archivo)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Descargar documento"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Editar */}
                              {puedeEditar && (
                                <button
                                  type="button"
                                  onClick={() => handlePedirEditar(archivo)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Editar metadatos"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                </button>
                              )}

                              {/* Eliminar */}
                              {puedeEliminar && (
                                <button
                                  type="button"
                                  onClick={() => handlePedirEliminar(archivo)}
                                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Eliminar documento"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={paginaActual <= 1}
                      onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={paginaActual >= totalPaginas}
                      onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-heading font-semibold text-sm text-slate-900 dark:text-white">
                No hay documentos que coincidan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {busqueda || filtroCategoria !== 'TODAS' || filtroEstado !== 'TODOS'
                  ? 'Intenta restablecer los filtros para ver más resultados.'
                  : 'Aún no se han cargado evidencias en este periodo escolar.'}
              </p>
              {(busqueda || filtroCategoria !== 'TODAS' || filtroEstado !== 'TODOS') && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('');
                    setFiltroCategoria('TODAS');
                    setFiltroEstado('TODOS');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-[#EE7402] hover:underline cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. TAB 2: ACTIVIDADES ASIGNADAS (TUTOR) */}
      {tabActiva === 'actividades' && rolActivo === 'TUTOR' && (
        <div className="space-y-3">
          {actividades.length > 0 ? (
            actividades.map((act) => (
              <div
                key={act.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#EE7402]/10 text-[#EE7402]">
                      Actividad de Tutoría
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Límite: {act.fechaLimite}
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-sm text-slate-900 dark:text-white">
                    {act.titulo}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {act.descripcion}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <FileCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-heading font-semibold text-sm text-slate-900 dark:text-white">
                No hay actividades registradas
              </h3>
              <p className="text-xs text-slate-500">
                Utiliza el botón "+ Nueva Actividad" en la cabecera para asignar tareas a tus alumnos.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: SUBIR ARCHIVO / EVIDENCIA                        */}
      {/* ========================================================= */}
      {modalSubirAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    {rolActivo === 'TUTOR' ? 'Subir Formato / Guía Oficial' : 'Subir Documento de Tutoría'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Almacenamiento institucional UAT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalSubirAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubirArchivoSubmit} className="space-y-3.5">
              {/* Zona drag and drop interactiva en el modal */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingModal(true);
                }}
                onDragLeave={() => setIsDraggingModal(false)}
                onDrop={handleDropModal}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                  isDraggingModal
                    ? 'border-[#EE7402] bg-[#EE7402]/5'
                    : 'border-slate-200 dark:border-slate-700 hover:border-[#EE7402] bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSeleccionarArchivo}
                  className="hidden"
                />
                <UploadCloud className="w-6 h-6 text-[#EE7402] mx-auto mb-1" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  {archivoFile ? archivoFile.name : 'Haz clic o arrastra un archivo aquí'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {archivoFile ? `${(archivoFile.size / 1024).toFixed(1)} KB` : 'PDF, DOCX, XLSX, PNG, JPG, ZIP (hasta 15 MB)'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Institucional del Documento *
                </label>
                <input
                  type="text"
                  required
                  value={nombreArchivo}
                  onChange={(e) => setNombreArchivo(e.target.value)}
                  placeholder="Ej. Evidencia_Tutorias_2026_1.pdf"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={categoriaSubida}
                    onChange={(e) => setCategoriaSubida(e.target.value as CategoriaArchivo)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Evidencia">Evidencia de Acompañamiento</option>
                    <option value="Material de Apoyo">Material de Apoyo / Guía</option>
                    <option value="Tarea / Actividad">Tarea / Entrega Escolar</option>
                    <option value="Documento Institucional">Formato Institucional UAT</option>
                  </select>
                </div>

                {rolActivo === 'TUTOR' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Destinatario
                    </label>
                    <select
                      value={alumnoAsignadoId}
                      onChange={(e) => setAlumnoAsignadoId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="TODOS">Todos mis tutorados</option>
                      {catalogoEstudiantes.map((es) => (
                        <option key={es.id} value={es.id}>
                          {es.nombre} ({es.matricula})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción o Notas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={descripcionSubida}
                  onChange={(e) => setDescripcionSubida(e.target.value)}
                  placeholder="Detalles sobre el contenido del documento..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalSubirAbierto(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subiendo}
                  className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{subiendo ? 'Guardando...' : 'Subir Documento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REVISAR ARCHIVO (TUTOR)                          */}
      {/* ========================================================= */}
      {modalRevisarAbierto && archivoSeleccionadoRevisar && rolActivo === 'TUTOR' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#EE7402]" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Revisar Evidencia de Tutoría
                </h3>
              </div>
              <button
                onClick={() => setModalRevisarAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1 border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-white block">
                {archivoSeleccionadoRevisar.nombre}
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                Subido por: {archivoSeleccionadoRevisar.autorNombre} &bull; {archivoSeleccionadoRevisar.tamanoFormateado}
              </span>
            </div>

            <form onSubmit={handleGuardarRevision} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dictamen Docente *
                </label>
                <select
                  value={nuevoEstadoRevision}
                  onChange={(e) => setNuevoEstadoRevision(e.target.value as EstadoRevisionArchivo)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Aprobado">Aprobado (Con visto bueno)</option>
                  <option value="En Revisión">En Revisión (Pendiente de ajuste)</option>
                  <option value="Requiere Corrección">Requiere Corrección (Re-entrega)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones formativas para el alumno:
                </label>
                <textarea
                  rows={3}
                  value={comentarioRevision}
                  onChange={(e) => setComentarioRevision(e.target.value)}
                  placeholder="Escribe comentarios o sugerencias para el tutorado..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalRevisarAbierto(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold"
                >
                  Guardar Dictamen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ASIGNAR NUEVA ACTIVIDAD (TUTOR)                  */}
      {/* ========================================================= */}
      {modalActividadAbierto && rolActivo === 'TUTOR' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#EE7402]" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Asignar Nueva Tarea o Actividad
                </h3>
              </div>
              <button
                onClick={() => setModalActividadAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearActividadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Actividad *
                </label>
                <input
                  type="text"
                  required
                  value={actTitulo}
                  onChange={(e) => setActTitulo(e.target.value)}
                  placeholder="Ej. Diagnóstico Inicial de Hábitos de Estudio"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instrucciones para los Alumnos
                </label>
                <textarea
                  rows={3}
                  value={actDescripcion}
                  onChange={(e) => setActDescripcion(e.target.value)}
                  placeholder="Pautas de entrega, formato requerido y objetivos..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite *
                  </label>
                  <input
                    type="date"
                    required
                    value={actFechaLimite}
                    onChange={(e) => setActFechaLimite(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alumnos Destino
                  </label>
                  <select
                    value={actEstudianteId}
                    onChange={(e) => setActEstudianteId(e.target.value)}
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

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalActividadAbierto(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoActividad}
                  className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {guardandoActividad ? 'Creando...' : 'Crear y Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: VISOR DE DOCUMENTOS Y EVIDENCIAS UAT             */}
      {/* ========================================================= */}
      {modalVisorAbierto && archivoAVisualizar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Cabecera del visor */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {getIconoArchivo(archivoAVisualizar.nombre, archivoAVisualizar.tipo)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white truncate">
                      {archivoAVisualizar.nombre}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EE7402]/15 text-[#EE7402]">
                      {archivoAVisualizar.categoria}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {archivoAVisualizar.tamanoFormateado} &bull; Subido por <strong>{archivoAVisualizar.autorNombre}</strong> &bull; {new Date(archivoAVisualizar.fechaSubida).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDescargar(archivoAVisualizar)}
                  className="px-3 py-1.5 rounded-xl bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Descargar copia del archivo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>

                <button
                  type="button"
                  onClick={handleCerrarVisor}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido / Vista Previa del Documento */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[380px]">
              {/* CASO 1: IMÁGENES */}
              {archivoAVisualizar.tipo.startsWith('image/') || archivoAVisualizar.nombre.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i) ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs text-xs font-medium text-slate-600 dark:text-slate-300">
                    <button
                      type="button"
                      onClick={() => setZoomImagen((prev) => Math.max(50, prev - 25))}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                      title="Alejar"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[11px] px-1">{zoomImagen}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomImagen((prev) => Math.min(200, prev + 25))}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                      title="Acercar"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomImagen(100)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer ml-1 text-slate-400 hover:text-slate-700"
                      title="Restablecer tamaño"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-[64vh] overflow-auto flex items-center justify-center p-2 w-full">
                    <img
                      src={blobUrlActual || archivoAVisualizar.contenidoDataUrl}
                      alt={archivoAVisualizar.nombre}
                      style={{ transform: `scale(${zoomImagen / 100})`, transformOrigin: 'center center' }}
                      className="max-h-[58vh] max-w-full rounded-xl object-contain shadow-md border border-slate-200 dark:border-slate-800 transition-transform duration-150"
                    />
                  </div>
                </div>
              ) : textoDecodificado !== null ? (
                /* CASO 2: TEXTO / CÓDIGO / MARKDOWN / CSV / JSON DECODIFICADO */
                <div className="w-full max-w-3xl flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                      <FileCode className="w-4 h-4 text-[#EE7402]" />
                      <span>Contenido de Texto del Archivo</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopiarAlPortapapeles(textoDecodificado)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiadoTexto ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiadoTexto ? 'Copiado' : 'Copiar Texto'}</span>
                    </button>
                  </div>
                  <pre className="p-4 overflow-auto max-h-[60vh] font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-text bg-slate-50/50 dark:bg-slate-950/60">
                    {textoDecodificado || '(El archivo no contiene texto legible)'}
                  </pre>
                </div>
              ) : archivoAVisualizar.tipo === 'application/pdf' || archivoAVisualizar.nombre.endsWith('.pdf') ? (
                /* CASO 3: DOCUMENTO PDF */
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                      <FileText className="w-4 h-4 text-rose-500" />
                      <span>Documento PDF: {archivoAVisualizar.nombre}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDescargar(archivoAVisualizar)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Abrir / Descargar PDF</span>
                    </button>
                  </div>

                  <iframe
                    src={blobUrlActual || archivoAVisualizar.contenidoDataUrl}
                    title={archivoAVisualizar.nombre}
                    className="w-full h-[62vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                  />
                </div>
              ) : (
                /* CASO 4: DOCUMENTOS OFFICE Y OTROS FORMATOS */
                <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center mx-auto">
                    {getIconoArchivo(archivoAVisualizar.nombre, archivoAVisualizar.tipo)}
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white break-all">
                      {archivoAVisualizar.nombre}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {archivoAVisualizar.categoria} &bull; {archivoAVisualizar.tamanoFormateado}
                    </p>
                  </div>

                  {archivoAVisualizar.descripcion && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">Descripción de la entrega:</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                        &ldquo;{archivoAVisualizar.descripcion}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleDescargar(archivoAVisualizar)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Documento</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del visor con comentarios del tutor si existen */}
            {archivoAVisualizar.comentarioTutor && (
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#EE7402] mb-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Observaciones del Tutor ({archivoAVisualizar.estadoRevision}):</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  &ldquo;{archivoAVisualizar.comentarioTutor}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: CONFIRMAR ELIMINACIÓN DE ARCHIVO (SIN DIÁLOGOS NATIVOS) */}
      {/* ========================================================= */}
      {modalEliminarAbierto && archivoAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                ¿Eliminar documento de tutoría?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Se borrará del expediente institucional de forma permanente.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {archivoAEliminar.nombre}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {archivoAEliminar.categoria} &bull; {archivoAEliminar.tamanoFormateado} &bull; Subido por {archivoAEliminar.autorNombre}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalEliminarAbierto(false);
                  setArchivoAEliminar(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminandoArchivo}
                onClick={handleEjecutarEliminacion}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{eliminandoArchivo ? 'Eliminando...' : 'Sí, Eliminar Documento'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: EDITAR INFORMACIÓN DEL DOCUMENTO                  */}
      {/* ========================================================= */}
      {modalEditarAbierto && archivoAEditar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Editar Datos del Documento
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modificar nombre, categoría o notas descriptivas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalEditarAbierto(false);
                  setArchivoAEditar(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Archivo / Documento:
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría del Documento:
                </label>
                <select
                  value={editCategoria}
                  onChange={(e) => setEditCategoria(e.target.value as CategoriaArchivo)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Evidencia">Evidencia de Tutoría</option>
                  <option value="Material de Apoyo">Material de Apoyo / Guía Docente</option>
                  <option value="Tarea / Actividad">Tarea / Actividad Académica</option>
                  <option value="Documento Institucional">Documento Oficial Institucional UAT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción o Notas del Documento:
                </label>
                <textarea
                  rows={2}
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  placeholder="Añade notas o contexto relevante de este archivo..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402] resize-none"
                />
              </div>

              {/* Si es Tutor: Permite editar observaciones de retroalimentación docente */}
              {rolActivo === 'TUTOR' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Retroalimentación Docente (Observaciones del Tutor):
                  </label>
                  <textarea
                    rows={2}
                    value={editComentarioTutor}
                    onChange={(e) => setEditComentarioTutor(e.target.value)}
                    placeholder="Comentarios formativos para el tutorado..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402] resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalEditarAbierto(false);
                    setArchivoAEditar(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#EE7402] hover:bg-[#D96200] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
