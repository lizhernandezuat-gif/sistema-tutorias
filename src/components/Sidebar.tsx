import React from 'react';
import { Tutor, EstudianteCatalogo, RolSimulado } from '../types/tutoria';
import { AvatarWithFallback } from './AvatarWithFallback';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ChevronDown,
  NotebookPen,
  UserCircle,
  LogOut
} from 'lucide-react';

export type SeccionNavegacion = 'dashboard' | 'tutorados' | 'calendario' | 'notas' | 'perfil';

interface SidebarProps {
  rolActivo: RolSimulado;
  onCambiarRol: (rol: RolSimulado) => void;
  tutorActivo: Tutor;
  estudianteActivo: EstudianteCatalogo;
  onCambiarTutor: (tutor: Tutor) => void;
  onCambiarEstudiante: (estudiante: EstudianteCatalogo) => void;
  catalogoTutores: Tutor[];
  catalogoEstudiantes: EstudianteCatalogo[];
  seccionActiva: SeccionNavegacion;
  onCambiarSeccion: (seccion: SeccionNavegacion) => void;
  conteoTutorados: number;
  colapsado: boolean;
  onToggleColapsar: () => void;
  onCerrarSesion?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  rolActivo,
  onCambiarRol,
  tutorActivo,
  estudianteActivo,
  onCambiarTutor,
  onCambiarEstudiante,
  catalogoTutores,
  catalogoEstudiantes,
  seccionActiva,
  onCambiarSeccion,
  conteoTutorados,
  colapsado,
  onToggleColapsar,
  onCerrarSesion
}) => {
  const usuarioActual = rolActivo === 'TUTOR' ? tutorActivo : estudianteActivo;

  const itemsNavegacion = rolActivo === 'TUTOR'
    ? [
        {
          id: 'dashboard' as const,
          label: 'Inicio / Dashboard',
          icon: LayoutDashboard,
          badge: undefined,
          shortLabel: 'Inicio'
        },
        {
          id: 'tutorados' as const,
          label: 'Tutorados / Alumnos',
          icon: Users,
          badge: `${conteoTutorados}`,
          shortLabel: 'Alumnos'
        },
        {
          id: 'calendario' as const,
          label: 'Calendario y Sesiones',
          icon: Calendar,
          badge: undefined,
          shortLabel: 'Agenda'
        },
        {
          id: 'perfil' as const,
          label: 'Mi Perfil y Usuarios',
          icon: UserCircle,
          badge: undefined,
          shortLabel: 'Mi Perfil'
        }
      ]
    : [
        {
          id: 'dashboard' as const,
          label: 'Inicio / Dashboard',
          icon: LayoutDashboard,
          badge: undefined,
          shortLabel: 'Inicio'
        },
        {
          id: 'tutorados' as const,
          label: 'Mi Tutoría',
          icon: Users,
          badge: undefined,
          shortLabel: 'Mi Tutoría'
        },
        {
          id: 'calendario' as const,
          label: 'Calendario y Sesiones',
          icon: Calendar,
          badge: undefined,
          shortLabel: 'Agenda'
        },
        {
          id: 'notas' as const,
          label: 'Mis Notas Personales',
          icon: NotebookPen,
          badge: undefined,
          shortLabel: 'Notas'
        },
        {
          id: 'perfil' as const,
          label: 'Mi Perfil y Cuenta',
          icon: UserCircle,
          badge: undefined,
          shortLabel: 'Mi Perfil'
        }
      ];

  return (
    <>
      {/* ======================================================== */}
      {/* 1. SIDEBAR IZQUIERDO DESKTOP / TABLET (Fondo #1E293B)    */}
      {/* ======================================================== */}
      <aside
        style={{ backgroundColor: '#1E293B' }}
        className={`hidden md:flex fixed top-0 bottom-0 left-0 z-40 text-white border-r border-slate-700/80 flex-col justify-between transition-all duration-300 ease-in-out ${
          colapsado ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Cabecera del Sidebar con Marca "Tutoría Pro" */}
          <div className="p-4 border-b border-slate-700/70 flex items-center justify-between min-h-[68px]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[12px] bg-[#20B2AA] text-white flex items-center justify-center shadow-md shadow-[#20B2AA]/20 ring-2 ring-[#20B2AA]/30 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>

              {!colapsado && (
                <div className="min-w-0 animate-in fade-in duration-200">
                  <span className="font-heading font-semibold text-lg text-white tracking-tight block truncate">
                    Tutoría<span className="text-[#20B2AA]">Pro</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Gestión Escolar
                  </span>
                </div>
              )}
            </div>

            {/* Botón para colapsar en Desktop */}
            <button
              onClick={onToggleColapsar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
              title={colapsado ? 'Expandir menú' : 'Contraer menú'}
            >
              {colapsado ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-3 space-y-1.5">
            {!colapsado && (
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Menú de Navegación
              </div>
            )}

            {itemsNavegacion.map((item) => {
              const Icon = item.icon;
              const isActive = seccionActiva === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onCambiarSeccion(item.id)}
                  className={`w-full flex items-center rounded-[12px] text-xs font-medium transition-all cursor-pointer ${
                    colapsado ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#20B2AA] text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title={colapsado ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!colapsado && <span className="truncate">{item.label}</span>}
                  </div>

                  {!colapsado && item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isActive
                          ? 'bg-white text-slate-900'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {colapsado && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white absolute right-2" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pie del Sidebar: Selector de Rol y Perfil */}
        <div className="p-3 border-t border-slate-700/70 bg-slate-900/40 space-y-2.5">
          {/* Alternador de Rol en Sidebar */}
          {!colapsado && (
            <div className="p-1 bg-slate-900/80 rounded-xl border border-slate-700 flex items-center gap-1">
              <button
                onClick={() => onCambiarRol('TUTOR')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  rolActivo === 'TUTOR'
                    ? 'bg-[#20B2AA] text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                <span>Tutor</span>
              </button>
              <button
                onClick={() => onCambiarRol('ALUMNO')}
                className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  rolActivo === 'ALUMNO'
                    ? 'bg-[#20B2AA] text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Alumno</span>
              </button>
            </div>
          )}

          {/* Tarjeta de Usuario */}
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 ${
              colapsado ? 'justify-center' : ''
            }`}
          >
            <AvatarWithFallback
              src={usuarioActual.avatar}
              alt={usuarioActual.nombre}
              className="w-9 h-9 rounded-xl ring-1 ring-slate-600 shrink-0"
            />
            {!colapsado && (
              <div className="min-w-0 flex-1">
                <span className="font-heading font-semibold text-xs text-white block truncate">
                  {usuarioActual.nombre}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {rolActivo === 'TUTOR'
                    ? (usuarioActual as Tutor).departamento
                    : (usuarioActual as EstudianteCatalogo).carrera}
                </span>
              </div>
            )}
          </div>

          {/* Selector de cuenta para pruebas */}
          {!colapsado && (
            <div className="relative">
              <select
                value={usuarioActual.id}
                onChange={(e) => {
                  if (rolActivo === 'TUTOR') {
                    const sel = catalogoTutores.find(t => t.id === e.target.value);
                    if (sel) onCambiarTutor(sel);
                  } else {
                    const sel = catalogoEstudiantes.find(es => es.id === e.target.value);
                    if (sel) onCambiarEstudiante(sel);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 text-[11px] rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-[#20B2AA] appearance-none cursor-pointer pr-7 truncate"
              >
                {rolActivo === 'TUTOR'
                  ? catalogoTutores.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                        {t.nombre.split(' ')[0]} {t.nombre.split(' ')[1]} (Tutor)
                      </option>
                    ))
                  : catalogoEstudiantes.map(es => (
                      <option key={es.id} value={es.id} className="bg-slate-900 text-white">
                        {es.nombre.split(' ')[0]} {es.nombre.split(' ')[1]} (Alumno)
                      </option>
                    ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-2.5" />
            </div>
          )}

          {/* Botón de Cerrar Sesión (Logout) */}
          {onCerrarSesion && (
            <button
              onClick={onCerrarSesion}
              className={`w-full flex items-center gap-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/80 transition-colors cursor-pointer ${
                colapsado ? 'justify-center p-2.5' : 'justify-center px-3 py-2 bg-rose-950/40 border border-rose-800/50'
              }`}
              title="Cerrar sesión activa"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              {!colapsado && <span>Cerrar Sesión</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. BARRA DE NAVEGACIÓN INFERIOR MÓVIL (BOTTOM TAB BAR)   */}
      {/* ======================================================== */}
      <div
        style={{ backgroundColor: '#1E293B' }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 text-white border-t border-slate-700 flex items-center justify-around py-2 px-2 shadow-2xl"
      >
        {itemsNavegacion.map((item) => {
          const Icon = item.icon;
          const isActive = seccionActiva === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onCambiarSeccion(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-[#20B2AA]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#20B2AA]' : 'text-slate-400'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#FF7F50] text-white text-[9px] font-bold rounded-full flex items-center justify-center font-mono">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-white font-semibold' : 'text-slate-400'}`}>
                {item.shortLabel}
              </span>
            </button>
          );
        })}

        {/* Botón rápido de rol en móvil */}
        <button
          onClick={() => onCambiarRol(rolActivo === 'TUTOR' ? 'ALUMNO' : 'TUTOR')}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
          title={`Cambiar a vista ${rolActivo === 'TUTOR' ? 'Alumno' : 'Tutor'}`}
        >
          <GraduationCap className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] mt-0.5 text-slate-400">
            {rolActivo === 'TUTOR' ? 'Soy Tutor' : 'Soy Alumno'}
          </span>
        </button>
      </div>
    </>
  );
};
