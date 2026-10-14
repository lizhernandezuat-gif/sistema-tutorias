import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RolUsuario, EstadisticasPersistencia } from '../types/tutoria';
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
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Users,
  Search,
  Lock,
  Database,
  Download,
  RefreshCw,
  Trash2,
  KeyRound,
  Camera,
  Calendar,
  Clock,
  GraduationCap,
  Sparkles,
  QrCode,
  BadgeCheck,
  ExternalLink,
  X
} from 'lucide-react';

interface MiPerfilViewProps {
  onLogout?: () => void;
}

const AVATARES_PREDETERMINADOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
];

export const MiPerfilView: React.FC<MiPerfilViewProps> = () => {
  const { sesion, actualizarPerfil, logout, usuariosRegistrados } = useAuth();
  const usuario = sesion?.usuario;

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [telefono, setTelefono] = useState(usuario?.telefono || '');
  const [departamento, setDepartamento] = useState(usuario?.departamento || '');
  const [cubiculo, setCubiculo] = useState(usuario?.cubículo || '');
  const [horarioAtencion, setHorarioAtencion] = useState(
    usuario?.horarioAtencion || (usuario?.rol === 'TUTOR' ? 'Lunes a Jueves: 10:00 - 13:00 hrs' : '')
  );
  const [avatar, setAvatar] = useState(usuario?.avatar || '');
  const [matricula, setMatricula] = useState(usuario?.matricula || '');
  const [carrera, setCarrera] = useState(usuario?.carrera || '');
  const [semestre, setSemestre] = useState<number>(usuario?.semestre || 1);
  const [passwordNueva, setPasswordNueva] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Modal para cambiar foto de perfil
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);
  const [fotoUrlInput, setFotoUrlInput] = useState('');

  // Estadísticas de Persistencia Real
  const [statsPersistencia, setStatsPersistencia] = useState<EstadisticasPersistencia | null>(null);
  const [mensajeDb, setMensajeDb] = useState<string | null>(null);

  // Modal de confirmación para gestión de BD
  const [modalConfirmDb, setModalConfirmDb] = useState<'reset' | 'clear' | null>(null);

  // Filtros de la Base de Usuarios (sólo visible para Tutor)
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [filtroRol, setFiltroRol] = useState<'TODOS' | RolUsuario>('TODOS');

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
      setTelefono(usuario.telefono || '');
      setDepartamento(usuario.departamento || '');
      setCubiculo(usuario.cubículo || '');
      setHorarioAtencion(
        usuario.horarioAtencion || (usuario.rol === 'TUTOR' ? 'Lunes a Jueves: 10:00 - 13:00 hrs' : '')
      );
      setAvatar(usuario.avatar || '');
      setMatricula(usuario.matricula || '');
      setCarrera(usuario.carrera || '');
      setSemestre(usuario.semestre || 1);
    }
  }, [usuario]);

  if (!sesion || !usuario) return null;

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeExito(null);
    setMensajeError(null);
    setGuardando(true);

    const res = await actualizarPerfil({
      nombre,
      telefono,
      avatar,
      departamento: usuario.rol === 'TUTOR' ? departamento : undefined,
      cubículo: usuario.rol === 'TUTOR' ? cubiculo : undefined,
      horarioAtencion: usuario.rol === 'TUTOR' ? horarioAtencion : undefined,
      matricula: usuario.rol === 'TUTORADO' ? matricula : undefined,
      carrera: usuario.rol === 'TUTORADO' ? carrera : undefined,
      semestre: usuario.rol === 'TUTORADO' ? semestre : undefined,
      passwordNueva: passwordNueva.trim() ? passwordNueva.trim() : undefined
    });

    setGuardando(false);
    if (!res.success) {
      setMensajeError(res.message);
      return;
    }

    setPasswordNueva('');
    setMensajeExito(res.message);
    setTimeout(() => setMensajeExito(null), 4000);
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

  const usuariosFiltrados = usuariosRegistrados.filter((u) => {
    const coincideRol = filtroRol === 'TODOS' || u.rol === filtroRol;
    const q = busquedaUsuario.toLowerCase().trim();
    const coincideTexto =
      !q ||
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.matricula && u.matricula.toLowerCase().includes(q)) ||
      (u.departamento && u.departamento.toLowerCase().includes(q));
    return coincideRol && coincideTexto;
  });

  const expDate = new Date(sesion.payload.exp * 1000).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const esTutor = usuario.rol === 'TUTOR';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================= */}
      {/* 1. HERO HEADER: IDENTIDAD INSTITUCIONAL UAT ELEGANTE      */}
      {/* ========================================================= */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Banner de Cabecera con degradado UAT Navy y destello naranja */}
        <div
          style={{ backgroundColor: '#002B49' }}
          className="h-32 sm:h-40 w-full relative overflow-hidden"
        >
          {/* Destello sutil naranja UAT */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-[#EE7402]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Sello de agua sutil del escudo institucional en el banner */}
          <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none">
            <UatHeraldicSeal size={150} textColor="light" />
          </div>

          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/40 text-amber-300 border border-amber-400/30 backdrop-blur-md">
              Universidad Autónoma de Tamaulipas
            </span>
            <span className="hidden sm:inline-block text-[11px] text-white/80 font-medium">
              &bull; Ciclo 2026-1
            </span>
          </div>

          <div className="absolute top-4 right-6 hidden sm:block">
            <span className="text-xs text-white/75 font-serif italic">
              &ldquo;Verdad, Belleza, Probidad&rdquo;
            </span>
          </div>
        </div>

        {/* Bloque de Información del Usuario sobre el Banner */}
        <div className="px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 relative z-10">
            {/* Foto de Perfil con opción de cambio rápido */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative group shrink-0">
                <AvatarWithFallback
                  src={avatar || usuario.avatar}
                  alt={usuario.nombre}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-white dark:ring-slate-900 shadow-xl object-cover bg-slate-100 dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFotoUrlInput(avatar || usuario.avatar);
                    setModalFotoAbierto(true);
                  }}
                  className="absolute bottom-1 right-1 p-2 rounded-xl bg-[#EE7402] hover:bg-[#D96200] text-white shadow-md transition-all hover:scale-105 cursor-pointer ring-2 ring-white dark:ring-slate-900"
                  title="Cambiar fotografía de perfil"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                    {nombre || usuario.nombre}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EE7402]/10 text-[#EE7402] border border-[#EE7402]/30">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>{esTutor ? 'Docente Acreditado' : 'Alumno Regular'}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    {usuario.email}
                  </span>
                  <span>&bull;</span>
                  <span>
                    {esTutor
                      ? `${departamento || usuario.departamento || 'Facultad de Ingeniería'}`
                      : `${carrera || usuario.carrera} (Matrícula: ${matricula || usuario.matricula})`}
                  </span>
                </p>

                {esTutor && horarioAtencion && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#EE7402]" />
                    <span>Horario de Atención: <strong className="text-slate-900 dark:text-white">{horarioAtencion}</strong></span>
                    <span>&bull;</span>
                    <MapPin className="w-3.5 h-3.5 text-[#EE7402]" />
                    <span>Cubículo: <strong className="text-slate-900 dark:text-white">{cubiculo || usuario.cubículo}</strong></span>
                  </p>
                )}
              </div>
            </div>

            {/* Botón de Cerrar Sesión */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 self-center sm:self-auto shrink-0">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CUADRÍCULA PRINCIPAL: FORMULARIOS & CREDENCIAL         */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (7 COLS): FORMULARIO Y SEGURIDAD */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tarjeta: Información de Perfil y Contacto */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Información Personal y Académica
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {esTutor
                    ? 'Datos de contacto docente, cubículo y horarios de atención a tutorados'
                    : 'Datos del estudiante, matrícula escolar y programa académico'}
                </p>
              </div>
            </div>

            {mensajeExito && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{mensajeExito}</span>
              </div>
            )}

            {mensajeError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{mensajeError}</span>
              </div>
            )}

            <form onSubmit={handleGuardarPerfil} className="space-y-4">
              {/* Nombre y Correo Institucional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico Institucional (Oficial)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      disabled
                      value={usuario.email}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Teléfono de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono de Contacto / Móvil
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+52 834 000 0000"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fotografía de Perfil (URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setModalFotoAbierto(true)}
                      className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Galería
                    </button>
                  </div>
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS DEL DOCENTE TUTOR */}
              {esTutor && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Facultad / Departamento Académico
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={departamento}
                          onChange={(e) => setDepartamento(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cubículo de Atención Tutorial
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={cubiculo}
                          onChange={(e) => setCubiculo(e.target.value)}
                          placeholder="Edificio B, Cubículo 204"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* HORARIO DE ATENCIÓN TUTORIAL (Requisito explícito de la tarea) */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Horario de Atención Tutorial Institucional *
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#EE7402] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={horarioAtencion}
                        onChange={(e) => setHorarioAtencion(e.target.value)}
                        placeholder="Ej. Lunes a Jueves: 10:00 - 13:00 hrs y Viernes 09:00 - 12:00 hrs"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402] transition-colors font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Este horario se mostrará automáticamente en el portal de tus alumnos tutorados al agendar asesorías.
                    </p>
                  </div>
                </>
              )}

              {/* CAMPOS ESPECÍFICOS DEL ALUMNO TUTORADO */}
              {!esTutor && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Matrícula Escolar
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Programa Académico / Carrera
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={carrera}
                        onChange={(e) => setCarrera(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402] transition-colors"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 transition-colors"
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

              {/* Botón de Guardado */}
              <div className="pt-3 flex justify-end border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white font-heading font-semibold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{guardando ? 'Guardando Perfil...' : 'Guardar Información'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tarjeta: Seguridad y Contraseña */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Seguridad y Clave de Acceso
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Actualización de credencial confidencial del sistema de tutorías
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Contraseña Institucional
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    placeholder="Dejar en blanco si deseas mantener la actual"
                    className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-[11px] font-semibold text-[#EE7402] hover:underline cursor-pointer"
                  >
                    {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Mínimo 6 caracteres alfanuméricos recomendados.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-600 dark:text-slate-400">Vigencia del Token de Sesión:</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {expDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (5 COLS): CREDENCIAL DIGITAL & WIDGETS */}
        <div className="lg:col-span-5 space-y-6">
          {/* CREDENCIAL DIGITAL INSTITUCIONAL UAT */}
          <div
            style={{ backgroundColor: '#002B49' }}
            className="rounded-2xl p-5 text-white border border-[#003D66] shadow-md relative overflow-hidden"
          >
            {/* Halo de resplandor naranja */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#EE7402]/20 rounded-full blur-2xl pointer-events-none" />

            {/* Cabecera de la Credencial */}
            <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="shrink-0 p-1 rounded-full bg-white/10 border border-white/15">
                  <UatHeraldicSeal size={36} textColor="light" showMotto={false} />
                </div>
                <div>
                  <span className="font-heading font-extrabold text-[11px] tracking-wider text-[#EE7402] block uppercase">
                    Universidad Autónoma de Tamaulipas
                  </span>
                  <span className="text-[10px] text-slate-300 block">
                    Credencial Oficial de Tutorías
                  </span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EE7402] text-white">
                {usuario.rol}
              </span>
            </div>

            {/* Cuerpo de la Credencial */}
            <div className="flex items-center gap-4">
              <AvatarWithFallback
                src={avatar || usuario.avatar}
                alt={usuario.nombre}
                className="w-16 h-16 rounded-xl ring-2 ring-[#EE7402] shrink-0 object-cover shadow-md"
              />
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-sm text-white truncate">
                  {nombre || usuario.nombre}
                </h3>
                <p className="text-[11px] text-slate-300 truncate">
                  {esTutor
                    ? (departamento || usuario.departamento || 'Facultad de Ingeniería')
                    : (carrera || usuario.carrera)}
                </p>
                <p className="text-[10px] font-mono text-amber-300 mt-0.5">
                  {esTutor
                    ? `Cubículo: ${cubiculo || usuario.cubículo}`
                    : `Matrícula: ${matricula || usuario.matricula}`}
                </p>
              </div>
            </div>

            {/* Código de barras / QR simulado institucional */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
              <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400">
                <QrCode className="w-5 h-5 text-white/80" />
                <span>FOLIO-{usuario.id.toUpperCase()}</span>
              </div>
              <span className="font-serif italic text-white/90">
                &ldquo;Verdad, Belleza, Probidad&rdquo;
              </span>
            </div>
          </div>

          {/* ROL ALUMNO: FICHA DEL TUTOR ASIGNADO Y HORARIO */}
          {!esTutor && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Mi Tutor Docente Asignado
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Acompañamiento y orientación académica UAT
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-3">
                  <AvatarWithFallback
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="Dr. Roberto Mendoza Salinas"
                    className="w-12 h-12 rounded-xl ring-2 ring-[#EE7402]/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-heading font-bold text-xs text-slate-900 dark:text-white block">
                      Dr. Roberto Mendoza Salinas
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      Coordinación de Tutorías &bull; FIANS UAT
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-[#EE7402] shrink-0" />
                    <span>Horario de Atención: <strong>Lunes a Jueves 10:00 - 13:00 hrs</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-[#EE7402] shrink-0" />
                    <span>Cubículo: <strong>Edificio B, Cubículo 204</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-[#EE7402] shrink-0" />
                    <span className="font-mono text-[11px]">roberto.mendoza@universidad.edu.mx</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ROL TUTOR: PANEL DE PERSISTENCIA Y BASE DE DATOS */}
          {esTutor && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      Base de Datos Institucional
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      IndexedDB W3C + LocalStorage
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  Activa
                </span>
              </div>

              {mensajeDb && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{mensajeDb}</span>
                </div>
              )}

              {/* Botones de Operación de la Base de Datos */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
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
                    setMensajeDb('Respaldo institucional exportado exitosamente.');
                    setTimeout(() => setMensajeDb(null), 3000);
                  }}
                  className="px-2.5 py-2 bg-[#EE7402]/10 hover:bg-[#EE7402] hover:text-white text-[#EE7402] rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                  title="Exportar respaldo de datos"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalConfirmDb('reset')}
                  className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                  title="Restablecer datos muestra UAT"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalConfirmDb('clear')}
                  className="px-2.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                  title="Vaciar base de datos"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>
              </div>

              {/* Métricas de Registro */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Tutorados Asignados</span>
                  <span className="font-heading font-bold text-base text-[#EE7402]">
                    {statsPersistencia?.totalAsignaciones ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Sesiones Agendadas</span>
                  <span className="font-heading font-bold text-base text-sky-600 dark:text-sky-400">
                    {statsPersistencia?.totalCitas ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. BASE DE CUENTAS INSTITUCIONALES (SOLO DOCENTE TUTOR)   */}
      {/* ========================================================= */}
      {esTutor && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Base de Cuentas Institucionales ({usuariosRegistrados.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Directorio de credenciales activas del sistema de tutorías
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                  placeholder="Buscar usuario..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {(['TODOS', 'TUTOR', 'TUTORADO'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFiltroRol(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      filtroRol === r
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {r === 'TODOS' ? 'Todos' : r === 'TUTOR' ? 'Docentes' : 'Alumnos'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Correo Institucional</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Adscripción / Matrícula</th>
                  <th className="py-2.5 px-3 text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {usuariosFiltrados.map((u) => {
                  const esActual = u.id === usuario.id;
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        esActual
                          ? 'bg-[#EE7402]/5 dark:bg-[#EE7402]/10'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <AvatarWithFallback
                            src={u.avatar}
                            alt={u.nombre}
                            className="w-7 h-7 rounded-full shrink-0 ring-1 ring-[#EE7402]/30"
                          />
                          <span className="font-heading font-semibold text-slate-900 dark:text-white">
                            {u.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-semibold text-[11px] ${
                            u.rol === 'TUTOR'
                              ? 'text-[#EE7402]'
                              : 'text-sky-700 dark:text-sky-400'
                          }`}
                        >
                          {u.rol === 'TUTOR' ? 'Docente Tutor' : 'Alumno Tutorado'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        {u.rol === 'TUTOR'
                          ? u.departamento
                          : `${u.matricula || 'Sin matrícula'} · ${u.carrera || ''}`}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {esActual ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Sesión Activa</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Registrado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL PARA CAMBIO DE FOTO / AVATAR                     */}
      {/* ========================================================= */}
      {modalFotoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalFotoAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Cambiar Fotografía de Perfil
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalFotoAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Selecciona una imagen institucional:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {AVATARES_PREDETERMINADOS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFotoUrlInput(url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                        fotoUrlInput === url
                          ? 'border-[#EE7402] ring-2 ring-[#EE7402]/30 scale-105'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <img src={url} alt={`Opción ${idx + 1}`} className="w-full h-full object-cover" />
                      {fotoUrlInput === url && (
                        <div className="absolute inset-0 bg-[#EE7402]/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  O ingresa una URL personalizada:
                </label>
                <input
                  type="url"
                  value={fotoUrlInput}
                  onChange={(e) => setFotoUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalFotoAbierto(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (fotoUrlInput.trim()) {
                    setAvatar(fotoUrlInput.trim());
                  }
                  setModalFotoAbierto(false);
                }}
                className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Aplicar Fotografía
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL DE CONFIRMACIÓN PARA GESTIÓN DE BASE DE DATOS    */}
      {/* ========================================================= */}
      {modalConfirmDb && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalConfirmDb(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  modalConfirmDb === 'clear'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  {modalConfirmDb === 'clear' ? 'Vaciar Base de Datos' : 'Restablecer Muestra'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {modalConfirmDb === 'clear'
                    ? '¿Estás seguro de vaciar todos los datos? Comenzarás con el sistema limpio.'
                    : '¿Deseas restablecer los datos oficiales de muestra de la UAT?'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalConfirmDb(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEjecutarAccionDb}
                className={`px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                  modalConfirmDb === 'clear'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#EE7402] hover:bg-[#D96200]'
                }`}
              >
                {modalConfirmDb === 'clear' ? 'Sí, Vaciar' : 'Sí, Restablecer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
