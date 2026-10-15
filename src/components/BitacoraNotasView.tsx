import React, { useState, useEffect, useRef } from 'react';
import {
  Tutor,
  EstudianteCatalogo,
  RolSimulado,
  NotaPersonalItem,
  CategoriaNotaPersonal,
  TipoSeccionNota
} from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import {
  NotebookPen,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Pin,
  X,
  Copy,
  Check,
  User,
  Calendar,
  Lock,
  Clock,
  RotateCcw,
  Sparkles,
  Tag,
  Maximize2,
  AlertCircle
} from 'lucide-react';

interface BitacoraNotasViewProps {
  rolActivo: RolSimulado;
  tutorActivo: Tutor;
  estudianteActivo: EstudianteCatalogo;
  catalogoEstudiantes: EstudianteCatalogo[];
}

const CATEGORIAS_DISPONIBLES: CategoriaNotaPersonal[] = [
  'Recordatorio',
  'Duda de Asesoría',
  'Trámite / Beca',
  'Sesión Ordinaria',
  'Seguimiento Académico',
  'Acuerdo / Compromiso',
  'General'
];

export const BitacoraNotasView: React.FC<BitacoraNotasViewProps> = ({
  rolActivo,
  tutorActivo,
  estudianteActivo,
  catalogoEstudiantes
}) => {
  const [notas, setNotas] = useState<NotaPersonalItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [tabSeccion, setTabSeccion] = useState<TipoSeccionNota>('todas');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [mensajeAlerta, setMensajeAlerta] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | number | null>(null);

  // Barra Superior de Creación Rápida (Estilo Google Keep)
  const [composerExpandido, setComposerExpandido] = useState(false);
  const [formTipoSeccion, setFormTipoSeccion] = useState<'personal' | 'seguimiento'>('personal');
  const [formTitulo, setFormTitulo] = useState('');
  const [formTexto, setFormTexto] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaNotaPersonal>('Recordatorio');
  const [formEstudianteId, setFormEstudianteId] = useState<string>(
    catalogoEstudiantes[0]?.id || 'est-101'
  );
  const [formFijada, setFormFijada] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorFormTexto, setErrorFormTexto] = useState<string | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  // Modal Central Flotante de Detalle / Edición (Estilo Google Keep)
  const [notaSeleccionadaModal, setNotaSeleccionadaModal] = useState<NotaPersonalItem | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editTexto, setEditTexto] = useState('');
  const [editCategoria, setEditCategoria] = useState<CategoriaNotaPersonal>('General');
  const [editTipoSeccion, setEditTipoSeccion] = useState<'personal' | 'seguimiento'>('personal');
  const [editEstudianteId, setEditEstudianteId] = useState<string>('');
  const [editFijada, setEditFijada] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEditTexto, setErrorEditTexto] = useState<string | null>(null);

  // Modal para confirmar eliminación
  const [notaAEliminar, setNotaAEliminar] = useState<NotaPersonalItem | null>(null);

  // Cargar notas desde IndexedDB y LocalStorage
  const cargarNotas = async () => {
    setCargando(true);
    try {
      const res = await tutoriaService.getNotasPersonales();
      if (res.success && res.data) {
        setNotas(res.data);
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNotas();
    const unsub = tutoriaService.subscribe(() => {
      cargarNotas();
    });
    return () => unsub();
  }, [tutorActivo.id, estudianteActivo.id]);

  // Cerrar composer al hacer click afuera si está vacío
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(event.target as Node)) {
        if (!formTitulo.trim() && !formTexto.trim()) {
          setComposerExpandido(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [formTitulo, formTexto]);

  const mostrarAlerta = (texto: string, tipo: 'ok' | 'error' = 'ok') => {
    setMensajeAlerta({ texto, tipo });
    setTimeout(() => setMensajeAlerta(null), 3500);
  };

  // Guardar nueva nota desde la barra rápida Keep
  const handleGuardarNuevaNota = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formTexto.trim()) {
      setErrorFormTexto('Por favor ingresa el contenido o apunte antes de guardar.');
      return;
    }
    setErrorFormTexto(null);

    setGuardando(true);
    try {
      const estudianteVinculado =
        formTipoSeccion === 'seguimiento'
          ? catalogoEstudiantes.find((est) => est.id === formEstudianteId)
          : undefined;

      const res = await tutoriaService.guardarNotaPersonal({
        titulo: formTitulo.trim() || undefined,
        texto: formTexto.trim(),
        categoria: formCategoria,
        tipoSeccion: formTipoSeccion,
        fijada: formFijada,
        autorRol: rolActivo,
        autorId: rolActivo === 'TUTOR' ? tutorActivo.id : estudianteActivo.id,
        alumnoId: rolActivo === 'ALUMNO' ? estudianteActivo.id : undefined,
        estudianteId: estudianteVinculado?.id,
        estudianteNombre: estudianteVinculado?.nombre,
        estudianteMatricula: estudianteVinculado?.matricula
      });

      if (res.success && res.data) {
        const notaGuardada = res.data;
        setNotas((prev) => [notaGuardada, ...prev.filter((n) => n.id !== notaGuardada.id)]);
        mostrarAlerta('Nota guardada en tu bloc privado.');

        // Limpiar y colapsar
        setFormTitulo('');
        setFormTexto('');
        setFormFijada(false);
        setFormCategoria('Recordatorio');
        setComposerExpandido(false);
        await cargarNotas();
      } else {
        mostrarAlerta(res.message || 'Error al guardar apunte.', 'error');
      }
    } catch {
      mostrarAlerta('Error de almacenamiento local.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Abrir Modal Central Flotante de Detalle / Edición al hacer click en cualquier tarjeta
  const abrirModalDetalleNota = (nota: NotaPersonalItem) => {
    setNotaSeleccionadaModal(nota);
    setEditTitulo(nota.titulo || '');
    setEditTexto(nota.texto);
    setEditCategoria(nota.categoria);
    setEditTipoSeccion(nota.tipoSeccion || (nota.estudianteId ? 'seguimiento' : 'personal'));
    setEditEstudianteId(nota.estudianteId || catalogoEstudiantes[0]?.id || '');
    setEditFijada(Boolean(nota.fijada));
  };

  // Guardar cambios en el Modal Central Flotante
  const handleGuardarEdicionSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!notaSeleccionadaModal) return;
    if (!editTexto.trim()) {
      setErrorEditTexto('El texto del apunte es obligatorio y no puede quedar vacío.');
      return;
    }
    setErrorEditTexto(null);

    setGuardandoEdicion(true);
    try {
      const estudianteVinculado =
        editTipoSeccion === 'seguimiento'
          ? catalogoEstudiantes.find((est) => est.id === editEstudianteId)
          : undefined;

      const res = await tutoriaService.guardarNotaPersonal({
        id: notaSeleccionadaModal.id,
        titulo: editTitulo.trim() || undefined,
        texto: editTexto.trim(),
        categoria: editCategoria,
        tipoSeccion: editTipoSeccion,
        fijada: editFijada,
        autorRol: notaSeleccionadaModal.autorRol || rolActivo,
        autorId: notaSeleccionadaModal.autorId,
        alumnoId: notaSeleccionadaModal.alumnoId,
        estudianteId: estudianteVinculado?.id,
        estudianteNombre: estudianteVinculado?.nombre,
        estudianteMatricula: estudianteVinculado?.matricula
      });

      if (res.success && res.data) {
        const notaActualizada = res.data;
        setNotas((prev) =>
          prev.map((n) => (n.id === notaActualizada.id ? notaActualizada : n))
        );
        mostrarAlerta('Apunte actualizado correctamente.');
        setNotaSeleccionadaModal(null);
        await cargarNotas();
      } else {
        mostrarAlerta(res.message || 'Error al actualizar nota.', 'error');
      }
    } catch {
      mostrarAlerta('Error al persistir cambios.', 'error');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Fijar / Desfijar nota
  const handleToggleFijar = async (nota: NotaPersonalItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotas((prev) =>
      prev.map((n) => (n.id === nota.id ? { ...n, fijada: !n.fijada } : n))
    );
    if (notaSeleccionadaModal && notaSeleccionadaModal.id === nota.id) {
      setEditFijada((prev) => !prev);
    }
    const res = await tutoriaService.toggleFijarNota(nota.id);
    if (res.success) {
      mostrarAlerta(res.message);
      await cargarNotas();
    }
  };

  // Confirmar y eliminar nota
  const handleConfirmarEliminar = async () => {
    if (!notaAEliminar) return;
    const id = notaAEliminar.id;
    setNotas((prev) => prev.filter((n) => n.id !== id));
    if (notaSeleccionadaModal && notaSeleccionadaModal.id === id) {
      setNotaSeleccionadaModal(null);
    }
    setNotaAEliminar(null);

    const res = await tutoriaService.eliminarNotaPersonal(id);
    if (res.success) {
      mostrarAlerta('Nota eliminada permanentemente.');
      await cargarNotas();
    } else {
      mostrarAlerta(res.message, 'error');
    }
  };

  // Copiar contenido al portapapeles
  const handleCopiarNota = (nota: NotaPersonalItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const textoCompleto = `${nota.titulo ? nota.titulo + '\n\n' : ''}${nota.texto}`;
    navigator.clipboard.writeText(textoCompleto);
    setCopiadoId(nota.id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  // Contadores para pestañas
  const conteoTodas = notas.length;
  const conteoPersonales = notas.filter((n) => (n.tipoSeccion || 'personal') === 'personal').length;
  const conteoSeguimiento = notas.filter((n) => n.tipoSeccion === 'seguimiento' || Boolean(n.estudianteId)).length;

  // Filtrado de notas
  const notasFiltradas = notas.filter((n) => {
    // 1. Filtro por sección (Todas, Personales, Seguimiento)
    if (tabSeccion === 'personal') {
      if (n.tipoSeccion === 'seguimiento' || Boolean(n.estudianteId)) return false;
    }
    if (tabSeccion === 'seguimiento') {
      if (n.tipoSeccion !== 'seguimiento' && !n.estudianteId) return false;
    }

    // 2. Filtro por categoría
    if (filtroCategoria !== 'TODAS' && n.categoria !== filtroCategoria) {
      return false;
    }

    // 3. Búsqueda por texto
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const enTexto = n.texto.toLowerCase().includes(q);
      const enTitulo = Boolean(n.titulo && n.titulo.toLowerCase().includes(q));
      const enCat = n.categoria.toLowerCase().includes(q);
      const enAlumno = Boolean(
        n.estudianteNombre && n.estudianteNombre.toLowerCase().includes(q)
      );
      const enMatricula = Boolean(
        n.estudianteMatricula && n.estudianteMatricula.toLowerCase().includes(q)
      );
      if (!enTexto && !enTitulo && !enCat && !enAlumno && !enMatricula) return false;
    }

    return true;
  });

  // Notas Fijadas vs Otras Notas (Estilo Google Keep)
  const notasFijadas = notasFiltradas.filter((n) => Boolean(n.fijada));
  const notasOtras = notasFiltradas.filter((n) => !n.fijada);

  // Paleta de colores sutiles por categoría inspirada en Keep & UAT
  const getCategoriaTheme = (cat: CategoriaNotaPersonal) => {
    switch (cat) {
      case 'Recordatorio':
        return {
          dot: 'bg-[#EE7402]',
          tagBg: 'bg-[#EE7402]/10 text-[#EE7402] border-[#EE7402]/20',
          accentBorder: 'hover:border-[#EE7402]/60'
        };
      case 'Duda de Asesoría':
        return {
          dot: 'bg-sky-500',
          tagBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
          accentBorder: 'hover:border-sky-500/60'
        };
      case 'Trámite / Beca':
        return {
          dot: 'bg-emerald-500',
          tagBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          accentBorder: 'hover:border-emerald-500/60'
        };
      case 'Sesión Ordinaria':
        return {
          dot: 'bg-indigo-500',
          tagBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          accentBorder: 'hover:border-indigo-500/60'
        };
      case 'Seguimiento Académico':
        return {
          dot: 'bg-amber-500',
          tagBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          accentBorder: 'hover:border-amber-500/60'
        };
      case 'Acuerdo / Compromiso':
        return {
          dot: 'bg-teal-500',
          tagBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
          accentBorder: 'hover:border-teal-500/60'
        };
      default:
        return {
          dot: 'bg-slate-400',
          tagBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
          accentBorder: 'hover:border-slate-400/60'
        };
    }
  };

  // Renderizador de Tarjeta de Nota en Mosaico (Google Keep Style)
  const renderNotaCard = (nota: NotaPersonalItem) => {
    const esSeguimiento = nota.tipoSeccion === 'seguimiento' || Boolean(nota.estudianteId);
    const theme = getCategoriaTheme(nota.categoria);

    return (
      <div
        key={nota.id}
        onClick={() => abrirModalDetalleNota(nota)}
        className={`group bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer relative shadow-2xs hover:shadow-md ${
          nota.fijada
            ? 'border-[#EE7402]/60 dark:border-[#EE7402]/50 bg-orange-50/15 dark:bg-orange-950/15 ring-1 ring-[#EE7402]/20'
            : `border-slate-200/90 dark:border-slate-800 ${theme.accentBorder}`
        }`}
      >
        {/* Parte Superior: Categoría + Pin Button */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${theme.tagBg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                <span>{nota.categoria}</span>
              </span>
              {esSeguimiento && (
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                  Seguimiento
                </span>
              )}
            </div>

            {/* Botón de Pin visible o hover */}
            <button
              type="button"
              onClick={(e) => handleToggleFijar(nota, e)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                nota.fijada
                  ? 'text-[#EE7402] hover:bg-orange-100 dark:hover:bg-orange-950/40'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-60 sm:opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={nota.fijada ? 'Desfijar apunte' : 'Fijar al inicio'}
            >
              <Pin className={`w-3.5 h-3.5 ${nota.fijada ? 'fill-[#EE7402]' : ''}`} />
            </button>
          </div>

          {/* Título de la tarjeta */}
          {nota.titulo && (
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug mb-1.5">
              {nota.titulo}
            </h3>
          )}

          {/* Vínculo a Alumno (si aplica) */}
          {esSeguimiento && (nota.estudianteNombre || nota.estudianteId) && (
            <div className="mb-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-[11px] flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                {nota.estudianteNombre || 'Alumno vinculado'}
              </span>
              {nota.estudianteMatricula && (
                <span className="text-slate-400 font-mono text-[10px]">
                  ({nota.estudianteMatricula})
                </span>
              )}
            </div>
          )}

          {/* Contenido resumido */}
          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed line-clamp-6">
            {nota.texto}
          </p>
        </div>

        {/* Pie de la tarjeta: Fecha + Barra de acciones rápidas */}
        <div className="pt-3 mt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{nota.fecha}</span>
          </span>

          <div
            className="flex items-center gap-1 sm:opacity-80 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Copiar */}
            <button
              type="button"
              onClick={(e) => handleCopiarNota(nota, e)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copiar texto"
            >
              {copiadoId === nota.id ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Abrir Modal */}
            <button
              type="button"
              onClick={() => abrirModalDetalleNota(nota)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#EE7402] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Ver detalle / Editar"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Eliminar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNotaAEliminar(nota);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Eliminar apunte"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-7xl mx-auto pb-12">
      {/* ======================================================== */}
      {/* 1. CABECERA LIMPIA Y PRIVADA ESTILO "BLOC DE NOTAS UAT"  */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="h-1 bg-[#EE7402]" />

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EE7402]/10 text-[#EE7402]">
                UAT &bull; Libreta Digital
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>100% Privado</span>
              </span>
            </div>
            <h1 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white mt-1">
              Bloc de Notas Privado
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setComposerExpandido(true);
                setTimeout(() => {
                  composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }}
              className="px-3.5 py-2 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Apunte</span>
            </button>
            <button
              type="button"
              onClick={cargarNotas}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Sincronizar almacenamiento local"
            >
              <RotateCcw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. PESTAÑAS SUPERIORES SENCILLAS Y BUSCADOR */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
          {/* Segmented Control / Pestañas de Filtrado */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setTabSeccion('todas')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                tabSeccion === 'todas'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <NotebookPen className="w-3.5 h-3.5" />
              <span>Todas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/15 dark:bg-black/10">
                {conteoTodas}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTabSeccion('personal')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                tabSeccion === 'personal'
                  ? 'bg-[#EE7402] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Notas Personales / Generales</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/15">
                {conteoPersonales}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTabSeccion('seguimiento')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                tabSeccion === 'seguimiento'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>Notas de Seguimiento / Alumnos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/15">
                {conteoSeguimiento}
              </span>
            </button>
          </div>

          {/* Barra de Filtro Rápido y Búsqueda */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#EE7402] cursor-pointer"
            >
              <option value="TODAS">Categorías (Todas)</option>
              {CATEGORIAS_DISPONIBLES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar apunte..."
                className="w-full pl-7 pr-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de notificación flotante */}
      {mensajeAlerta && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
            mensajeAlerta.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
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
      {/* 2. BARRA SUPERIOR DE CREACIÓN RÁPIDA (GOOGLE KEEP STYLE)  */}
      {/* ======================================================== */}
      <div ref={composerRef} className="max-w-2xl mx-auto w-full">
        {!composerExpandido ? (
          /* Estado Colapsado: Barra flotante minimalista */
          <div
            onClick={() => setComposerExpandido(true)}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 px-4 py-3.5 flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
              <span className="font-medium text-xs sm:text-sm">
                Crear una nota o apunte rápido...
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="p-1 rounded-lg group-hover:bg-[#EE7402]/10 group-hover:text-[#EE7402] transition-colors">
                <Edit3 className="w-4 h-4" />
              </span>
              <span className="p-1 rounded-lg group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                <Pin className="w-4 h-4" />
              </span>
            </div>
          </div>
        ) : (
          /* Estado Expandido: Formulario limpio Google Keep */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xl p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95 duration-150">
            {/* Fila de Título + Botón de Fijar */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Título del apunte..."
                autoFocus
                className="w-full font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 bg-transparent border-none focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setFormFijada((prev) => !prev)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  formFijada
                    ? 'text-[#EE7402] bg-orange-100/60 dark:bg-orange-950/40'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={formFijada ? 'Nota fijada' : 'Fijar nota'}
              >
                <Pin className={`w-4 h-4 ${formFijada ? 'fill-[#EE7402]' : ''}`} />
              </button>
            </div>

            {/* Texto de la nota */}
            <div>
              <textarea
                rows={3}
                value={formTexto}
                onChange={(e) => {
                  setFormTexto(e.target.value);
                  if (errorFormTexto) setErrorFormTexto(null);
                }}
                placeholder="Escribe tu apunte, resumen de sesión o compromiso..."
                className={`w-full text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-transparent border-none focus:outline-none focus:ring-0 resize-none leading-relaxed min-h-[80px] p-1 rounded-lg transition-all ${
                  errorFormTexto ? 'bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-400' : ''
                }`}
              />
              {errorFormTexto && (
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-medium pt-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorFormTexto}</span>
                </div>
              )}
            </div>

            {/* Selectores de Categoría, Tipo y Alumno */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tipo de Nota */}
                <select
                  value={formTipoSeccion}
                  onChange={(e) => setFormTipoSeccion(e.target.value as 'personal' | 'seguimiento')}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#EE7402]"
                >
                  <option value="personal">Personal / General</option>
                  <option value="seguimiento">Seguimiento de Alumno</option>
                </select>

                {/* Categoría */}
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value as CategoriaNotaPersonal)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#EE7402]"
                >
                  {CATEGORIAS_DISPONIBLES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Selector de Alumno si es de seguimiento */}
                {formTipoSeccion === 'seguimiento' && (
                  <select
                    value={formEstudianteId}
                    onChange={(e) => setFormEstudianteId(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 cursor-pointer focus:outline-none"
                  >
                    {catalogoEstudiantes.map((est) => (
                      <option key={est.id} value={est.id}>
                        {est.nombre} ({est.matricula})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFormTitulo('');
                    setFormTexto('');
                    setFormFijada(false);
                    setComposerExpandido(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => handleGuardarNuevaNota()}
                  disabled={guardando || !formTexto.trim()}
                  className="px-4 py-1.5 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] disabled:opacity-40 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. MOSAICO DE TARJETAS (GOOGLE KEEP STYLE GRID)         */}
      {/* ======================================================== */}
      {notasFiltradas.length > 0 ? (
        <div className="space-y-6">
          {/* SECCIÓN: 📌 FIJADAS (Si hay notas fijadas) */}
          {notasFijadas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                <Pin className="w-3.5 h-3.5 text-[#EE7402] fill-[#EE7402]" />
                <span>Fijadas ({notasFijadas.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                {notasFijadas.map(renderNotaCard)}
              </div>
            </div>
          )}

          {/* SECCIÓN: OTRAS NOTAS */}
          {notasOtras.length > 0 && (
            <div className="space-y-3">
              {notasFijadas.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 pt-2">
                  <span>Otras Notas ({notasOtras.length})</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                {notasOtras.map(renderNotaCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Estado Vacío Elegante */
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-3 max-w-xl mx-auto p-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#EE7402] flex items-center justify-center mx-auto">
            <NotebookPen className="w-6 h-6" />
          </div>
          <p className="font-heading font-bold text-sm text-slate-700 dark:text-slate-200">
            {busqueda || filtroCategoria !== 'TODAS'
              ? 'No se encontraron notas con estos filtros.'
              : 'No hay notas en esta sección aún.'}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {busqueda || filtroCategoria !== 'TODAS'
              ? 'Prueba modificando tus términos de búsqueda o categoría.'
              : 'Haz clic en la barra superior para crear tu primer apunte privado.'}
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL CENTRAL FLOTANTE (DETALLE / EDICIÓN ESTILO KEEP) */}
      {/* ======================================================== */}
      {notaSeleccionadaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNotaSeleccionadaModal(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Borde sutil superior UAT */}
            <div className="h-1 bg-[#EE7402]" />

            {/* Cabecera del Modal */}
            <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex-1">
                {/* Título editable in-place */}
                <input
                  type="text"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  placeholder="Título del apunte..."
                  className="w-full font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white placeholder-slate-400 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                />
                <span className="text-[11px] text-slate-400 font-mono block mt-1">
                  Registrada el {notaSeleccionadaModal.fecha}
                </span>
              </div>

              {/* Botón Pin + Botón Cerrar */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditFijada((prev) => !prev)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    editFijada
                      ? 'text-[#EE7402] bg-orange-100/60 dark:bg-orange-950/40'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={editFijada ? 'Nota fijada' : 'Fijar nota'}
                >
                  <Pin className={`w-4 h-4 ${editFijada ? 'fill-[#EE7402]' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setNotaSeleccionadaModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Cuerpo del Modal: Texto completo editable */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div>
                <textarea
                  rows={8}
                  value={editTexto}
                  onChange={(e) => {
                    setEditTexto(e.target.value);
                    if (errorEditTexto) setErrorEditTexto(null);
                  }}
                  placeholder="Escribe el texto de tu apunte..."
                  className={`w-full text-slate-800 dark:text-slate-200 placeholder-slate-400 bg-transparent border-none focus:outline-none focus:ring-0 resize-none leading-relaxed min-h-[160px] p-2 rounded-xl transition-all ${
                    errorEditTexto ? 'bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-400' : ''
                  }`}
                />
                {errorEditTexto && (
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorEditTexto}</span>
                  </div>
                )}
              </div>

              {/* Opciones de Categoría y Sección */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Tipo de Sección
                    </label>
                    <select
                      value={editTipoSeccion}
                      onChange={(e) => setEditTipoSeccion(e.target.value as 'personal' | 'seguimiento')}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="personal">Personal / General</option>
                      <option value="seguimiento">Seguimiento de Alumno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Categoría
                    </label>
                    <select
                      value={editCategoria}
                      onChange={(e) => setEditCategoria(e.target.value as CategoriaNotaPersonal)}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white cursor-pointer"
                    >
                      {CATEGORIAS_DISPONIBLES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {editTipoSeccion === 'seguimiento' && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Alumno Vinculado
                    </label>
                    <select
                      value={editEstudianteId}
                      onChange={(e) => setEditEstudianteId(e.target.value)}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white cursor-pointer"
                    >
                      {catalogoEstudiantes.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.nombre} ({est.matricula}) &bull; {est.carrera}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Pie de Acciones del Modal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
              {/* Acciones secundarias: Eliminar y Copiar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNotaAEliminar(notaSeleccionadaModal)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Eliminar apunte"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCopiarNota(notaSeleccionadaModal)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copiar texto"
                >
                  {copiadoId === notaSeleccionadaModal.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Guardar y Cerrar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNotaSeleccionadaModal(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => handleGuardarEdicionSubmit()}
                  disabled={guardandoEdicion || !editTexto.trim()}
                  className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] disabled:opacity-40 text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN                  */}
      {/* ======================================================== */}
      {notaAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNotaAEliminar(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm">¿Eliminar este apunte?</span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-normal">
              Esta acción borrará permanentemente la nota de tu almacenamiento local (IndexedDB y LocalStorage).
            </p>

            {notaAEliminar.titulo && (
              <p className="font-semibold text-slate-900 dark:text-white p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                "{notaAEliminar.titulo}"
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNotaAEliminar(null)}
                className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-2xs cursor-pointer"
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
