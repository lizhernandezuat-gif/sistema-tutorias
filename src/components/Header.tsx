import React, { useState, useRef, useEffect } from 'react';
import { Tutor, EstudianteCatalogo, RolSimulado } from '../types/tutoria';
import { useTheme } from '../context/ThemeContext';
import { AvatarWithFallback } from './AvatarWithFallback';
import { SeccionNavegacion } from './Sidebar';
import {
  Sun,
  Moon,
  ChevronDown,
  GraduationCap,
  UserCheck,
  Mail,
  Check,
  UserCircle,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  rolActivo: RolSimulado;
  onCambiarRol: (rol: RolSimulado) => void;
  tutorActivo: Tutor;
  estudianteActivo: EstudianteCatalogo;
  seccionActiva: SeccionNavegacion;
  onToggleSidebar?: () => void;
  catalogoTutores?: Tutor[];
  catalogoEstudiantes?: EstudianteCatalogo[];
  onCambiarTutor?: (tutor: Tutor) => void;
  onCambiarEstudiante?: (estudiante: EstudianteCatalogo) => void;
  onIrPerfil?: () => void;
  onCerrarSesion?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  rolActivo,
  onCambiarRol,
  tutorActivo,
  estudianteActivo,
  seccionActiva,
  catalogoTutores = [],
  catalogoEstudiantes = [],
  onCambiarTutor,
  onCambiarEstudiante,
  onIrPerfil,
  onCerrarSesion
}) => {
  const { theme, toggleTheme } = useTheme();
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const usuarioActual = rolActivo === 'TUTOR' ? tutorActivo : estudianteActivo;

  // Cerrar el menú desplegable si se hace click fuera
  useEffect(() => {
    const handleClickAfuera = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuPerfilAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const getSeccionTitulo = () => {
    switch (seccionActiva) {
      case 'tutorados':
        return rolActivo === 'TUTOR' ? 'Tutorados / Alumnos' : 'Mi Tutoría Asignada';
      case 'calendario':
        return 'Calendario y Sesiones';
      case 'notas':
        return 'Mis Notas Personales';
      case 'perfil':
        return 'Mi Perfil y Base de Usuarios';
      case 'dashboard':
      default:
        return 'Inicio / Dashboard';
    }
  };

  const getSeccionDescripcion = () => {
    switch (seccionActiva) {
      case 'tutorados':
        return rolActivo === 'TUTOR'
          ? 'Directorio de alumnos con filtros por semestre y estado escolar'
          : 'Información institucional de tu acompañamiento y bitácora escolar';
      case 'calendario':
        return 'Agenda institucional de sesiones presenciales y virtuales';
      case 'notas':
        return 'Espacio privado para gestionar tus apuntes, dudas y recordatorios';
      case 'perfil':
        return 'Gestión de perfil personal, token de sesión JWT y directorio de usuarios registrados';
      case 'dashboard':
      default:
        return rolActivo === 'TUTOR'
          ? 'Resumen general de rendimiento, alertas y seguimiento de tutorados'
          : 'Panel del estudiante para consulta de asesorías y comunicación con el tutor';
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Lado Izquierdo: Título de la Sección Activa */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-tight">
                {getSeccionTitulo()}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                {getSeccionDescripcion()}
              </p>
            </div>
          </div>

          {/* Lado Derecho: Modo Claro/Oscuro + Perfil Minimalista Elegante */}
          <div className="flex items-center gap-3">
            {/* Alternador de Modo Claro / Modo Oscuro */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label="Alternar tema claro y oscuro"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Perfil del Usuario Autenticado Elegante */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuPerfilAbierto(prev => !prev)}
                className="flex items-center gap-2.5 p-1.5 pl-2 sm:pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:outline-none"
                aria-expanded={menuPerfilAbierto}
                aria-haspopup="true"
              >
                <AvatarWithFallback
                  src={usuarioActual.avatar}
                  alt={usuarioActual.nombre}
                  className="w-8 h-8 rounded-full ring-2 ring-emerald-500/30 shadow-2xs shrink-0"
                />

                <div className="hidden sm:block text-left min-w-0">
                  <span className="font-heading font-semibold text-xs text-slate-900 dark:text-white block truncate max-w-[140px] leading-tight">
                    {usuarioActual.nombre.split(' ')[0]} {usuarioActual.nombre.split(' ')[1] || ''}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block truncate">
                    {rolActivo === 'TUTOR' ? 'Docente Tutor' : 'Estudiante'}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform hidden sm:block" />
              </button>

              {/* Popover / Menú desplegable elegante del usuario */}
              {menuPerfilAbierto && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Cabecera del usuario */}
                  <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <AvatarWithFallback
                      src={usuarioActual.avatar}
                      alt={usuarioActual.nombre}
                      className="w-10 h-10 rounded-xl ring-2 ring-emerald-500/30 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-bold text-xs text-slate-900 dark:text-white truncate">
                        {usuarioActual.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{usuarioActual.email}</span>
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                        <span>{rolActivo === 'TUTOR' ? 'Sesión JWT: Tutor' : 'Sesión JWT: Tutorado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Cuenta: Mi Perfil y Cerrar Sesión */}
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 space-y-1">
                    {onIrPerfil && (
                      <button
                        onClick={() => {
                          onIrPerfil();
                          setMenuPerfilAbierto(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <UserCircle className="w-4 h-4 text-[#20B2AA]" />
                        <span>Mi Perfil y Base de Usuarios</span>
                      </button>
                    )}

                    {onCerrarSesion && (
                      <button
                        onClick={() => {
                          onCerrarSesion();
                          setMenuPerfilAbierto(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión (Logout)</span>
                      </button>
                    )}
                  </div>

                  {/* Switcher de Rol Elegante */}
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                      Cambiar Rol Activo
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          onCambiarRol('TUTOR');
                          setMenuPerfilAbierto(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          rolActivo === 'TUTOR'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Tutor</span>
                      </button>

                      <button
                        onClick={() => {
                          onCambiarRol('ALUMNO');
                          setMenuPerfilAbierto(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          rolActivo === 'ALUMNO'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Alumno</span>
                      </button>
                    </div>
                  </div>

                  {/* Selección de Cuenta */}
                  <div className="p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                      {rolActivo === 'TUTOR' ? 'Cambiar Docente Tutor' : 'Cambiar Alumno'}
                    </span>
                    <div className="space-y-1 max-h-44 overflow-y-auto">
                      {rolActivo === 'TUTOR'
                        ? catalogoTutores.map((t) => {
                            const esSeleccionado = t.id === tutorActivo.id;
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  onCambiarTutor?.(t);
                                  setMenuPerfilAbierto(false);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                  esSeleccionado
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <AvatarWithFallback
                                    src={t.avatar}
                                    alt={t.nombre}
                                    className="w-6 h-6 rounded-full shrink-0"
                                  />
                                  <span className="truncate">{t.nombre}</span>
                                </div>
                                {esSeleccionado && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              </button>
                            );
                          })
                        : catalogoEstudiantes.map((es) => {
                            const esSeleccionado = es.id === estudianteActivo.id;
                            return (
                              <button
                                key={es.id}
                                onClick={() => {
                                  onCambiarEstudiante?.(es);
                                  setMenuPerfilAbierto(false);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                                  esSeleccionado
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <AvatarWithFallback
                                    src={es.avatar}
                                    alt={es.nombre}
                                    className="w-6 h-6 rounded-full shrink-0"
                                  />
                                  <span className="truncate">{es.nombre}</span>
                                </div>
                                {esSeleccionado && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              </button>
                            );
                          })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
