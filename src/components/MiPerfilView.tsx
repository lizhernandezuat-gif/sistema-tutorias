import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RolUsuario } from '../types/tutoria';
import { AvatarWithFallback } from './AvatarWithFallback';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Hash,
  BookOpen,
  ShieldCheck,
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Users,
  Search,
  Lock,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';

interface MiPerfilViewProps {
  onCambioRol?: (nuevoRol: RolUsuario) => void;
}

export const MiPerfilView: React.FC<MiPerfilViewProps> = ({ onCambioRol }) => {
  const { sesion, actualizarPerfil, logout, usuariosRegistrados, cambiarPerfilDemo } = useAuth();
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
  const [copiadoToken, setCopiadoToken] = useState(false);

  // Filtros de la Base de Usuarios
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

  const handleCopiarToken = () => {
    navigator.clipboard?.writeText(sesion.token);
    setCopiadoToken(true);
    setTimeout(() => setCopiadoToken(false), 2000);
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
    dateStyle: 'short',
    timeStyle: 'short'
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabecera de Mi Perfil */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarWithFallback
            src={usuario.avatar}
            alt={usuario.nombre}
            className="w-16 h-16 rounded-2xl ring-2 ring-[#20B2AA]/40 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#0E7470] dark:text-[#20B2AA]">
                {usuario.rol === 'TUTOR' ? 'Rol: Tutor Académico' : 'Rol: Alumno Tutorado'}
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
          <span>Cerrar Sesión (Logout)</span>
        </button>
      </div>

      {/* Cuadrícula principal: Edición de Perfil (Izquierda) + Sesión JWT (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario de Edición de Perfil */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-[#20B2AA]/15 text-[#20B2AA] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Información de Mi Perfil
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actualiza tus datos personales, académicos y credenciales de acceso
              </p>
            </div>
          </div>

          {mensajeExito && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {mensajeError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          <form onSubmit={handleGuardarPerfil} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20B2AA]/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Institucional (ID Login)
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
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Contraseña (Opcional)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    placeholder="Dejar en blanco para mantener actual"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {usuario.rol === 'TUTOR' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Departamento Académico
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={departamento}
                      onChange={(e) => setDepartamento(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cubículo Asignado
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={cubiculo}
                      onChange={(e) => setCubiculo(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Matrícula
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Carrera
                  </label>
                  <div className="relative">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={carrera}
                      onChange={(e) => setCarrera(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semestre Actual
                  </label>
                  <select
                    value={semestre}
                    onChange={(e) => setSemestre(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
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
                className="px-5 py-2.5 rounded-xl bg-[#20B2AA] hover:bg-[#1CA099] text-white font-heading font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{guardando ? 'Guardando...' : 'Guardar Cambios de Perfil'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Inspector de Sesión JWT y Protección de Rutas */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Sesión &amp; Token JWT Activo
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Estado del middleware de autenticación
                </p>
              </div>
            </div>

            <button
              onClick={handleCopiarToken}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copiadoToken ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar JWT</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Authorization Header (Bearer Token)
              </span>
              <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] break-all leading-relaxed">
                Bearer {sesion.token}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Payload Decodificado (Claims del Usuario)
              </span>
              <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto tabular-nums">
                {JSON.stringify(sesion.payload, null, 2)}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Rol Autorizado
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {sesion.payload.rol}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Expira el
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                  {expDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directorio de la Base de Usuarios (Desarrollador 1) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#20B2AA]/15 text-[#20B2AA] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Base de Usuarios Registrados ({usuariosRegistrados.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usuarios con credenciales activas y rol asignado (Tutor / Tutorado)
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
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20B2AA]/40"
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
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {r === 'TODOS' ? 'Todos' : r === 'TUTOR' ? 'Tutores' : 'Tutorados'}
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
                <th className="py-2.5 px-3">Correo Electrónico</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">Adscripción / Matrícula</th>
                <th className="py-2.5 px-3 text-right">Acción de Sesión</th>
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
                        ? 'bg-[#20B2AA]/5 dark:bg-[#20B2AA]/10'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <AvatarWithFallback
                          src={u.avatar}
                          alt={u.nombre}
                          className="w-7 h-7 rounded-full shrink-0"
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
                            ? 'text-teal-700 dark:text-teal-400'
                            : 'text-sky-700 dark:text-sky-400'
                        }`}
                      >
                        {u.rol === 'TUTOR' ? 'Tutor Académico' : 'Tutorado'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      {u.rol === 'TUTOR'
                        ? u.departamento
                        : `${u.matricula || 'Sin matrícula'} · ${u.carrera || ''}`}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {esActual ? (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Sesión Activa
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (profileId) {
                              cambiarPerfilDemo(profileId, u.rol);
                              onCambioRol?.(u.rol);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#20B2AA] hover:text-white text-slate-700 dark:text-slate-200 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <span>Cambiar a esta cuenta</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
