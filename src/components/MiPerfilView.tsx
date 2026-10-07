import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RolUsuario, EstadisticasPersistencia } from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { AvatarWithFallback } from './AvatarWithFallback';
import { UatHeraldicSeal, UatCorporateLogo } from './UatLogo';
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
  ArrowRight,
  Database,
  Download,
  RefreshCw,
  Trash2,
  KeyRound
} from 'lucide-react';

interface MiPerfilViewProps {
  onLogout?: () => void;
}

export const MiPerfilView: React.FC<MiPerfilViewProps> = () => {
  const { sesion, actualizarPerfil, logout, usuariosRegistrados } = useAuth();
  const usuario = sesion?.usuario;

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [telefono, setTelefono] = useState(usuario?.telefono || '');
  const [departamento, setDepartamento] = useState(usuario?.departamento || '');
  const [cubiculo, setCubiculo] = useState(usuario?.cubículo || '');
  const [matricula, setMatricula] = useState(usuario?.matricula || '');
  const [carrera, setCarrera] = useState(usuario?.carrera || '');
  const [semestre, setSemestre] = useState<number>(usuario?.semestre || 1);
  const [passwordNueva, setPasswordNueva] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Estadísticas de Persistencia Real (IndexedDB / LocalStorage)
  const [statsPersistencia, setStatsPersistencia] = useState<EstadisticasPersistencia | null>(null);
  const [mensajeDb, setMensajeDb] = useState<string | null>(null);

  // Modal de confirmación para gestión de BD
  const [modalConfirmDb, setModalConfirmDb] = useState<'reset' | 'clear' | null>(null);

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

  // Filtros de la Base de Usuarios (sólo visible para Tutor)
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [filtroRol, setFiltroRol] = useState<'TODOS' | RolUsuario>('TODOS');

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setTelefono(usuario.telefono || '');
      setDepartamento(usuario.departamento || '');
      setCubiculo(usuario.cubículo || '');
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
      departamento: usuario.rol === 'TUTOR' ? departamento : undefined,
      cubículo: usuario.rol === 'TUTOR' ? cubiculo : undefined,
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabecera de Mi Perfil Institucional UAT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarWithFallback
            src={usuario.avatar}
            alt={usuario.nombre}
            className="w-16 h-16 rounded-2xl ring-2 ring-[#EE7402]/40 shadow-xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#EE7402] dark:text-[#EE7402]">
                {usuario.rol === 'TUTOR' ? 'Docente Tutor Institucional' : 'Alumno Tutorado'}
              </span>
              <span>&middot;</span>
              <span className="font-mono">{usuario.id}</span>
            </div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mt-0.5">
              {usuario.nombre}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {usuario.email} &middot;{' '}
              {usuario.rol === 'TUTOR'
                ? `${usuario.departamento} (${usuario.cubículo})`
                : `${usuario.carrera} (${usuario.matricula})`}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión Segura</span>
        </button>
      </div>

      {/* Cuadrícula principal: Edición de Perfil (Izquierda) + Seguridad de la Cuenta (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario de Edición de Perfil */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Información de Mi Perfil Institucional
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actualiza tus datos de contacto institucional y credenciales de acceso
              </p>
            </div>
          </div>

          {mensajeExito && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {mensajeError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{mensajeError}</span>
            </div>
          )}

          <form onSubmit={handleGuardarPerfil} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico Institucional (Sólo lectura)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    disabled
                    value={usuario.email}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+52 834 000 0000"
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
                    placeholder="Dejar en blanco para conservar"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                  />
                </div>
              </div>
            </div>

            {/* Campos del Tutor */}
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Campos del Alumno */}
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 focus:border-[#EE7402]"
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
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                      <option key={s} value={s}>
                        {s}° Semestre
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2.5 rounded-xl bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white font-heading font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{guardando ? 'Guardando...' : 'Guardar Cambios de Perfil'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Panel Derecho: Credencial Digital UAT + Seguridad de la Cuenta */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tarjeta de Credencial Institucional UAT */}
          <div
            style={{ backgroundColor: '#002B49' }}
            className="rounded-2xl p-5 text-white border border-[#003D66] shadow-sm relative overflow-hidden"
          >
            {/* Resplandor decorativo naranja UAT */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#EE7402]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-4 pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="shrink-0 p-1 rounded-full bg-white/10 border border-white/15">
                  <UatHeraldicSeal size={38} textColor="light" showMotto={false} />
                </div>
                <div>
                  <span className="font-heading font-extrabold text-xs tracking-wider text-[#EE7402] block uppercase">
                    Universidad Autónoma de Tamaulipas
                  </span>
                  <span className="text-[10px] text-slate-300 block">
                    Sistema Institucional de Tutorías
                  </span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EE7402] text-white">
                {usuario.rol}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <AvatarWithFallback
                src={usuario.avatar}
                alt={usuario.nombre}
                className="w-12 h-12 rounded-xl ring-2 ring-[#EE7402] shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-sm text-white truncate">
                  {usuario.nombre}
                </h3>
                <p className="text-[11px] text-slate-300 truncate">
                  {usuario.rol === 'TUTOR' ? usuario.departamento : usuario.carrera}
                </p>
                <p className="text-[10px] font-mono text-[#EE7402] mt-0.5">
                  {usuario.rol === 'TUTOR' ? `Cubículo: ${usuario.cubículo}` : `Matrícula: ${usuario.matricula}`}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-serif italic">
              <span>&ldquo;Verdad, Belleza, Probidad&rdquo;</span>
              <span className="font-sans not-italic text-slate-400">Ciclo 2026-1</span>
            </div>
          </div>

          {/* Panel de Seguridad y Estado de la Cuenta Institucional (Limpio, formal y sin exposición de tokens) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Seguridad de la Cuenta
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Acreditación oficial y estado de sesión
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Sesión Cifrada</span>
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Rol Institucional:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {usuario.rol === 'TUTOR' ? 'Docente Tutor Acreditado' : 'Alumno Tutorado Matriculado'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Protocolo de Acceso:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Autenticación en Segundo Plano (UAT)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Canal de Comunicación:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Cifrado de Extremo a Extremo</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Vigencia de la Sesión:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {expDate}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-semibold">Política de Privacidad y Manejo Seguro:</p>
              <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                Tus credenciales de autenticación institucional son administradas de forma confidencial en segundo plano. Nunca compartas tu contraseña con terceros.
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Directorio de Usuarios Registrados: Sólo visible para el rol Docente / Tutor para pruebas y administración */}
      {usuario.rol === 'TUTOR' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Base de Cuentas Institucionales UAT ({usuariosRegistrados.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Panel docente para verificación de cuentas institucionales y simulación de acompañamiento
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
                  placeholder="Buscar por nombre o correo..."
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
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {usuariosFiltrados.map((u) => {
                  const esActual = u.id === usuario.id;
                  const profileId = u.rol === 'TUTOR' ? u.tutorProfileId : u.estudianteProfileId;
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
                              ? 'text-[#EE7402] dark:text-[#EE7402]'
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

      {/* Panel de Persistencia de Datos y Respaldo Institucional (Sólo para Tutor / Administrador) */}
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
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Usuarios Registrados</span>
              <span className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                {statsPersistencia?.totalUsuarios ?? usuariosRegistrados.length}
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
              <span className="font-heading font-bold text-lg text-purple-600 dark:text-purple-400">
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
