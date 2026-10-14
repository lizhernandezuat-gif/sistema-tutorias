import React from 'react';
import { Tutor, EstudianteCatalogo, RolSimulado } from '../types/tutoria';
import { AvatarWithFallback } from './AvatarWithFallback';
import { UatLogo, UatHeraldicSeal } from './UatLogo';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  NotebookPen,
  LogOut,
  FolderOpen,
  GraduationCap,
  FileCheck
} from 'lucide-react';

export type SeccionNavegacion = 'dashboard' | 'tutorados' | 'actividades' | 'calendario' | 'archivos' | 'notas' | 'perfil';

interface SidebarProps {
  rolActivo: RolSimulado;
  tutorActivo: Tutor;
  estudianteActivo: EstudianteCatalogo;
  onCambiarTutor?: (tutor: Tutor) => void;
  onCambiarEstudiante?: (estudiante: EstudianteCatalogo) => void;
  catalogoTutores?: Tutor[];
  catalogoEstudiantes?: EstudianteCatalogo[];
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
  tutorActivo,
  estudianteActivo,
  seccionActiva,
  onCambiarSeccion,
  conteoTutorados,
  colapsado,
  onToggleColapsar,
  onCerrarSesion
}) => {
  const usuarioActual = rolActivo === 'TUTOR' ? tutorActivo : estudianteActivo;

  // Menús estrictamente diferenciados por rol institucional (Tutor vs Alumno)
  const itemsNavegacion = rolActivo === 'TUTOR'
    ? [
        {
          id: 'dashboard' as SeccionNavegacion,
          label: 'Panel Principal',
          shortLabel: 'Inicio',
          icon: LayoutDashboard,
          badge: null
        },
        {
          id: 'tutorados' as SeccionNavegacion,
          label: 'Mis Tutorados',
          shortLabel: 'Tutorados',
          icon: Users,
          badge: conteoTutorados > 0 ? conteoTutorados.toString() : null
        },
        {
          id: 'actividades' as SeccionNavegacion,
          label: 'Actividades y Tareas',
          shortLabel: 'Actividades',
          icon: FileCheck,
          badge: null
        },
        {
          id: 'calendario' as SeccionNavegacion,
          label: 'Agenda de Asesorías',
          shortLabel: 'Agenda',
          icon: Calendar,
          badge: null
        },
        {
          id: 'archivos' as SeccionNavegacion,
          label: 'Documentos y Formatos',
          shortLabel: 'Archivos',
          icon: FolderOpen,
          badge: null
        }
      ]
    : [
        {
          id: 'tutorados' as SeccionNavegacion,
          label: 'Mi Tutor Asignado',
          shortLabel: 'Mi Tutor',
          icon: GraduationCap,
          badge: null
        },
        {
          id: 'actividades' as SeccionNavegacion,
          label: 'Mis Actividades',
          shortLabel: 'Actividades',
          icon: FileCheck,
          badge: null
        },
        {
          id: 'calendario' as SeccionNavegacion,
          label: 'Mis Reuniones',
          shortLabel: 'Citas',
          icon: Calendar,
          badge: null
        },
        {
          id: 'notas' as SeccionNavegacion,
          label: 'Mis Notas Personales',
          shortLabel: 'Notas',
          icon: NotebookPen,
          badge: null
        },
        {
          id: 'archivos' as SeccionNavegacion,
          label: 'Mis Evidencias',
          shortLabel: 'Archivos',
          icon: FolderOpen,
          badge: null
        }
      ];

  return (
    <>
      {/* ======================================================== */}
      {/* 1. SIDEBAR DE ESCRITORIO (FIJO A LA IZQUIERDA)           */}
      {/* ======================================================== */}
      <aside
        style={{
          backgroundColor: '#002B49'
        }}
        className={`hidden md:flex flex-col h-screen fixed top-0 bottom-0 left-0 z-40 text-white transition-all duration-300 shadow-xl border-r border-[#003860] ${
          colapsado ? 'w-20' : 'w-64'
        }`}
      >
        {/* Encabezado del Sidebar: Identidad Institucional UAT Única (Sin duplicidad) */}
        <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-[#003860]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="shrink-0 flex items-center justify-center">
              <UatLogo variant="icon" size="sm" />
            </div>

            {!colapsado && (
              <div className="min-w-0 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-heading font-extrabold text-base tracking-wider text-[#EE7402]">
                    UAT
                  </span>
                  <span className="text-white/40">|</span>
                  <span className="font-heading font-bold text-xs text-white tracking-tight">
                    Tutorías
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 block truncate font-medium mt-1">
                  {rolActivo === 'TUTOR' ? 'Portal del Tutor' : 'Portal del Estudiante'}
                </span>
              </div>
            )}
          </div>

          {/* Botón para colapsar en Desktop */}
          <button
            onClick={onToggleColapsar}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title={colapsado ? 'Expandir menú' : 'Contraer menú'}
          >
            {colapsado ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Menú de Navegación Institucional UAT (Scroll independiente) */}
        <div className="flex-1 overflow-y-auto min-h-0 py-3 px-3 space-y-1.5">
          {!colapsado && (
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-300/80 uppercase tracking-wider">
              {rolActivo === 'TUTOR' ? 'Menú del Docente' : 'Menú del Alumno'}
            </div>
          )}

          <nav className="space-y-1.5">
            {itemsNavegacion.map((item) => {
              const Icon = item.icon;
              const isActive =
                seccionActiva === item.id ||
                (rolActivo === 'ALUMNO' && item.id === 'tutorados' && seccionActiva === 'dashboard');

              return (
                <button
                  key={item.id}
                  onClick={() => onCambiarSeccion(item.id)}
                  className={`w-full flex items-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    colapsado ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#EE7402] text-white font-semibold shadow-sm shadow-[#EE7402]/30 ring-1 ring-[#EE7402]/40'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                  title={colapsado ? item.label : undefined}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                    {!colapsado && <span className="truncate">{item.label}</span>}
                  </div>

                  {!colapsado && item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isActive
                          ? 'bg-white text-slate-900'
                          : 'bg-[#001D33] text-[#EE7402] border border-[#EE7402]/30'
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

        {/* Panel Lateral Inferior: Usuario Activo y Salir (Alineado, sin cortes y sin logo duplicado) */}
        <div className="shrink-0 p-3 border-t border-[#003860] bg-[#00223A] space-y-2">
          {/* Tarjeta de Usuario Activo */}
          <div
            className={`flex items-center gap-3 p-2.5 rounded-xl bg-[#001D33] border border-[#003860] ${
              colapsado ? 'justify-center p-2' : ''
            }`}
            title={colapsado ? usuarioActual.nombre : undefined}
          >
            <AvatarWithFallback
              src={usuarioActual.avatar}
              alt={usuarioActual.nombre}
              className="w-9 h-9 rounded-xl ring-2 ring-[#EE7402]/50 shrink-0"
            />
            {!colapsado && (
              <div className="min-w-0 flex-1">
                <span className="font-heading font-semibold text-xs text-white block truncate leading-tight">
                  {usuarioActual.nombre}
                </span>
                <span className="text-[10px] text-slate-300 block truncate mt-0.5">
                  {rolActivo === 'TUTOR'
                    ? (usuarioActual as Tutor).departamento
                    : (usuarioActual as EstudianteCatalogo).carrera}
                </span>
                <span className="text-[9px] font-bold text-[#EE7402] block uppercase tracking-wider mt-0.5">
                  {rolActivo === 'TUTOR' ? 'Docente Tutor' : 'Estudiante Tutorado'}
                </span>
              </div>
            )}
          </div>

          {/* Botón de Cerrar Sesión (Logout) */}
          {onCerrarSesion && (
            <button
              onClick={onCerrarSesion}
              className={`w-full flex items-center gap-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600/80 transition-colors cursor-pointer ${
                colapsado
                  ? 'justify-center p-2.5 bg-rose-950/30 border border-rose-900/40'
                  : 'justify-center px-3 py-2 bg-rose-950/40 border border-rose-800/50'
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
      {/* (Exclusiva por rol, sin botones de alternar rol)         */}
      {/* ======================================================== */}
      <div
        style={{ backgroundColor: '#002B49' }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 text-white border-t border-[#003860] flex items-center justify-around py-2 px-1 shadow-2xl"
      >
        {itemsNavegacion.map((item) => {
          const Icon = item.icon;
          const isActive =
            seccionActiva === item.id ||
            (rolActivo === 'ALUMNO' && item.id === 'tutorados' && seccionActiva === 'dashboard');

          return (
            <button
              key={item.id}
              onClick={() => onCambiarSeccion(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-[#EE7402]' : 'text-slate-300 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#EE7402]' : 'text-slate-300'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#EE7402] text-white text-[9px] font-bold rounded-full flex items-center justify-center font-mono">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 font-medium truncate max-w-[70px] ${
                  isActive ? 'text-[#EE7402] font-semibold' : 'text-slate-300'
                }`}
              >
                {item.shortLabel}
              </span>
            </button>
          );
        })}

        {/* Botón Salir en barra móvil */}
        {onCerrarSesion && (
          <button
            onClick={onCerrarSesion}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-rose-300 hover:text-white transition-all cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-rose-300" />
            <span className="text-[10px] mt-0.5 text-rose-300 truncate max-w-[70px]">
              Salir
            </span>
          </button>
        )}
      </div>
    </>
  );
};
