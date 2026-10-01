import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PASSWORD_DEMO_DEFAULT } from '../services/authService';
import { RolUsuario } from '../types/tutoria';
import { AvatarWithFallback } from './AvatarWithFallback';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ShieldCheck,
  UserCheck,
  Building2,
  MapPin,
  Hash,
  BookOpen,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
  KeyRound
} from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess?: (rol: RolUsuario) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const { login, registrar, usuariosRegistrados } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [modo, setModo] = useState<'LOGIN' | 'REGISTRO'>('LOGIN');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  // Estado formulario Login
  const [loginEmail, setLoginEmail] = useState('roberto.mendoza@universidad.edu.mx');
  const [loginPassword, setLoginPassword] = useState(PASSWORD_DEMO_DEFAULT);
  const [recordarme, setRecordarme] = useState(true);

  // Filtro del panel de cuentas demo
  const [filtroDemoRol, setFiltroDemoRol] = useState<RolUsuario>('TUTOR');

  // Estado formulario Registro
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmarPassword, setRegConfirmarPassword] = useState('');
  const [regRol, setRegRol] = useState<RolUsuario>('TUTORADO');
  const [regTelefono, setRegTelefono] = useState('');
  // Campos extra Tutor
  const [regDepartamento, setRegDepartamento] = useState('Ingeniería en Sistemas Computacionales');
  const [regCubiculo, setRegCubiculo] = useState('Edificio B, Cubículo 210');
  // Campos extra Tutorado
  const [regMatricula, setRegMatricula] = useState('');
  const [regCarrera, setRegCarrera] = useState('Ingeniería en Sistemas Computacionales');
  const [regSemestre, setRegSemestre] = useState<number>(3);

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setExitoMsg(null);
    setCargando(true);

    const res = await login({
      email: loginEmail,
      password: loginPassword,
      recordarme
    });

    setCargando(false);
    if (!res.success || !res.data) {
      setErrorMsg(res.message);
      return;
    }

    setExitoMsg(res.message);
    onLoginSuccess?.(res.data.usuario.rol);
  };

  const handleSubmitRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setExitoMsg(null);
    setCargando(true);

    const res = await registrar({
      nombre: regNombre,
      email: regEmail,
      password: regPassword,
      confirmarPassword: regConfirmarPassword,
      rol: regRol,
      telefono: regTelefono,
      departamento: regRol === 'TUTOR' ? regDepartamento : undefined,
      cubículo: regRol === 'TUTOR' ? regCubiculo : undefined,
      matricula: regRol === 'TUTORADO' ? regMatricula : undefined,
      carrera: regRol === 'TUTORADO' ? regCarrera : undefined,
      semestre: regRol === 'TUTORADO' ? regSemestre : undefined
    });

    setCargando(false);
    if (!res.success || !res.data) {
      setErrorMsg(res.message);
      return;
    }

    setExitoMsg(res.message);
    onLoginSuccess?.(res.data.usuario.rol);
  };

  const handleAccesoRapidoDemo = async (email: string) => {
    setErrorMsg(null);
    setLoginEmail(email);
    setLoginPassword(PASSWORD_DEMO_DEFAULT);
    setModo('LOGIN');
    const res = await login({
      email,
      password: PASSWORD_DEMO_DEFAULT,
      recordarme: true
    });
    if (res.success && res.data) {
      onLoginSuccess?.(res.data.usuario.rol);
    }
  };

  const cuentasFiltradas = usuariosRegistrados.filter((u) => u.rol === filtroDemoRol);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Barra superior institucional */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#20B2AA] text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-lg text-slate-900 dark:text-white tracking-tight">
              Tutoría<span className="text-[#20B2AA]">Pro</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400">
              Sistema Institucional de Tutorías &middot; Ciclo 2026-1
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor principal en 2 columnas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
          {/* Columna Izquierda: Formulario de Login / Registro */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8">
            {/* Selector de pestaña: Iniciar Sesión vs Crear Cuenta */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setModo('LOGIN');
                  setErrorMsg(null);
                  setExitoMsg(null);
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  modo === 'LOGIN'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4 text-[#20B2AA]" />
                <span>Iniciar Sesión</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModo('REGISTRO');
                  setErrorMsg(null);
                  setExitoMsg(null);
                }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  modo === 'REGISTRO'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4 text-[#20B2AA]" />
                <span>Registro de Usuarios</span>
              </button>
            </div>

            {/* Encabezado contextual */}
            <div className="mb-6">
              <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                {modo === 'LOGIN'
                  ? 'Acceso al Portal Institucional'
                  : 'Registro en la Base de Usuarios'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {modo === 'LOGIN'
                  ? 'Ingresa tus credenciales para generar tu sesión JWT y redirigirte automáticamente según tu rol.'
                  : 'Crea una cuenta nueva seleccionando tu rol institucional (Tutor Académico o Alumno Tutorado).'}
              </p>
            </div>

            {/* Mensajes de Error o Éxito */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {exitoMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{exitoMsg}</span>
              </div>
            )}

            {/* ===================================================== */}
            {/* FORMULARIO 1: LOGIN                                   */}
            {/* ===================================================== */}
            {modo === 'LOGIN' ? (
              <form onSubmit={handleSubmitLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Correo Electrónico Institucional
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="ejemplo@universidad.edu.mx"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20B2AA]/40 focus:border-[#20B2AA]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20B2AA]/40 focus:border-[#20B2AA]"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((p) => !p)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordarme}
                      onChange={(e) => setRecordarme(e.target.checked)}
                      className="rounded border-slate-300 text-[#20B2AA] focus:ring-[#20B2AA]"
                    />
                    <span>Mantener sesión JWT activa (24h)</span>
                  </label>

                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Clave demo: <strong className="text-slate-700 dark:text-slate-200">{PASSWORD_DEMO_DEFAULT}</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#20B2AA] hover:bg-[#1CA099] active:bg-[#178B85] text-white font-heading font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{cargando ? 'Verificando credenciales...' : 'Iniciar Sesión'}</span>
                </button>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>¿Aún no tienes cuenta en el sistema?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setModo('REGISTRO');
                      setErrorMsg(null);
                    }}
                    className="font-semibold text-[#20B2AA] hover:underline cursor-pointer"
                  >
                    Registrar nuevo usuario &rarr;
                  </button>
                </div>
              </form>
            ) : (
              /* ===================================================== */
              /* FORMULARIO 2: REGISTRO DE USUARIOS (TUTOR / TUTORADO) */
              /* ===================================================== */
              <form onSubmit={handleSubmitRegistro} className="space-y-4">
                {/* Selector de Rol Obligatorio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rol de Usuario en el Sistema *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegRol('TUTORADO')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        regRol === 'TUTORADO'
                          ? 'bg-[#20B2AA]/10 border-[#20B2AA] text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          regRol === 'TUTORADO'
                            ? 'bg-[#20B2AA] text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-semibold text-xs block">
                          Tutorado (Alumno)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          Portal estudiantil y citas
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRol('TUTOR')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        regRol === 'TUTOR'
                          ? 'bg-[#20B2AA]/10 border-[#20B2AA] text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          regRol === 'TUTOR'
                            ? 'bg-[#20B2AA] text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-semibold text-xs block">
                          Tutor Académico
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          Gestión de tutorados
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Datos básicos obligatorios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      placeholder={
                        regRol === 'TUTOR'
                          ? 'Ej. Dra. Elena Ramírez Soto'
                          : 'Ej. Oscar Javier Vargas'
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20B2AA]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder={
                        regRol === 'TUTOR'
                          ? 'nombre@universidad.edu.mx'
                          : 'nombre@alumno.universidad.edu.mx'
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20B2AA]/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contraseña (mín. 6 caracteres) *
                    </label>
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20B2AA]/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regConfirmarPassword}
                      onChange={(e) => setRegConfirmarPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20B2AA]/40"
                    />
                  </div>
                </div>

                {/* Campos específicos según el rol seleccionado */}
                {regRol === 'TUTOR' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Departamento Académico
                      </label>
                      <div className="relative">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={regDepartamento}
                          onChange={(e) => setRegDepartamento(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cubículo de Atención
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={regCubiculo}
                          onChange={(e) => setRegCubiculo(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Matrícula Escolar
                      </label>
                      <div className="relative">
                        <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={regMatricula}
                          onChange={(e) => setRegMatricula(e.target.value)}
                          placeholder="2026-ISC-120"
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
                        <select
                          value={regCarrera}
                          onChange={(e) => setRegCarrera(e.target.value)}
                          className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="Ingeniería en Sistemas Computacionales">Ing. en Sistemas</option>
                          <option value="Ingeniería Industrial">Ing. Industrial</option>
                          <option value="Licenciatura en Administración">Lic. en Administración</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Semestre
                      </label>
                      <select
                        value={regSemestre}
                        onChange={(e) => setRegSemestre(Number(e.target.value))}
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono de Contacto (Opcional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      type="tel"
                      value={regTelefono}
                      onChange={(e) => setRegTelefono(e.target.value)}
                      placeholder="+52 834 123 4567"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#20B2AA] hover:bg-[#1CA099] active:bg-[#178B85] text-white font-heading font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {cargando
                      ? 'Registrando usuario...'
                      : `Crear Cuenta como ${regRol === 'TUTOR' ? 'Tutor' : 'Tutorado'}`}
                  </span>
                </button>
              </form>
            )}
          </div>

          {/* Columna Derecha: Panel de Cuentas Registradas y Acceso Rápido por Rol */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#20B2AA]/15 text-[#20B2AA] flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      Base de Usuarios ({usuariosRegistrados.length})
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Selecciona cualquier cuenta para probar Login y Redirección por Rol
                    </p>
                  </div>
                </div>
              </div>

              {/* Filtro de cuentas demo por rol */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
                <button
                  type="button"
                  onClick={() => setFiltroDemoRol('TUTOR')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filtroDemoRol === 'TUTOR'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Tutores ({usuariosRegistrados.filter((u) => u.rol === 'TUTOR').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroDemoRol('TUTORADO')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    filtroDemoRol === 'TUTORADO'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Tutorados ({usuariosRegistrados.filter((u) => u.rol === 'TUTORADO').length})
                </button>
              </div>

              {/* Lista de usuarios registrados */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {cuentasFiltradas.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 hover:border-[#20B2AA]/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarWithFallback
                        src={u.avatar}
                        alt={u.nombre}
                        className="w-8 h-8 rounded-full shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-heading font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {u.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setModo('LOGIN');
                          setLoginEmail(u.email);
                          setLoginPassword(PASSWORD_DEMO_DEFAULT);
                          setErrorMsg(null);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                      >
                        Llenar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAccesoRapidoDemo(u.email)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#20B2AA] hover:bg-[#1CA099] text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <span>Entrar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Arquitectura de Seguridad (Desarrollador 1) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-heading font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#20B2AA]" />
                <span>Módulo Desarrollador 1 &middot; Seguridad Activa</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                <p>
                  &bull; <strong>Modelo de Usuario:</strong> Soporta roles <code className="font-mono text-slate-800 dark:text-slate-200">TUTOR</code> y <code className="font-mono text-slate-800 dark:text-slate-200">TUTORADO</code> sincronizados con el catálogo escolar.
                </p>
                <p>
                  &bull; <strong>Sesión y Token JWT:</strong> Emisión de token firmado (<code className="font-mono text-slate-800 dark:text-slate-200">HS256</code>) con expiración y validación en cada ruta.
                </p>
                <p>
                  &bull; <strong>Protección de Rutas:</strong> Middleware que bloquea accesos no autenticados (401) o de rol distinto (403) y redirige según el rol tras iniciar sesión.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Tutoría Pro &middot; Módulo de Autenticación, Roles y Base de Usuarios
      </footer>
    </div>
  );
};
