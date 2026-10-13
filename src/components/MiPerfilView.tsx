import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { EstadisticasPersistencia } from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { AvatarWithFallback } from './AvatarWithFallback';
import { UatHeraldicSeal } from './UatLogo';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Hash,
  BookOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Lock,
  Database,
  Download,
  RefreshCw,
  Trash2,
  Camera,
  Upload,
  Image as ImageIcon,
  Check,
  Award
} from 'lucide-react';

interface MiPerfilViewProps {
  onLogout?: () => void;
}

// Catálogo de avatares académicos institucionales de alta calidad
const AVATARES_PREDETERMINADOS = [
  {
    id: 'av-1',
    label: 'Docente 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-2',
    label: 'Docente 2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-3',
    label: 'Docente 3',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-4',
    label: 'Docente 4',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-5',
    label: 'Docente 5',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'av-6',
    label: 'Docente 6',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80'
  }
];

export const MiPerfilView: React.FC<MiPerfilViewProps> = () => {
  const { sesion, actualizarPerfil, logout } = useAuth();
  const usuario = sesion?.usuario;

  // Estado del formulario
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [avatar, setAvatar] = useState(usuario?.avatar || '');
  const [telefono, setTelefono] = useState(usuario?.telefono || '');
  const [departamento, setDepartamento] = useState(usuario?.departamento || '');
  const [cubiculo, setCubiculo] = useState(usuario?.cubículo || '');
  const [matricula, setMatricula] = useState(usuario?.matricula || '');
  const [carrera, setCarrera] = useState(usuario?.carrera || '');
  const [semestre, setSemestre] = useState<number>(usuario?.semestre || 1);
  const [passwordNueva, setPasswordNueva] = useState('');

  // Selector de foto de perfil
  const [tipoSeleccionFoto, setTipoSeleccionFoto] = useState<'galeria' | 'url' | 'subir'>('galeria');
  const [urlPersonalizada, setUrlPersonalizada] = useState('');
  const inputFileRef = useRef<HTMLInputElement>(null);

  // Estados de retroalimentación
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Estadísticas de Persistencia Real (IndexedDB / LocalStorage)
  const [statsPersistencia, setStatsPersistencia] = useState<EstadisticasPersistencia | null>(null);
  const [mensajeDb, setMensajeDb] = useState<string | null>(null);

  // Modal de confirmación para gestión de BD
  const [modalConfirmDb, setModalConfirmDb] = useState<'reset' | 'clear' | null>(null);

  const cargarStats = async () => {
    const stats = await tutoriaService.getEstadisticasPersistencia();
    setStatsPersistencia(stats);
  };

  useEffect(() => {
    cargarStats();
    const unsub = tutoriaService.subscribe(() => {
      cargarStats();
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setAvatar(usuario.avatar || '');
      setTelefono(usuario.telefono || '');
      setDepartamento(usuario.departamento || '');
      setCubiculo(usuario.cubículo || '');
      setMatricula(usuario.matricula || '');
      setCarrera(usuario.carrera || '');
      setSemestre(usuario.semestre || 1);
      setUrlPersonalizada(usuario.avatar || '');
    }
  }, [usuario]);

  if (!sesion || !usuario) return null;

  // Manejador para carga local de imagen (convertida a Data URL base64)
  const handleSubirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMensajeError('Por favor selecciona un archivo de imagen válido (JPG, PNG o WEBP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setMensajeError('La imagen no debe exceder 4 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        setUrlPersonalizada(reader.result);
        setMensajeError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAplicarUrl = () => {
    if (!urlPersonalizada.trim()) return;
    setAvatar(urlPersonalizada.trim());
    setMensajeError(null);
  };

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeExito(null);
    setMensajeError(null);

    if (!nombre.trim()) {
      setMensajeError('El nombre completo es obligatorio.');
      return;
    }

    setGuardando(true);

    try {
      const avatarFinal = avatar.trim() || usuario.avatar;

      // 1. Guardar en AuthContext y authService (token JWT, cuentas)
      const res = await actualizarPerfil({
        nombre: nombre.trim(),
        avatar: avatarFinal,
        telefono: telefono.trim(),
        departamento: usuario.rol === 'TUTOR' ? departamento.trim() : undefined,
        cubículo: usuario.rol === 'TUTOR' ? cubiculo.trim() : undefined,
        matricula: usuario.rol === 'TUTORADO' ? matricula.trim() : undefined,
        carrera: usuario.rol === 'TUTORADO' ? carrera.trim() : undefined,
        semestre: usuario.rol === 'TUTORADO' ? semestre : undefined,
        passwordNueva: passwordNueva.trim() ? passwordNueva.trim() : undefined
      });

      // 2. Persistir en tutoriaService para sincronizar catálogos y todas las vistas del sistema
      if (usuario.rol === 'TUTOR') {
        const tutorId = usuario.tutorProfileId || 'tutor-001';
        await tutoriaService.actualizarTutor(tutorId, {
          nombre: nombre.trim(),
          avatar: avatarFinal,
          departamento: departamento.trim(),
          cubículo: cubiculo.trim()
        });
      } else {
        const estId = usuario.estudianteProfileId || 'est-101';
        await tutoriaService.actualizarEstudiante(estId, {
          nombre: nombre.trim(),
          avatar: avatarFinal,
          carrera: carrera.trim(),
          matricula: matricula.trim(),
          semestre: semestre,
          telefono: telefono.trim()
        });
      }

      setGuardando(false);

      if (!res.success) {
        setMensajeError(res.message);
        return;
      }

      setPasswordNueva('');
      setMensajeExito('Tu perfil institucional se ha actualizado con éxito. Los cambios se reflejan en todo el sistema.');

      // Auto ocultar mensaje tras 4 segundos
      setTimeout(() => {
        setMensajeExito(null);
      }, 4000);
    } catch {
      setGuardando(false);
      setMensajeError('Ocurrió un error al guardar los cambios de perfil. Inténtalo de nuevo.');
    }
  };

  const handleEjecutarAccionDb = async () => {
    if (modalConfirmDb === 'reset') {
      await tutoriaService.resetToDefault();
      await cargarStats();
      setMensajeDb('Datos institucionales restablecidos correctamente.');
    } else if (modalConfirmDb === 'clear') {
      await tutoriaService.vaciarDatosMock();
      await cargarStats();
      setMensajeDb('Base de datos vaciada. Sistema limpio para captura.');
    }
    setModalConfirmDb(null);
    setTimeout(() => setMensajeDb(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. CABECERA ÚNICA, LIMPIA Y EJECUTIVA (SIN REPETICIONES)  */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
        {/* Barra de acento UAT superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#EE7402] via-[#FF9E3B] to-[#002B49]" />

        <div className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Identidad Principal: Avatar único interactivo + Información oficial */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Contenedor del Avatar único con botón de cambio rápido */}
            <div className="relative group shrink-0">
              <AvatarWithFallback
                src={avatar || usuario.avatar}
                alt={nombre || usuario.nombre}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-4 ring-[#EE7402]/20 dark:ring-[#EE7402]/30 shadow-md object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setTipoSeleccionFoto('subir');
                  inputFileRef.current?.click();
                }}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-[#EE7402] hover:bg-[#D96200] text-white shadow-md transition-transform hover:scale-110 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EE7402]/50"
                title="Cambiar fotografía de perfil"
                aria-label="Cambiar fotografía de perfil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EE7402]/10 text-[#EE7402] dark:bg-[#EE7402]/20 dark:text-[#FF9E3B] border border-[#EE7402]/25">
                  <Award className="w-3.5 h-3.5" />
                  <span>{usuario.rol === 'TUTOR' ? 'Docente Tutor Institucional' : 'Alumno Tutorado'}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {usuario.id}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Acreditación Activa UAT</span>
                </span>
              </div>

              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                {nombre || usuario.nombre}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#EE7402] shrink-0" />
                  <span>{usuario.email}</span>
                </span>

                {usuario.rol === 'TUTOR' ? (
                  <>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-700">&bull;</span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{departamento || usuario.departamento || 'Sin adscripción'}</span>
                    </span>
                    {cubiculo && (
                      <>
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">&bull;</span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{cubiculo}</span>
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-700">&bull;</span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{carrera || usuario.carrera}</span>
                    </span>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-700">&bull;</span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{matricula || usuario.matricula}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Acciones de la Cabecera */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CUADRÍCULA PRINCIPAL: FORMULARIO Y ACREDITACIÓN       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================== */}
        {/* COLUMNA IZQUIERDA: PERSONALIZACIÓN & EDICIÓN DE DATOS  */}
        {/* ====================================================== */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Personalización del Perfil Institucional
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modifica tu nombre, imagen de perfil y datos de contacto oficial
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-semibold text-[#EE7402] bg-[#EE7402]/10 px-2.5 py-1 rounded-lg">
                UAT 2026-1
              </span>
            </div>

            {/* Notificación sutil de éxito */}
            {mensajeExito && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium">{mensajeExito}</span>
              </div>
            )}

            {/* Notificación de error */}
            {mensajeError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{mensajeError}</span>
              </div>
            )}

            <form onSubmit={handleGuardarPerfil} className="space-y-6">
              {/* ================================================== */}
              {/* SECCIÓN A: SELECCIÓN Y EDICIÓN DE FOTO DE PERFIL  */}
              {/* ================================================== */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#EE7402]" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Fotografía de Perfil Institucional
                    </span>
                  </div>

                  {/* Pestañas de modo de selección de avatar */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 dark:bg-slate-700/70 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setTipoSeleccionFoto('galeria')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        tipoSeleccionFoto === 'galeria'
                          ? 'bg-white dark:bg-slate-900 text-[#EE7402] shadow-2xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Galería
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoSeleccionFoto('subir')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        tipoSeleccionFoto === 'subir'
                          ? 'bg-white dark:bg-slate-900 text-[#EE7402] shadow-2xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Subir Archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoSeleccionFoto('url')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        tipoSeleccionFoto === 'url'
                          ? 'bg-white dark:bg-slate-900 text-[#EE7402] shadow-2xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      URL Web
                    </button>
                  </div>
                </div>

                {/* Opción 1: Galería de avatares predeterminados */}
                {tipoSeleccionFoto === 'galeria' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Selecciona un avatar académico profesional institucional:
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                      {AVATARES_PREDETERMINADOS.map((item) => {
                        const esSeleccionado = avatar === item.url;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setAvatar(item.url);
                              setUrlPersonalizada(item.url);
                            }}
                            className={`relative group rounded-xl p-1 transition-all cursor-pointer border ${
                              esSeleccionado
                                ? 'border-[#EE7402] bg-[#EE7402]/10 ring-2 ring-[#EE7402]/40'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <img
                              src={item.url}
                              alt={item.label}
                              className="w-full aspect-square rounded-lg object-cover"
                            />
                            {esSeleccionado && (
                              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#EE7402] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Opción 2: Subir archivo desde el equipo */}
                {tipoSeleccionFoto === 'subir' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sube una fotografía desde tu computadora o dispositivo móvil (JPG, PNG):
                    </p>
                    <input
                      ref={inputFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSubirArchivo}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => inputFileRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-[#EE7402] text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-2xs hover:bg-[#EE7402]/5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-[#EE7402]" />
                        <span>Seleccionar archivo de imagen</span>
                      </button>

                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Máximo 4 MB &middot; Recorte automático
                      </span>
                    </div>
                  </div>
                )}

                {/* Opción 3: Ingresar URL directa */}
                {tipoSeleccionFoto === 'url' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400">
                      Ingresa el enlace directo a una imagen en la web:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={urlPersonalizada}
                        onChange={(e) => setUrlPersonalizada(e.target.value)}
                        placeholder="https://ejemplo.com/mi-foto.jpg"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                      />
                      <button
                        type="button"
                        onClick={handleAplicarUrl}
                        className="px-3.5 py-2 rounded-xl bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ================================================== */}
              {/* SECCIÓN B: NOMBRE COMPLETO Y CORREO                */}
              {/* ================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo <span className="text-[#EE7402]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Dr. Roberto Mendoza Salinas"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico Institucional (Oficial UAT)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      disabled
                      value={usuario.email}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* ================================================== */}
              {/* SECCIÓN C: TELÉFONO Y CONTRASEÑA NUEVA             */}
              {/* ================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Institucional / Móvil
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+52 834 123 4567"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actualizar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={passwordNueva}
                      onChange={(e) => setPasswordNueva(e.target.value)}
                      placeholder="Dejar en blanco para conservar actual"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                    />
                  </div>
                </div>
              </div>

              {/* ================================================== */}
              {/* SECCIÓN D: CAMPOS DEPARTAMENTALES / ACADÉMICOS     */}
              {/* ================================================== */}
              {usuario.rol === 'TUTOR' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Facultad / Departamento Académico
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={departamento}
                        onChange={(e) => setDepartamento(e.target.value)}
                        placeholder="Ingeniería en Sistemas Computacionales"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cubículo de Atención Tutorial
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={cubiculo}
                        onChange={(e) => setCubiculo(e.target.value)}
                        placeholder="Edificio B, Cubículo 204"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {usuario.rol === 'TUTORADO' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Matrícula Escolar
                    </label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Programa Académico / Carrera
                    </label>
                    <div className="relative">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={carrera}
                        onChange={(e) => setCarrera(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Semestre Activo
                    </label>
                    <select
                      value={semestre}
                      onChange={(e) => setSemestre(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                        <option key={s} value={s}>
                          {s}° Semestre
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Botón de Guardar Cambios */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Los cambios se sincronizan en tiempo real
                </span>

                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 rounded-xl bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white font-heading font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 hover:shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{guardando ? 'Guardando Perfil...' : 'Guardar Cambios de Perfil'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ====================================================== */}
        {/* COLUMNA DERECHA: ACREDITACIÓN OFICIAL & SEGURIDAD     */}
        {/* (SIN REPETIR LA FOTO NI EL NOMBRE DE LA CABECERA)      */}
        {/* ====================================================== */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tarjeta de Acreditación Institucional UAT (Diseño limpio y ejecutivo sin avatar repetido) */}
          <div
            style={{ backgroundColor: '#002B49' }}
            className="rounded-2xl p-6 text-white border border-[#003D66] shadow-sm relative overflow-hidden"
          >
            {/* Resplandor decorativo naranja UAT */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#EE7402]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="shrink-0 p-1.5 rounded-xl bg-white/10 border border-white/15">
                  <UatHeraldicSeal size={36} textColor="light" showMotto={false} />
                </div>
                <div>
                  <span className="font-heading font-extrabold text-xs tracking-wider text-[#EE7402] block uppercase">
                    Universidad Autónoma de Tamaulipas
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    Dirección de Tutorías Académicas
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#EE7402] text-white shadow-2xs">
                CICLO 2026-1
              </span>
            </div>

            {/* Datos de Acreditación Oficial */}
            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Programa:</span>
                <span className="font-semibold text-white">
                  Sistema Institucional de Tutorías
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Folio de Registro:</span>
                <span className="font-mono font-semibold text-[#EE7402]">
                  UAT-TUT-{usuario.id.replace('usr-', '').toUpperCase()}-2026
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Estatus Institucional:</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Acreditado y Vigente</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Sede de Adscripción:</span>
                <span className="text-slate-200">
                  Campus Ciudad Victoria / Zona Centro
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300 font-serif italic">
              <span>&ldquo;Verdad, Belleza, Probidad&rdquo;</span>
              <span className="font-sans not-italic font-mono text-[10px] text-slate-400">
                SIT-UAT v2.6
              </span>
            </div>
          </div>

          {/* Tarjeta Informativa de Acompañamiento Tutorial */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Acompañamiento Tutorial UAT
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Formación integral y seguimiento académico
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Modalidad:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {usuario.rol === 'TUTOR' ? 'Tutorías Individuales y Grupales' : 'Asesoría y Tutoría Continua'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Enfoque:</span>
                  <span className="font-semibold text-[#EE7402]">
                    Éxito y Permanencia Escolar
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Atención Tutorial:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {usuario.cubículo ? `Cubículo: ${usuario.cubículo}` : 'Horario y Cubículo Institucional'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200">
                <p className="leading-relaxed">
                  El Sistema Institucional de Tutorías de la UAT tiene como propósito guiar a los estudiantes en su formación integral, fomentando la excelencia y los valores universitarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BASE DE DATOS Y PERSISTENCIA (SÓLO PARA TUTOR)        */}
      {/* ======================================================== */}
      {usuario.rol === 'TUTOR' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                    Base de Datos y Persistencia Local
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    IndexedDB W3C + LocalStorage
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Los datos de tutorados, citas, acuerdos, archivos y notas se mantienen guardados de forma segura en tu navegador.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={async () => {
                  const jsonStr = await tutoriaService.exportarBaseDeDatosJSON();
                  const blob = new Blob([jsonStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `respaldo_uat_tutorias_${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setMensajeDb('Respaldo institucional de la base de datos exportado en JSON.');
                  setTimeout(() => setMensajeDb(null), 3000);
                }}
                className="px-3 py-1.5 bg-[#EE7402]/10 hover:bg-[#EE7402] hover:text-white text-[#EE7402] dark:text-[#EE7402] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Descargar copia íntegra de la base de datos"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>

              <button
                onClick={() => setModalConfirmDb('reset')}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restablecer Muestra</span>
              </button>

              <button
                onClick={() => setModalConfirmDb('clear')}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar Base</span>
              </button>
            </div>
          </div>

          {mensajeDb && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensajeDb}</span>
            </div>
          )}

          {/* Cuadrícula de Métricas de Almacenamiento */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Registros del Sistema</span>
              <span className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                {statsPersistencia?.totalUsuarios ?? 1}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Tutorados Asignados</span>
              <span className="font-heading font-bold text-lg text-[#EE7402]">
                {statsPersistencia?.totalAsignaciones ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Sesiones / Agenda</span>
              <span className="font-heading font-bold text-lg text-sky-600 dark:text-sky-400">
                {statsPersistencia?.totalCitas ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Archivos &amp; Evidencias</span>
              <span className="font-heading font-bold text-lg text-indigo-600 dark:text-indigo-400">
                {statsPersistencia?.totalArchivos ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Actividades / Tareas</span>
              <span className="font-heading font-bold text-lg text-amber-600 dark:text-amber-400">
                {statsPersistencia?.totalActividades ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Notas Personales</span>
              <span className="font-heading font-bold text-purple-600 dark:text-purple-400">
                {statsPersistencia?.totalNotas ?? 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Restablecer o Vaciar Base de Datos */}
      {modalConfirmDb && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalConfirmDb(null);
          }}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  modalConfirmDb === 'clear'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : 'bg-[#EE7402]/15 text-[#EE7402]'
                }`}
              >
                {modalConfirmDb === 'clear' ? <Trash2 className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  {modalConfirmDb === 'clear'
                    ? '¿Vaciar completamente la base de datos?'
                    : '¿Restablecer datos de muestra institucionales?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {modalConfirmDb === 'clear'
                    ? 'Esta acción eliminará todos los registros y te permitirá iniciar una captura desde cero.'
                    : 'Esta acción restaurará los tutorados, citas y formatos oficiales iniciales de la UAT.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200">
              {modalConfirmDb === 'clear'
                ? 'Se mantendrá tu usuario y credenciales actuales de sesión.'
                : 'Se sincronizará en IndexedDB y LocalStorage.'}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmDb(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarAccionDb}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors cursor-pointer ${
                  modalConfirmDb === 'clear'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#EE7402] hover:bg-[#D96200]'
                }`}
              >
                {modalConfirmDb === 'clear' ? 'Sí, vaciar base' : 'Sí, restablecer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
