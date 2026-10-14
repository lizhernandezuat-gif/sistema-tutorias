import React, { useState } from 'react';
import { UatCircularLogo } from './UatLogo';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Eye,
  EyeOff,
  User,
  LogIn,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound
} from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess?: (rol: 'tutor' | 'alumno') => void;
  onLoginDirecto?: (rol: 'tutor' | 'alumno') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const { login, registrar } = useAuth();

  // Estados de inputs del login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados visuales del formulario
  const [modo, setModo] = useState<'LOGIN' | 'REGISTRO'>('LOGIN');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  // Checkbox de términos y condiciones
  const [aceptaTerminos, setAceptaTerminos] = useState(true);

  // Modal de recuperación de contraseña
  const [modalRecuperarAbierto, setModalRecuperarAbierto] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [recuperacionEnviada, setRecuperacionEnviada] = useState(false);

  // Formulario Registro adicional
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmarPassword, setRegConfirmarPassword] = useState('');
  const [regRol, setRegRol] = useState<'tutor' | 'alumno'>('alumno');
  const [regDepartamento, setRegDepartamento] = useState('Facultad de Ingeniería y Ciencias');
  const [regMatricula, setRegMatricula] = useState('');

  // Manejo de Inicio de Sesión Real
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg(null);
    setExitoMsg(null);

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!email || !password) {
      setErrorMsg('Debes ingresar tu correo institucional y tu contraseña.');
      return;
    }

    if (!aceptaTerminos) {
      setErrorMsg('Debe aceptar los términos y condiciones de privacidad para ingresar.');
      return;
    }

    setCargando(true);
    try {
      const res = await login({ email, password });
      if (res.success && res.data) {
        const rol = res.data.usuario.rol === 'TUTOR' ? 'tutor' : 'alumno';
        setExitoMsg(`Bienvenido(a), ${res.data.usuario.nombre}. Accediendo al sistema...`);
        setTimeout(() => {
          onLoginSuccess?.(rol);
        }, 150);
      } else {
        setErrorMsg(res.message || 'Correo o contraseña incorrectos. Verifica tus credenciales e inténtalo de nuevo.');
      }
    } catch {
      setErrorMsg('Ocurrió un error al intentar iniciar sesión. Por favor reintente.');
    } finally {
      setCargando(false);
    }
  };

  // Manejo de Registro Real
  const handleSubmitRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setExitoMsg(null);

    if (!regNombre.trim()) {
      setErrorMsg('Ingresa tu nombre completo.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Ingresa tu correo electrónico institucional.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (regPassword !== regConfirmarPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const res = await registrar({
        nombre: regNombre.trim(),
        email: regEmail.trim(),
        password: regPassword,
        confirmarPassword: regConfirmarPassword,
        rol: regRol === 'tutor' ? 'TUTOR' : 'TUTORADO',
        matricula: regRol === 'alumno' ? regMatricula.trim() : undefined,
        departamento: regRol === 'tutor' ? regDepartamento.trim() : undefined
      });

      if (res.success && res.data) {
        setExitoMsg('Cuenta registrada exitosamente. Accediendo al sistema...');
        setTimeout(() => {
          onLoginSuccess?.(regRol);
        }, 200);
      } else {
        setErrorMsg(res.message || 'No fue posible completar el registro.');
      }
    } catch {
      setErrorMsg('Ocurrió un error inesperado durante el registro.');
    } finally {
      setCargando(false);
    }
  };

  const handleRecuperarPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecuperacion) return;
    setRecuperacionEnviada(true);
  };

  return (
    <div className="relative h-screen w-full overflow-x-hidden overflow-y-auto md:overflow-hidden font-sans flex flex-col md:flex-row">
      {/* 1. FONDO INSTITUCIONAL CON CAMPUS UAT */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1920&auto=format&fit=crop"
          alt="Alumnos de la Universidad Autónoma de Tamaulipas estudiando en el campus"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/40 to-black/60 md:to-black/30" />
      </div>

      {/* 2. COSTADO IZQUIERDO (DESKTOP): IDENTIDAD INSTITUCIONAL */}
      <div className="hidden md:flex flex-1 h-full flex-col justify-between p-8 lg:p-12 xl:p-16 relative z-10 select-none">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 w-fit pointer-events-auto shadow-lg">
          <UatCircularLogo size="sm" border={false} />
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-heading font-black text-sm tracking-wider text-[#EE7402]">
              UAT
            </span>
            <span className="text-white/40 text-xs font-light">|</span>
            <span className="font-heading font-bold text-xs tracking-tight text-white">
              Tutorías
            </span>
          </div>
        </div>

        <div className="max-w-xl">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-black/45 text-amber-300 border border-amber-400/35 backdrop-blur-md inline-block mb-4 shadow-sm">
            Universidad Autónoma de Tamaulipas
          </span>
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-heading font-extrabold text-white tracking-tight drop-shadow-lg leading-tight">
            Acompañamiento, Excelencia y Formación Integral
          </h1>
          <p className="text-sm lg:text-base text-slate-200 mt-3.5 drop-shadow leading-relaxed max-w-lg">
            Plataforma oficial de tutorías docentes y seguimiento académico para la comunidad universitaria de la UAT.
          </p>
        </div>

        <div className="text-xs text-white/90 font-serif italic tracking-wider drop-shadow flex items-center gap-2">
          <span className="font-semibold">&ldquo;Verdad, Belleza, Probidad&rdquo;</span>
          <span className="text-white/40">&bull;</span>
          <span className="font-sans not-italic text-white/75">Dirección de Acompañamiento y Tutorías UAT</span>
        </div>
      </div>

      {/* 3. PANEL DERECHO DE LOGIN / REGISTRO */}
      <div className="relative z-20 w-full md:w-[440px] lg:w-[480px] xl:w-[520px] md:h-screen shrink-0 flex items-center justify-center p-4 sm:p-6 md:p-0">
        <div
          style={{
            backgroundColor: 'rgba(238, 116, 2, 0.88)'
          }}
          className="w-full max-w-md md:max-w-none md:h-full backdrop-blur-xl md:backdrop-blur-2xl shadow-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-white rounded-3xl md:rounded-none border border-white/30 md:border-l md:border-y-0 md:border-r-0 md:border-white/20 overflow-y-auto"
        >
          <div>
            {/* Escudo Circular Oficial UAT */}
            <div className="flex flex-col items-center text-center pt-2 pb-3">
              <div className="mb-3 relative group">
                <div className="absolute -inset-1.5 rounded-full bg-white/20 blur-sm pointer-events-none" />
                <UatCircularLogo
                  size={104}
                  className="relative z-10 shadow-xl ring-4 ring-white/30 border-2 border-white/60"
                  alt="Escudo Oficial Circular de la Universidad Autónoma de Tamaulipas"
                />
              </div>

              <div className="mt-1">
                <span className="font-heading font-black text-2xl lg:text-3xl tracking-wide uppercase text-white block drop-shadow-xs">
                  SIIE - Tutorías
                </span>
                <span className="font-sans font-bold text-[10.5px] lg:text-[11.5px] uppercase tracking-[0.18em] text-white/95 block mt-0.5">
                  SISTEMA INTEGRAL INSTITUCIONAL ESCOLAR
                </span>
                <span className="text-xs text-white/90 font-medium block mt-1">
                  Sistema Institucional de Tutorías Académicas
                </span>
              </div>

              <div className="w-16 h-0.5 bg-white/40 my-3 rounded-full" />

              <p className="text-xs text-white/95 font-normal tracking-wide">
                {modo === 'LOGIN'
                  ? 'Inicie sesión mediante su cuenta institucional'
                  : 'Registro de nueva cuenta universitaria'}
              </p>
            </div>

            {/* Mensajes de Alerta Visual */}
            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-950/85 border border-red-400 text-xs text-red-100 flex items-start gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {exitoMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/85 border border-emerald-400 text-xs text-emerald-100 flex items-start gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{exitoMsg}</span>
              </div>
            )}

            {/* FORMULARIO DE ACCESO (LOGIN) */}
            {modo === 'LOGIN' ? (
              <form onSubmit={handleSubmitLogin} className="space-y-4 mt-1" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-white/95 mb-1.5 uppercase tracking-wide">
                    Correo Institucional
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 sm:top-3.5 text-slate-500 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="usuario@uat.edu.mx"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-3 focus:ring-amber-300 shadow-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/95 mb-1.5 uppercase tracking-wide">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 sm:top-3.5 text-slate-500 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-3 focus:ring-amber-300 shadow-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((p) => !p)}
                      className="absolute right-3 top-2.5 sm:top-3 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                      tabIndex={-1}
                      title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox Términos y Condiciones */}
                <div className="pt-0.5">
                  <label className="flex items-start gap-2.5 text-xs text-white/95 cursor-pointer select-none leading-tight">
                    <input
                      type="checkbox"
                      checked={aceptaTerminos}
                      onChange={(e) => setAceptaTerminos(e.target.checked)}
                      className="w-4 h-4 rounded mt-0.5 accent-slate-900 text-[#EE7402] focus:ring-white border-white/50 cursor-pointer"
                    />
                    <span>Acepto los términos y condiciones de privacidad</span>
                  </label>
                </div>

                {/* Botón Principal: INGRESAR */}
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-white text-[#D95B00] hover:bg-slate-100 active:bg-slate-200 font-heading font-extrabold text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4 text-[#D95B00]" />
                  <span>{cargando ? 'Verificando...' : 'Ingresar'}</span>
                </button>

                {/* Enlaces Secundarios */}
                <div className="pt-2 flex flex-col items-center gap-2 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailRecuperacion(loginEmail);
                      setRecuperacionEnviada(false);
                      setModalRecuperarAbierto(true);
                    }}
                    className="text-white hover:text-amber-200 underline font-medium cursor-pointer transition-colors"
                  >
                    ¿Olvidó su contraseña?
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModo('REGISTRO');
                      setErrorMsg(null);
                      setExitoMsg(null);
                    }}
                    className="text-white/90 hover:text-white font-medium cursor-pointer transition-colors mt-0.5"
                  >
                    ¿No tiene cuenta? <span className="underline font-bold text-white">Registrarse aquí</span>
                  </button>
                </div>
              </form>
            ) : (
              /* FORMULARIO DE REGISTRO REAL */
              <form onSubmit={handleSubmitRegistro} className="space-y-3 mt-2 text-slate-900">
                <div className="grid grid-cols-2 gap-2 text-white">
                  <button
                    type="button"
                    onClick={() => setRegRol('alumno')}
                    className={`p-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      regRol === 'alumno'
                        ? 'bg-white text-[#EE7402] border-white'
                        : 'bg-white/20 text-white border-white/40'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Alumno</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRol('tutor')}
                    className={`p-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      regRol === 'tutor'
                        ? 'bg-white text-[#EE7402] border-white'
                        : 'bg-white/20 text-white border-white/40'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Docente</span>
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Nombre Completo"
                  className="w-full px-3 py-2 rounded-lg bg-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />

                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Correo Institucional"
                  className="w-full px-3 py-2 rounded-lg bg-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Contraseña (mín 6 car.)"
                    className="w-full px-3 py-2 rounded-lg bg-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regConfirmarPassword}
                    onChange={(e) => setRegConfirmarPassword(e.target.value)}
                    placeholder="Confirmar"
                    className="w-full px-3 py-2 rounded-lg bg-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>

                {regRol === 'alumno' ? (
                  <input
                    type="text"
                    required
                    value={regMatricula}
                    onChange={(e) => setRegMatricula(e.target.value)}
                    placeholder="Matrícula (Ej. 2026-ISC-010)"
                    className="w-full px-3 py-2 rounded-lg bg-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                ) : (
                  <input
                    type="text"
                    value={regDepartamento}
                    onChange={(e) => setRegDepartamento(e.target.value)}
                    placeholder="Facultad o Departamento"
                    className="w-full px-3 py-2 rounded-lg bg-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-[#D95B00] hover:bg-slate-100 font-heading font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {cargando ? 'Registrando...' : 'Completar Registro'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setModo('LOGIN');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-white underline cursor-pointer"
                  >
                    Volver a Iniciar Sesión
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Pie del Panel Naranja */}
          <div className="pt-6 mt-4 border-t border-white/20 text-center">
            <p className="font-serif italic text-xs tracking-widest text-white font-semibold">
              &ldquo;VERDAD, BELLEZA, PROBIDAD&rdquo;
            </p>
            <p className="text-[11px] text-white/80 mt-0.5">
              Universidad Autónoma de Tamaulipas
            </p>
          </div>
        </div>
      </div>

      {/* MODAL DE RECUPERACIÓN */}
      {modalRecuperarAbierto && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setModalRecuperarAbierto(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Recuperación de Contraseña
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistema Integral Institucional Escolar UAT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalRecuperarAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recuperacionEnviada ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-heading font-bold text-sm text-slate-900">
                  Enlace Enviado
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Se ha enviado un correo con las instrucciones para restablecer tu contraseña a{' '}
                  <strong className="text-slate-900">{emailRecuperacion}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setModalRecuperarAbierto(false)}
                  className="w-full mt-3 py-2.5 px-4 bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecuperarPassword} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ingresa tu dirección de correo institucional registrada para enviarte un enlace de recuperación.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Institucional
                  </label>
                  <input
                    type="email"
                    required
                    value={emailRecuperacion}
                    onChange={(e) => setEmailRecuperacion(e.target.value)}
                    placeholder="usuario@uat.edu.mx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE7402]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalRecuperarAbierto(false)}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Enviar Enlace
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
