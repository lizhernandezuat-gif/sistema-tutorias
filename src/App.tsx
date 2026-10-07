import React, { useState, useEffect } from 'react';
import { TUTORES_DEMO, CATALOGO_ESTUDIANTES } from './data/mockData';
import { Tutor, EstudianteCatalogo, AsignacionTutorado, RolSimulado, CitaAsesoria } from './types/tutoria';
import { tutoriaService } from './services/tutoriaService';
import { Sidebar, SeccionNavegacion } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { RightPanel } from './components/RightPanel';
import { AsignarTutoradoModal } from './components/AsignarTutoradoModal';
import { DetalleTutoradoModal } from './components/DetalleTutoradoModal';
import { AlumnoPortalView } from './components/AlumnoPortalView';
import { CalendarioSesionesView } from './components/CalendarioSesionesView';
import { TutoradosDashboard } from './components/TutoradosDashboard';
import { ArchivosEvidenciasView } from './components/ArchivosEvidenciasView';
import { NotasPersonalesView } from './components/NotasPersonalesView';
import { MiPerfilView } from './components/MiPerfilView';
import { AuthView } from './components/AuthView';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { formatSemestre } from './utils/tutoriaUtils';
import {
  Users,
  Award,
  AlertTriangle,
  Clock,
  UserPlus,
  ArrowRight,
  MapPin,
  Video,
  GraduationCap
} from 'lucide-react';

function AppContent() {
  const { logout: contextLogout, iniciarSesionDirecta } = useAuth();

  // ========================================================
  // 1. ELEVACIÓN DEL ESTADO DE AUTENTICACIÓN (State Hoisting)
  // ========================================================
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'tutor' | 'alumno'>('tutor');

  // Estado de perfiles y vistas activas
  const [rolActivo, setRolActivo] = useState<RolSimulado>('TUTOR');
  const [tutores, setTutores] = useState<Tutor[]>(TUTORES_DEMO);
  const [catalogoEstudiantes, setCatalogoEstudiantes] = useState<EstudianteCatalogo[]>(CATALOGO_ESTUDIANTES);
  const [tutorActivo, setTutorActivo] = useState<Tutor>(TUTORES_DEMO[0]);
  const [estudianteActivo, setEstudianteActivo] = useState<EstudianteCatalogo>(CATALOGO_ESTUDIANTES[0]);
  const [seccionActiva, setSeccionActiva] = useState<SeccionNavegacion>('dashboard');
  const [colapsado, setColapsado] = useState(false);

  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [tutoradoSeleccionado, setTutoradoSeleccionado] = useState<AsignacionTutorado | null>(null);
  const [tutorados, setTutorados] = useState<AsignacionTutorado[]>([]);
  const [citas, setCitas] = useState<CitaAsesoria[]>([]);

  // Manejador centralizado para login exitoso y transición inmediata
  const handleLoginSuccess = (rol: 'tutor' | 'alumno') => {
    setUserRole(rol);
    setIsAuthenticated(true);
    iniciarSesionDirecta(rol);

    if (rol === 'tutor') {
      setRolActivo('TUTOR');
      setSeccionActiva('dashboard');
      setTutorActivo(TUTORES_DEMO[0]);
    } else {
      setRolActivo('ALUMNO');
      setSeccionActiva('tutorados');
      setEstudianteActivo(CATALOGO_ESTUDIANTES[0]);
    }
  };

  // Manejador centralizado para cierre de sesión seguro
  const handleCerrarSesion = () => {
    setIsAuthenticated(false);
    setUserRole('tutor');
    contextLogout();
  };

  const cargarDatos = async () => {
    const res = await tutoriaService.getMisTutorados(tutorActivo.id);
    if (res.success && res.data) {
      setTutorados(res.data);
    }

    if (userRole === 'tutor') {
      const resCitasTutor = await tutoriaService.getCitasPorTutor(tutorActivo.id);
      if (resCitasTutor.data) {
        setCitas(resCitasTutor.data);
      }
    } else {
      const resCitas = await tutoriaService.getMiTutoriaComoAlumno(estudianteActivo.id);
      if (resCitas.data?.citas) {
        setCitas(resCitas.data.citas);
      }
    }

    const tuts = await tutoriaService.getCatalogoTutores();
    if (tuts.length > 0) setTutores(tuts);

    const ests = await tutoriaService.getCatalogoEstudiantes();
    if (ests.length > 0) setCatalogoEstudiantes(ests);
  };

  useEffect(() => {
    if (isAuthenticated) {
      cargarDatos();
      const unsub = tutoriaService.subscribe(() => {
        cargarDatos();
      });
      return () => unsub();
    }
  }, [isAuthenticated, userRole, tutorActivo.id, estudianteActivo.id]);

  // ========================================================
  // DECISIÓN CONDICIONAL EN RAÍZ:
  // Si isAuthenticated === false -> Muestra estrictamente el Login de la UAT
  // ========================================================
  if (!isAuthenticated) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        onLoginDirecto={handleLoginSuccess}
      />
    );
  }

  const total = tutorados.length;
  const enRiesgo = tutorados.filter((t) => t.estado === 'EN_RIESGO' || t.estado === 'CONDICIONADO');
  const promedioGeneral =
    total > 0
      ? (tutorados.reduce((acc, curr) => acc + curr.estudiante.promedio, 0) / total).toFixed(1)
      : '0.0';
  const totalNotas = tutorados.reduce((acc, curr) => acc + (curr.notas?.length || 0), 0);

  // Sesiones agendadas para el panel del tutor
  const proximasSesionesResumen =
    citas.length > 0
      ? citas.slice(0, 3).map((cita, idx) => {
          const esGrupal = cita.esGrupal || cita.estudianteId === 'GRUPAL' || (cita.estudiantesIds && cita.estudiantesIds.length > 1);
          const alumno = !esGrupal
            ? catalogoEstudiantes.find((e) => e.id === cita.estudianteId) || estudianteActivo
            : null;

          return {
            id: cita.id || `ses-${idx}`,
            hora: cita.hora,
            fecha: cita.fecha,
            alumno: esGrupal
              ? `Sesión Grupal (${cita.estudiantesIds?.length || 0} alumnos)`
              : alumno?.nombre || 'Estudiante Tutorado',
            carrera: esGrupal ? 'Tutoría Grupal' : alumno?.carrera || '',
            semestre: esGrupal ? 1 : alumno?.semestre || 1,
            modalidad: cita.modalidad,
            cubículo: cita.modalidad === 'Virtual' ? 'Google Meet' : cita.lugar || (esGrupal ? 'Aula Magna' : tutorActivo.cubículo),
            urgente: cita.estado === 'Pendiente',
            tema: cita.tema,
            esGrupal
          };
        })
      : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 pb-16 md:pb-0">
      {/* 1. SECCIÓN SIDEBAR (IZQUIERDA) & BOTTOM TAB BAR MÓVIL */}
      <Sidebar
        rolActivo={rolActivo}
        tutorActivo={tutorActivo}
        estudianteActivo={estudianteActivo}
        catalogoTutores={tutores}
        catalogoEstudiantes={catalogoEstudiantes}
        seccionActiva={seccionActiva}
        onCambiarSeccion={setSeccionActiva}
        conteoTutorados={total}
        colapsado={colapsado}
        onToggleColapsar={() => setColapsado((prev) => !prev)}
        onCerrarSesion={handleCerrarSesion}
      />

      {/* CONTENEDOR PRINCIPAL: Adaptado al ancho del Sidebar */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ${
          colapsado ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Barra Superior Institucional UAT */}
        <Header
          rolActivo={rolActivo}
          tutorActivo={tutorActivo}
          estudianteActivo={estudianteActivo}
          seccionActiva={seccionActiva}
          onIrPerfil={() => setSeccionActiva('perfil')}
          onCerrarSesion={handleCerrarSesion}
        />

        {/* ======================================================== */}
        {/* REFACTORIZACIÓN MODULAR DE VISTAS POR ROL                */}
        {/* ======================================================== */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* VISTA: MI PERFIL INSTITUCIONAL */}
          {seccionActiva === 'perfil' && (
            <MiPerfilView onLogout={handleCerrarSesion} />
          )}

          {/* VISTA: DOCUMENTOS Y ARCHIVOS (DIFERENCIADO POR ROL) */}
          {seccionActiva === 'archivos' && (
            <ArchivosEvidenciasView
              rolActivo={rolActivo}
              tutorActivo={tutorActivo}
              estudianteActivo={estudianteActivo}
              catalogoEstudiantes={catalogoEstudiantes}
            />
          )}

          {/* ====================================================== */}
          {/* VISTAS EXCLUSIVAS DEL TUTOR DOCENTE                    */}
          {/* ====================================================== */}
          {seccionActiva !== 'perfil' && seccionActiva !== 'archivos' && rolActivo === 'TUTOR' && (
            <>
              {/* 1. Panel Principal (Dashboard) */}
              {seccionActiva === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start animate-in fade-in duration-200">
                  <div className="lg:col-span-8 space-y-6">
                    {/* Tarjeta de Bienvenida del Tutor */}
                    <div className="bg-white dark:bg-slate-900 rounded-[16px] p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EE7402]/10 text-[#EE7402] border border-[#EE7402]/30 font-heading">
                            UAT &middot; Coordinación Docente
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Ciclo Escolar 2026-1
                          </span>
                        </div>
                        <h1 className="font-heading font-semibold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1.5 tracking-tight">
                          Bienvenido(a), {tutorActivo.nombre}
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {tutorActivo.departamento} &bull; Cubículo de atención: {tutorActivo.cubículo}
                        </p>
                      </div>

                      <button
                        onClick={() => setModalAsignarAbierto(true)}
                        className="px-4 py-2.5 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all hover:scale-[1.01] cursor-pointer self-start sm:self-auto"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Asignar Alumno</span>
                      </button>
                    </div>

                    {/* Tarjetas de KPI */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard
                        title="Tutorados Asignados"
                        value={total}
                        subtitle="Acompañamiento UAT"
                        icon={Users}
                        variant="default"
                      />

                      <StatCard
                        title="Alumnos en Riesgo"
                        value={enRiesgo.length}
                        badge={
                          total > 0 && enRiesgo.length > 0
                            ? `(${Math.round((enRiesgo.length / total) * 100)}%)`
                            : undefined
                        }
                        subtitle="Atención prioritaria"
                        icon={AlertTriangle}
                        variant="rose"
                      />

                      <StatCard
                        title="Promedio del Grupo"
                        value={promedioGeneral}
                        badge="/ 10"
                        subtitle="Desempeño general"
                        icon={Award}
                        variant="emerald"
                      />

                      <StatCard
                        title="Sesiones Registradas"
                        value={totalNotas}
                        subtitle="Bitácora activa"
                        icon={Clock}
                        variant="blue"
                      />
                    </div>

                    {/* Tarjeta de Próximas Sesiones Agendadas */}
                    <div className="bg-white dark:bg-slate-900 rounded-[16px] p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-slate-200/90 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white">
                              Próximas Sesiones de Asesoría
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Citas programadas en la agenda institucional
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSeccionActiva('calendario')}
                          className="text-xs font-semibold text-[#EE7402] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ver agenda completa</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {proximasSesionesResumen.length > 0 ? (
                          proximasSesionesResumen.map((ses) => (
                            <div
                              key={ses.id}
                              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                ses.urgente
                                  ? 'bg-[#FFF7ED] dark:bg-rose-950/20 border-[#EE7402]/40'
                                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div
                                  className={`px-2.5 py-1.5 rounded-lg text-center font-mono shrink-0 ${
                                    ses.urgente
                                      ? 'bg-[#EE7402] text-white font-bold'
                                      : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                                  }`}
                                >
                                  <span className="block text-[10px] font-semibold uppercase">
                                    {ses.fecha.split(',')[0]}
                                  </span>
                                  <span className="block text-xs font-bold">{ses.hora}</span>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-heading font-semibold text-xs text-slate-900 dark:text-white">
                                      {ses.alumno}
                                    </span>
                                    {ses.urgente && (
                                      <span className="text-[9px] uppercase font-bold px-2 py-0.2 rounded-full bg-[#EE7402] text-white">
                                        Atención Prioritaria
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {ses.carrera} &bull; {formatSemestre(ses.semestre)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                                    {ses.tema}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  {ses.modalidad === 'Virtual' ? (
                                    <Video className="w-3 h-3 text-sky-500" />
                                  ) : (
                                    <MapPin className="w-3 h-3 text-[#EE7402]" />
                                  )}
                                  {ses.modalidad}
                                </span>

                                <button
                                  onClick={() => setSeccionActiva('calendario')}
                                  className="px-3 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                                >
                                  Ver Detalle
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-xs text-slate-400">
                            No hay citas agendadas próximamente.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel Derecho Ejecutivo */}
                  <div className="lg:col-span-4">
                    <RightPanel
                      rolActivo={rolActivo}
                      tutorActivo={tutorActivo}
                      totalTutorados={total}
                      alumnosEnRiesgo={enRiesgo}
                      promedioGeneral={promedioGeneral}
                      totalNotas={totalNotas}
                      onAbrirAsignarModal={() => setModalAsignarAbierto(true)}
                      onVerDirectorio={() => setSeccionActiva('tutorados')}
                      onVerCalendario={() => setSeccionActiva('calendario')}
                      onSeleccionarTutorado={setTutoradoSeleccionado}
                    />
                  </div>
                </div>
              )}

              {/* 2. Agenda (Calendario) */}
              {seccionActiva === 'calendario' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <CalendarioSesionesView
                    rolActivo="TUTOR"
                    tutorActivo={tutorActivo}
                    estudianteActivo={estudianteActivo}
                    catalogoEstudiantes={catalogoEstudiantes}
                  />
                </div>
              )}

              {/* 3. Mis Tutorados (Directorio) */}
              {seccionActiva === 'tutorados' && (
                <div className="animate-in fade-in duration-200">
                  <TutoradosDashboard
                    tutorActivo={tutorActivo}
                    onAbrirAsignarModal={() => setModalAsignarAbierto(true)}
                    onSeleccionarTutorado={setTutoradoSeleccionado}
                    onActualizacionGlobal={cargarDatos}
                  />
                </div>
              )}
            </>
          )}

          {/* ====================================================== */}
          {/* VISTAS EXCLUSIVAS DEL ALUMNO TUTORADO                  */}
          {/* ====================================================== */}
          {seccionActiva !== 'perfil' && seccionActiva !== 'archivos' && rolActivo === 'ALUMNO' && (
            <>
              {/* 1. Ver Información del Tutor */}
              {(seccionActiva === 'dashboard' || seccionActiva === 'tutorados') && (
                <div className="max-w-6xl w-full mx-auto animate-in fade-in duration-200">
                  <AlumnoPortalView estudianteActivo={estudianteActivo} />
                </div>
              )}

              {/* 2. Mis Reuniones */}
              {seccionActiva === 'calendario' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <CalendarioSesionesView
                    rolActivo="ALUMNO"
                    tutorActivo={tutorActivo}
                    estudianteActivo={estudianteActivo}
                    catalogoEstudiantes={catalogoEstudiantes}
                  />
                </div>
              )}

              {/* 3. Mis Notas Personales (Confidencial) */}
              {seccionActiva === 'notas' && (
                <div className="animate-in fade-in duration-200">
                  <NotasPersonalesView />
                </div>
              )}
            </>
          )}
        </main>

        {/* Modales Globales */}
        {rolActivo === 'TUTOR' && (
          <>
            <AsignarTutoradoModal
              isOpen={modalAsignarAbierto}
              onClose={() => setModalAsignarAbierto(false)}
              tutorActivo={tutorActivo}
              catalogoEstudiantes={catalogoEstudiantes}
              onAsignacionExitosa={cargarDatos}
            />

            <DetalleTutoradoModal
              asignacion={tutoradoSeleccionado}
              onClose={() => setTutoradoSeleccionado(null)}
              tutorActivo={tutorActivo}
              onActualizacion={cargarDatos}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
