import React, { useState, useEffect, useRef } from 'react';
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
  abrirDocumentoEnPestana,
  descargarDocumento,
  decodeTextFromDataUrl
} from '../utils/tutoriaUtils';
import { AvatarWithFallback } from './AvatarWithFallback';
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
  Filter,
  PlusCircle,
  FileCheck,
  FolderOpen,
  Calendar,
  X,
  ShieldCheck,
  FileUp,
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
  Edit3,
  ChevronLeft,
  ChevronRight
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
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Modales
  const [modalSubirAbierto, setModalSubirAbierto] = useState(false);
  const [modalActividadAbierto, setModalActividadAbierto] = useState(false);
  const [modalRevisarAbierto, setModalRevisarAbierto] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoSistema | null>(null);

  // Modal Visor de Documentos
  const [modalVisorAbierto, setModalVisorAbierto] = useState(false);
  const [archivoAVisualizar, setArchivoAVisualizar] = useState<ArchivoSistema | null>(null);
  const [blobUrlActual, setBlobUrlActual] = useState<string>('');
  const [textoDecodificado, setTextoDecodificado] = useState<string | null>(null);
  const [zoomImagen, setZoomImagen] = useState<number>(100);
  const [copiadoTexto, setCopiadoTexto] = useState(false);

  // Modal de Confirmación de Eliminación (sin window.confirm)
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [archivoAEliminar, setArchivoAEliminar] = useState<ArchivoSistema | null>(null);
  const [eliminandoArchivo, setEliminandoArchivo] = useState(false);

  // Modal de Edición de Archivo (renombrar, cambiar categoría, actualizar descripción)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [archivoAEditar, setArchivoAEditar] = useState<ArchivoSistema | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCategoria, setEditCategoria] = useState<CategoriaArchivo>('Evidencia');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Formulario Subir Archivo
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 8;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [archivoDataUrl, setArchivoDataUrl] = useState<string>('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaArchivo>(
    rolActivo === 'TUTOR' ? 'Material de Apoyo' : 'Evidencia'
  );
  const [descripcion, setDescripcion] = useState('');
  const [alumnoAsignadoId, setAlumnoAsignadoId] = useState(estudianteActivo.id);
  const [subiendo, setSubiendo] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Formulario Revisar (Tutor)
  const [nuevoEstadoRevision, setNuevoEstadoRevision] = useState<EstadoRevisionArchivo>('Aprobado');
  const [comentarioRevision, setComentarioRevision] = useState('');

  // Formulario Nueva Actividad (Tutor)
  const [actTitulo, setActTitulo] = useState('');
  const [actDescripcion, setActDescripcion] = useState('');
  const [actFechaLimite, setActFechaLimite] = useState('2026-10-30');
  const [actEstudianteId, setActEstudianteId] = useState('TODOS');

  // Estados para Edición de Archivos (Tutor y Alumno)
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [archivoEnEdicion, setArchivoEnEdicion] = useState<ArchivoSistema | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editCategoria, setEditCategoria] = useState<CategoriaArchivo>('Evidencia');
  const [editComentarioTutor, setEditComentarioTutor] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Estados para Confirmación de Eliminación de Archivos
  const [modalConfirmarBorradoAbierto, setModalConfirmarBorradoAbierto] = useState(false);
  const [archivoParaBorrar, setArchivoParaBorrar] = useState<ArchivoSistema | null>(null);
  const [borrando, setBorrando] = useState(false);

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

  const procesarArchivoSeleccionado = (file: File) => {
    setArchivoFile(file);
    if (!nombreArchivo) {
      setNombreArchivo(file.name);
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setArchivoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivoSeleccionado(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivoSeleccionado(file);
  };

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
        categoria,
        descripcion,
        tutoradoId: rolActivo === 'ALUMNO' ? estudianteActivo.id : alumnoAsignadoId,
        tutorId: tutorActivo.id
      },
      autor
    );

    setSubiendo(false);
    if (res.success) {
      setMensajeAlerta({ texto: 'Documento cargado exitosamente en el sistema institucional.', tipo: 'ok' });
      setTimeout(() => {
        setModalSubirAbierto(false);
        setMensajeAlerta(null);
        setArchivoFile(null);
        setArchivoDataUrl('');
        setNombreArchivo('');
        setDescripcion('');
      }, 900);
      cargarDatos();
    } else {
      setMensajeAlerta({ texto: res.message, tipo: 'error' });
    }
  };

  const handleGuardarRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoSeleccionado) return;

    const res = await tutoriaService.revisarArchivo(
      {
        archivoId: archivoSeleccionado.id,
        estadoRevision: nuevoEstadoRevision,
        comentarioTutor: comentarioRevision
      },
      tutorActivo.id
    );

    if (res.success) {
      setModalRevisarAbierto(false);
      setArchivoSeleccionado(null);
      setComentarioRevision('');
      cargarDatos();
    }
  };

  const handleCrearActividadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitulo.trim() || !actFechaLimite) return;

    const res = await tutoriaService.crearActividad(
      {
        titulo: actTitulo,
        descripcion: actDescripcion,
        fechaLimite: actFechaLimite,
        estudianteId: actEstudianteId
      },
      { id: tutorActivo.id, nombre: tutorActivo.nombre }
    );

    if (res.success) {
      setModalActividadAbierto(false);
      setActTitulo('');
      setActDescripcion('');
      cargarDatos();
    }
  };

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

  const handleCerrarVisor = () => {
    setModalVisorAbierto(false);
    if (blobUrlActual && blobUrlActual.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlActual);
  // Verificación de permisos según rol institucional
  const puedeEditarOEliminar = (archivo: ArchivoSistema): boolean => {
    if (rolActivo === 'TUTOR') return true;
    return archivo.autorId === estudianteActivo.id || archivo.autorRol === 'TUTORADO';
  };

  // Abrir modal de edición con datos precargados
  const handleAbrirEditar = (archivo: ArchivoSistema) => {
    setArchivoEnEdicion(archivo);
    setEditNombre(archivo.nombre);
    setEditDescripcion(archivo.descripcion || '');
    setEditCategoria(archivo.categoria);
    setEditComentarioTutor(archivo.comentarioTutor || '');
    setModalEditarAbierto(true);
  };

  // Guardar cambios editados en el archivo
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoEnEdicion) return;
    setGuardandoEdicion(true);

    const payload: EditarArchivoPayload = {
      archivoId: archivoEnEdicion.id,
      nombre: editNombre.trim() || archivoEnEdicion.nombre,
      descripcion: editDescripcion.trim(),
      categoria: editCategoria,
      comentarioTutor: rolActivo === 'TUTOR' ? editComentarioTutor.trim() : undefined
    };

    const res = await tutoriaService.editarArchivo(payload, {
      id: rolActivo === 'TUTOR' ? tutorActivo.id : estudianteActivo.id,
      rol: rolActivo === 'TUTOR' ? 'TUTOR' : 'TUTORADO'
    });

    setGuardandoEdicion(false);

    if (res.success) {
      setMensajeAlerta({ texto: res.message, tipo: 'ok' });
      setModalEditarAbierto(false);
      setArchivoEnEdicion(null);
      await cargarDatos();
      setTimeout(() => setMensajeAlerta(null), 3500);
    } else {
      setMensajeAlerta({ texto: res.message, tipo: 'error' });
    }
  };

  // Abrir modal de confirmación antes de borrar
  const handleAbrirConfirmarBorrado = (archivo: ArchivoSistema) => {
    setArchivoParaBorrar(archivo);
    setModalConfirmarBorradoAbierto(true);
  };

  // Ejecutar eliminación confirmada con persistencia
  const handleConfirmarBorrado = async () => {
    if (!archivoParaBorrar) return;
    setBorrando(true);

    const res = await tutoriaService.eliminarArchivo(archivoParaBorrar.id, {
      id: rolActivo === 'TUTOR' ? tutorActivo.id : estudianteActivo.id,
      rol: rolActivo === 'TUTOR' ? 'TUTOR' : 'TUTORADO'
    });

    setBorrando(false);

    if (res.success) {
      setMensajeAlerta({ texto: res.message, tipo: 'ok' });
      setModalConfirmarBorradoAbierto(false);
      setArchivoParaBorrar(null);
      await cargarDatos();
      setTimeout(() => setMensajeAlerta(null), 3500);
    } else {
      setMensajeAlerta({ texto: res.message, tipo: 'error' });
    }
    setBlobUrlActual('');
    setArchivoAVisualizar(null);
    setTextoDecodificado(null);
    setZoomImagen(100);
  };

  const handlePedirEditar = (archivo: ArchivoSistema) => {
    setArchivoAEditar(archivo);
    setEditNombre(archivo.nombre);
    setEditCategoria(archivo.categoria);
    setEditDescripcion(archivo.descripcion || '');
    setModalEditarAbierto(true);
  };

  const handleGuardarEdicionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoAEditar || !editNombre.trim()) return;
    setGuardandoEdicion(true);

    const res = await tutoriaService.actualizarArchivo(
      {
        archivoId: archivoAEditar.id,
        nombre: editNombre.trim(),
        categoria: editCategoria,
        descripcion: editDescripcion.trim()
      },
      rolActivo === 'TUTOR' ? tutorActivo.id : estudianteActivo.id
    );

    setGuardandoEdicion(false);
    if (res.success) {
      setModalEditarAbierto(false);
      setArchivoAEditar(null);
      setMensajeAlerta({ texto: 'Documento actualizado con éxito.', tipo: 'ok' });
      setTimeout(() => setMensajeAlerta(null), 2500);
      await cargarDatos();
    } else {
      setMensajeAlerta({ texto: res.message || 'Error al actualizar documento.', tipo: 'error' });
      setTimeout(() => setMensajeAlerta(null), 3000);
    }
  };

  const handlePedirEliminar = (archivo: ArchivoSistema) => {
    setArchivoAEliminar(archivo);
    setModalEliminarAbierto(true);
  };

  const handleEjecutarEliminacion = async () => {
    if (!archivoAEliminar) return;
    const targetId = archivoAEliminar.id;
    setEliminandoArchivo(true);

    // Respuesta visual instantánea
    setArchivos((prev) => prev.filter((a) => a.id !== targetId));

    const res = await tutoriaService.eliminarArchivo(targetId);
    setEliminandoArchivo(false);
    setModalEliminarAbierto(false);
    setArchivoAEliminar(null);

    if (res.success) {
      setMensajeAlerta({ texto: 'Documento eliminado correctamente del almacenamiento persistente.', tipo: 'ok' });
    } else {
      setMensajeAlerta({ texto: res.message || 'Error al eliminar el archivo.', tipo: 'error' });
    }
    setTimeout(() => setMensajeAlerta(null), 3000);
    await cargarDatos();
  };

  const handleCopiarAlPortapapeles = (texto: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoTexto(true);
      setTimeout(() => setCopiadoTexto(false), 2000);
    });
  };

  const handleDescargar = (archivo: ArchivoSistema) => {
    descargarDocumento(archivo.contenidoDataUrl, archivo.nombre);
  };

  // Filtrado de archivos
  const archivosFiltrados = archivos.filter((a) => {
    const matchBusqueda =
      !busqueda.trim() ||
      a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.autorNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

    const matchCategoria = filtroCategoria === 'TODAS' || a.categoria === filtroCategoria;
    const matchEstado = filtroEstado === 'TODOS' || a.estadoRevision === filtroEstado;

    return matchBusqueda && matchCategoria && matchEstado;
  });

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabecera Principal Institucional UAT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EE7402]/10 text-[#EE7402] border border-[#EE7402]/30 font-heading">
              UAT &middot; Gestión Documental
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Sistema Institucional de Tutorías
            </span>
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1 tracking-tight">
            {rolActivo === 'TUTOR'
              ? 'Gestión de Documentos y Formatos Institucionales'
              : 'Subir Documentos y Evidencias de Tutoría'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {rolActivo === 'TUTOR'
              ? 'Administra formatos oficiales de acompañamiento, revisa evidencias entregadas y publica guías para tus tutorados.'
              : 'Entrega tus tareas, comprobantes escolares y evidencias de tutoría para revisión por tu tutor Dr. Roberto Mendoza.'}
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2.5">
          {rolActivo === 'TUTOR' && (
            <button
              onClick={() => setModalActividadAbierto(true)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <PlusCircle className="w-4 h-4 text-[#EE7402]" />
              <span>Nueva Actividad</span>
            </button>
          )}

          <button
            onClick={() => {
              setModalSubirAbierto(true);
              setNombreArchivo('');
              setArchivoDataUrl('');
              setArchivoFile(null);
            }}
            className="px-4 py-2.5 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{rolActivo === 'TUTOR' ? 'Subir Formato / Guía' : 'Subir Documento'}</span>
          </button>
        </div>
      </div>

      {/* ROL ALUMNO: Componente Prominente de Carga Rápida de Archivos con Soporte Claro/Oscuro */}
      {rolActivo === 'ALUMNO' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            setModalSubirAbierto(true);
          }}
          className={`rounded-2xl p-8 border-2 border-dashed text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-[#EE7402] bg-[#FFF7ED] dark:bg-[#EE7402]/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-[#EE7402] dark:hover:border-[#EE7402] bg-white dark:bg-slate-900 hover:bg-[#FFF7ED]/50 dark:hover:bg-[#EE7402]/5 shadow-xs'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center mx-auto mb-3">
            <FileUp className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
            Arrastra tu archivo aquí o haz clic para subir
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Sube constancias, justificantes médicos, tareas de asesoría o evidencias de seguimiento escolar.
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono mt-3">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              PDF
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              DOCX
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              PNG/JPG
            </span>
            <span className="text-slate-400">&bull; Hasta 15 MB</span>
          </div>
        </div>
      )}

      {/* Pestañas de Vista para Tutor */}
      {rolActivo === 'TUTOR' && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs">
            <button
              onClick={() => setTabActiva('archivos')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                tabActiva === 'archivos'
                  ? 'bg-[#EE7402] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Documentos y Evidencias Recibidas ({archivos.length})</span>
            </button>
            <button
              onClick={() => setTabActiva('actividades')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                tabActiva === 'actividades'
                  ? 'bg-[#EE7402] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Tareas y Formatos Oficiales ({actividades.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
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

      {/* Contenido Tab 1: Lista de Documentos */}
      {tabActiva === 'archivos' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                {rolActivo === 'TUTOR' ? 'Expediente Documental' : 'Mis Entregas y Documentos'}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                ({archivosFiltrados.length} archivos)
              </span>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar documento..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="TODAS">Todas las categorías</option>
                <option value="Evidencia">Evidencias</option>
                <option value="Material de Apoyo">Material de Apoyo</option>
                <option value="Tarea / Actividad">Tareas</option>
                <option value="Documento Institucional">Institucionales</option>
              </select>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Aprobado">Aprobados</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Requiere Corrección">Requieren Corrección</option>
              </select>
            </div>
          </div>

          {/* Tabla de Documentos con Estilo Institucional UAT */}
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {archivosPaginados.map((archivo) => {
                    const esAprobado = archivo.estadoRevision === 'Aprobado';
                    const esPendiente = archivo.estadoRevision === 'Pendiente';
                    const esCorrec = archivo.estadoRevision === 'Requiere Corrección';
                    const puedeEliminar =
                      rolActivo === 'TUTOR' ||
                      archivo.autorId === estudianteActivo.id ||
                      archivo.tutoradoId === estudianteActivo.id;

                    return (
                      <tr
                        key={archivo.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#EE7402]/10 text-[#EE7402] flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => handleAbrirVisor(archivo)}
                                className="font-heading font-semibold text-slate-900 dark:text-white truncate hover:text-[#EE7402] dark:hover:text-[#EE7402] text-left cursor-pointer transition-colors max-w-[280px] block"
                                title="Haz clic para abrir el documento"
                              >
                                {archivo.nombre}
                              </button>
                              <p className="text-[11px] text-slate-400 truncate">
                                {archivo.tamanoFormateado} &middot; Subido por {archivo.autorNombre}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {archivo.categoria}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                          {new Date(archivo.fechaSubida).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              esAprobado
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                                : esPendiente
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                                : esCorrec
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                esAprobado ? 'bg-emerald-500' : esPendiente ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{archivo.estadoRevision}</span>
                          </span>

                          {archivo.comentarioTutor && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-[#EE7402] shrink-0" />
                              <span className="truncate max-w-[200px]">{archivo.comentarioTutor}</span>
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón Abrir / Ver Documento */}
                            <button
                              type="button"
                              onClick={() => handleAbrirVisor(archivo)}
                              className="px-2.5 py-1 rounded-lg bg-[#EE7402]/10 hover:bg-[#EE7402] hover:text-white text-[#EE7402] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Abrir y previsualizar documento en pantalla"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Abrir</span>
                            </button>

                            {/* Botón Descargar */}
                            <button
                              type="button"
                              onClick={() => handleDescargar(archivo)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Descargar archivo en equipo"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {rolActivo === 'TUTOR' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setArchivoSeleccionado(archivo);
                                  setNuevoEstadoRevision(archivo.estadoRevision);
                                  setComentarioRevision(archivo.comentarioTutor || '');
                                  setModalRevisarAbierto(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Revisar
                              </button>
                            )}

                            {/* Botón Editar Archivo */}
                            {puedeEliminar && (
                              <button
                                type="button"
                                onClick={() => handlePedirEditar(archivo)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Editar título o categoría del documento"
                              >
                                <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                              </button>
                            )}

                            {/* Botón Eliminar Archivo (disponible para el autor o tutor) */}
                            {puedeEliminar && (
                              <button
                                type="button"
                                onClick={() => handlePedirEliminar(archivo)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Eliminar archivo permanentemente"
                              >
                                <Trash2 className="w-4 h-4" />
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

            {/* Paginación de Documentos para Reducir Saturación Visual */}
            {totalPaginas > 1 && (
              <div className="bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Mostrando <strong className="text-slate-800 dark:text-white">{(paginaActual - 1) * elementosPorPagina + 1}</strong> - <strong className="text-slate-800 dark:text-white">{Math.min(paginaActual * elementosPorPagina, archivosFiltrados.length)}</strong> de <strong className="text-slate-800 dark:text-white">{archivosFiltrados.length}</strong> documentos
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                    disabled={paginaActual === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors cursor-pointer"
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
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          ) : (
            <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="font-heading font-semibold text-sm text-slate-900 dark:text-white">
                No hay documentos registrados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {rolActivo === 'TUTOR'
                  ? 'Aquí aparecerán los archivos y evidencias entregadas por los alumnos.'
                  : 'Aún no has subido ningún documento. Utiliza el botón "+ Subir Documento".'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Contenido Tab 2: Tareas y Formatos Oficiales (Tutor) */}
      {tabActiva === 'actividades' && rolActivo === 'TUTOR' && (
        <div className="space-y-4">
          {actividades.length > 0 ? (
            actividades.map((act) => (
              <div
                key={act.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#EE7402]/10 text-[#EE7402]">
                      Actividad Programada
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Fecha límite: {act.fechaLimite}
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

            {mensajeAlerta && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  mensajeAlerta.tipo === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                {mensajeAlerta.tipo === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{mensajeAlerta.texto}</span>
              </div>
            )}

            <form onSubmit={handleSubirArchivoSubmit} className="space-y-3.5">
              {/* Selector de Archivo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seleccionar Documento (PDF, DOCX, ZIP, PNG, JPG) *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSeleccionarArchivo}
                  required
                  className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#EE7402]/15 file:text-[#EE7402] hover:file:bg-[#EE7402]/25 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Institucional del Archivo *
                </label>
                <input
                  type="text"
                  required
                  value={nombreArchivo}
                  onChange={(e) => setNombreArchivo(e.target.value)}
                  placeholder="Ej. Evidencia_Tutorias_2026_1.pdf"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaArchivo)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
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
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles sobre el contenido del documento entregado..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
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
                  <span>{subiendo ? 'Guardando en UAT...' : 'Subir Documento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REVISAR ARCHIVO (TUTOR)                          */}
      {/* ========================================================= */}
      {modalRevisarAbierto && archivoSeleccionado && rolActivo === 'TUTOR' && (
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
                {archivoSeleccionado.nombre}
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                Subido por: {archivoSeleccionado.autorNombre} &middot; {archivoSeleccionado.tamanoFormateado}
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
                  Observaciones para el Alumno
                </label>
                <textarea
                  rows={3}
                  value={comentarioRevision}
                  onChange={(e) => setComentarioRevision(e.target.value)}
                  placeholder="Escribe comentarios formativos o indicaciones..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
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
                  placeholder="Pautas de entrega y formato requerido..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
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

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalActividadAbierto(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Crear y Asignar
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
                <div className="w-10 h-10 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center shrink-0">
                  {archivoAVisualizar.tipo.startsWith('image/') || archivoAVisualizar.nombre.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i) ? (
                    <Eye className="w-5 h-5 text-[#EE7402]" />
                  ) : archivoAVisualizar.tipo === 'application/pdf' || archivoAVisualizar.nombre.endsWith('.pdf') ? (
                    <FileText className="w-5 h-5 text-rose-500" />
                  ) : archivoAVisualizar.nombre.match(/\.(xlsx|xls|csv)$/i) ? (
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  ) : archivoAVisualizar.nombre.match(/\.(zip|rar|7z|tar|gz)$/i) ? (
                    <FileArchive className="w-5 h-5 text-purple-600" />
                  ) : archivoAVisualizar.nombre.match(/\.(js|ts|py|sql|html|css|json|md|txt)$/i) ? (
                    <FileCode className="w-5 h-5 text-amber-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-[#EE7402]" />
                  )}
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
                    {archivoAVisualizar.tamanoFormateado} &bull; Subido por <strong>{archivoAVisualizar.autorNombre}</strong> ({archivoAVisualizar.autorRol}) &bull; {new Date(archivoAVisualizar.fechaSubida).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDescargar(archivoAVisualizar)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Descargar y guardar copia original en tu equipo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar / Abrir</span>
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
                      <span>Abrir en Visor PDF Nativo</span>
                    </button>
                  </div>

                  <iframe
                    src={blobUrlActual || archivoAVisualizar.contenidoDataUrl}
                    title={archivoAVisualizar.nombre}
                    className="w-full h-[62vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                  />
                </div>
              ) : (
                /* CASO 4: DOCUMENTOS OFFICE (WORD, EXCEL, POWERPOINT) Y COMPRIMIDOS */
                <div className="max-w-lg w-full bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5 shadow-sm animate-in zoom-in-95 duration-150">
                  <div className="w-16 h-16 rounded-2xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center mx-auto">
                    {archivoAVisualizar.nombre.match(/\.(xlsx|xls)$/i) ? (
                      <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                    ) : archivoAVisualizar.nombre.match(/\.(zip|rar|7z)$/i) ? (
                      <FileArchive className="w-8 h-8 text-purple-600" />
                    ) : (
                      <FileText className="w-8 h-8 text-[#EE7402]" />
                    )}
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-base text-slate-900 dark:text-white break-all">
                      {archivoAVisualizar.nombre}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {archivoAVisualizar.categoria} &bull; {archivoAVisualizar.tamanoFormateado} &bull; Formato: {archivoAVisualizar.tipo || 'Documento binario'}
                    </p>
                  </div>

                  {archivoAVisualizar.descripcion && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Descripción de la entrega:</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                        &ldquo;{archivoAVisualizar.descripcion}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-3 text-left">
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      💡 <strong>Apertura de Documentos:</strong> Los archivos de Microsoft Office (.docx, .xlsx, .pptx) y comprimidos se descargan y abren de forma nativa en tu suite ofimática preferida con 100% de fidelidad tipográfica y de fórmulas.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDescargar(archivoAVisualizar)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar y Abrir en mi Equipo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopiarAlPortapapeles(archivoAVisualizar.nombre)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {copiadoTexto ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiadoTexto ? 'Copiado' : 'Copiar Nombre'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del visor con comentarios del tutor si existen */}
            {archivoAVisualizar.comentarioTutor && (
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#EE7402] mb-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Retroalimentación del Tutor ({archivoAVisualizar.estadoRevision}):</span>
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
      {/* MODAL 5: CONFIRMAR ELIMINACIÓN DE ARCHIVO (SIN WINDOW.CONFIRM) */}
      {/* ========================================================= */}
      {modalEliminarAbierto && archivoAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
                    Modificar nombre, categoría o descripción institucional
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
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
                  rows={3}
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  placeholder="Añade notas o contexto relevante de este archivo..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 resize-none"
                />
              </div>

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
