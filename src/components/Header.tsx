import React, { useState, useRef, useEffect } from 'react';
import { Tutor, EstudianteCatalogo, RolSimulado } from '../types/tutoria';
import { useTheme } from '../context/ThemeContext';
import { AvatarWithFallback } from './AvatarWithFallback';
import { SeccionNavegacion } from './Sidebar';
import { UatLogo, UatHeraldicSeal, UatCorporateLogo } from './UatLogo';
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
  ShieldCheck,
  X,
  Info
} from 'lucide-react';

interface HeaderProps {
  rolActivo: RolSimulado;
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
  tutorActivo,
  estudianteActivo,
  seccionActiva,
  onIrPerfil,
  onCerrarSesion
}) => {
  const { theme, toggleTheme } = useTheme();
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [modalLogosAbierto, setModalLogosAbierto] = useState(false);
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
        return rolActivo === 'TUTOR' ? 'Mis Tutorados' : 'Información del Tutor';
      case 'calendario':
        return rolActivo === 'TUTOR' ? 'Agenda Institucional' : 'Mis Reuniones Agendadas';
      case 'archivos':
        return rolActivo === 'TUTOR' ? 'Gestión de Documentos' : 'Subir Documentos y Evidencias';
      case 'notas':
        return 'Mis Notas Personales';
      case 'perfil':
        return 'Mi Perfil Institucional';
      case 'dashboard':
      default:
        return rolActivo === 'TUTOR' ? 'Panel Principal' : 'Información del Tutor';
    }
  };

  const getSeccionDescripcion = () => {
    switch (seccionActiva) {
      case 'tutorados':
        return rolActivo === 'TUTOR'
          ? 'Directorio institucional de tutorados asignados y seguimiento académico'
          : 'Ficha de contacto del tutor docente, cubículo y solicitud de asesoría';
      case 'calendario':
        return rolActivo === 'TUTOR'
          ? 'Agenda oficial de citas de asesoría presencial y virtual'
          : 'Calendario de tus sesiones programadas de acompañamiento tutorial';
      case 'archivos':
        return rolActivo === 'TUTOR'
          ? 'Formatos oficiales UAT, plan de tutoría y evidencias docentes'
          : 'Entrega de constancias, tareas académicas y evidencias de tutoría';
      case 'notas':
        return 'Espacio confidencial para tus apuntes, dudas y recordatorios privados';
      case 'perfil':
        return 'Ficha institucional, datos académicos y seguridad de tu cuenta';
      case 'dashboard':
      default:
        return rolActivo === 'TUTOR'
          ? 'Métricas institucionales, avance del ciclo escolar y alertas de atención'
          : 'Portal estudiantil de acompañamiento académico y asesorías';
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 shadow-2xs transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Lado Izquierdo: Logotipo UAT Compacto y Título de la Sección Activa */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Isotipo UAT en Header */}
            <div className="hidden sm:flex items-center pr-3 border-r border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setModalLogosAbierto(true)}
                className="group flex items-center gap-1.5 p-1 -m-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                title="Ver logotipos oficiales y escudo institucional de la UAT"
              >
                <UatLogo variant="compact" size="sm" showSubtitle={false} />
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EE7402]/10 text-[#EE7402] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver logos
                </span>
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="sm:hidden font-heading font-extrabold text-xs text-[#EE7402] tracking-wider">
                  UAT
                </span>
                <h1 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                  {getSeccionTitulo()}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block truncate">
                {getSeccionDescripcion()}
              </p>
            </div>
          </div>

          {/* Lado Derecho: Modo Claro/Oscuro + Perfil Minimalista Elegante */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Alternador de Modo Claro / Modo Oscuro */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
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
                onClick={() => setMenuPerfilAbierto((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 pl-2 sm:pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                aria-expanded={menuPerfilAbierto}
                aria-haspopup="true"
              >
                <AvatarWithFallback
                  src={usuarioActual.avatar}
                  alt={usuarioActual.nombre}
                  className="w-8 h-8 rounded-full ring-2 ring-[#EE7402]/40 shadow-2xs shrink-0"
                />

                <div className="hidden sm:block text-left min-w-0">
                  <span className="font-heading font-semibold text-xs text-slate-900 dark:text-white block truncate max-w-[140px] leading-tight">
                    {usuarioActual.nombre.split(' ')[0]} {usuarioActual.nombre.split(' ')[1] || ''}
                  </span>
                  <span className="text-[10px] text-[#EE7402] dark:text-[#EE7402] font-semibold block truncate">
                    {rolActivo === 'TUTOR' ? 'Docente Tutor' : 'Alumno Tutorado'}
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
                      className="w-10 h-10 rounded-xl ring-2 ring-[#EE7402]/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-bold text-xs text-slate-900 dark:text-white truncate">
                        {usuarioActual.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{usuarioActual.email}</span>
                      </p>
                      {/* Estado de Seguridad Institucional (Sin exponer cadenas JWT) */}
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {rolActivo === 'TUTOR'
                            ? 'Cuenta Institucional: Docente'
                            : 'Cuenta Institucional: Estudiante'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Cuenta: Mi Perfil y Cerrar Sesión */}
                  <div className="px-3 py-2 space-y-1">
                    {onIrPerfil && (
                      <button
                        onClick={() => {
                          onIrPerfil();
                          setMenuPerfilAbierto(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <UserCircle className="w-4 h-4 text-[#EE7402]" />
                        <span>Mi Perfil Institucional</span>
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
                        <span>Cerrar Sesión Segura</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ======================================================== */}
      {/* MODAL INSTITUCIONAL: LOGOTIPOS Y ESCUDO OFICIAL UAT      */}
      {/* ======================================================== */}
      {modalLogosAbierto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setModalLogosAbierto(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                    Identidad Visual y Logotipos Oficiales
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Universidad Autónoma de Tamaulipas &bull; Símbolos de Identidad Institucional
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalLogosAbierto(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuadrícula de los 2 Logos Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LOGO 1: Logotipo Moderno Oficial (Imagen 1) */}
              <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EE7402]/15 text-[#EE7402] border border-[#EE7402]/30">
                      Logotipo Corporativo
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">#EE7402</span>
                  </div>

                  {/* Visualización del Logo Moderno */}
                  <div className="py-6 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-center min-h-[170px] shadow-2xs">
                    <UatCorporateLogo showSubtitle={true} />
                  </div>

                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-4">
                    Marca Gráfica y Monograma UAT
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Acrónimo estilizado en degradado naranja institucional con el trazo aerodinámico y corte de plumas de halcón en la <strong>T</strong>, acompañado de la denominación oficial.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>Uso principal:</strong> Portales digitales, plataformas de tutorías, papelería institucional y difusión.
                </div>
              </div>

              {/* LOGO 2: Escudo Heráldico Circular Oficial (Imagen 2) */}
              <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      Escudo Heráldico
                    </span>
                    <span className="text-[11px] font-serif italic text-[#EE7402] font-semibold">
                      Sello Histórico
                    </span>
                  </div>

                  {/* Visualización del Escudo Heráldico */}
                  <div className="py-4 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-center min-h-[170px] shadow-2xs">
                    <UatHeraldicSeal size={140} showMotto={true} />
                  </div>

                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-4">
                    Escudo Universitario Tradicional
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Sello circular con la leyenda <em>VNIVERSIDAD AVTONOMA Đ TAMAVLIPAS</em>, libro abierto de la sabiduría, ser humano ascendente portando la <strong>Antorcha del Saber</strong> y el <strong>Átomo de la Ciencia</strong>.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>Lema Institucional:</strong> <span className="font-serif italic font-bold text-[#EE7402]">&ldquo;Verdad, Belleza, Probidad&rdquo;</span>.
                </div>
              </div>
            </div>

            {/* Pie del modal */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sistema Institucional de Tutorías &bull; Dirección de Acompañamiento Académico
              </span>
              <button
                type="button"
                onClick={() => setModalLogosAbierto(false)}
                className="px-4 py-2 rounded-xl bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
