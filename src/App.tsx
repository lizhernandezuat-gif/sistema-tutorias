import React, { useState, useEffect } from 'react';
import { TUTORES_DEMO, CATALOGO_ESTUDIANTES } from './data/mockData';
import { Tutor, EstudianteCatalogo, AsignacionTutorado, RolSimulado, RolUsuario } from './types/tutoria';
import { tutoriaService } from './services/tutoriaService';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MiPerfilView } from './components/MiPerfilView';
import { Sidebar, SeccionNavegacion } from './components/Sidebar';
import { Header } from './components/Header';
import { TutoradosDashboard } from './components/TutoradosDashboard';
import { AlumnoPortalView } from './components/AlumnoPortalView';
import { CalendarioSesionesView } from './components/CalendarioSesionesView';
import { NotasPersonalesView } from './components/NotasPersonalesView';
import { VisualCalendarWidget } from './components/VisualCalendarWidget';
import { RightPanel } from './components/RightPanel';
import { AsignarTutoradoModal } from './components/AsignarTutoradoModal';
import { DetalleTutoradoModal } from './components/DetalleTutoradoModal';
import { StatCard } from './components/StatCard';
import { formatSemestre } from './utils/tutoriaUtils';
import {
  GraduationCap,
  Users,
  Award,
  AlertTriangle,
  Clock,
  Calendar,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Video,
  FileText
} from 'lucide-react';

function AppContent() {
  const { sesion, logout, cambiarPerfilDemo } = useAuth();
  const [rolActivo, setRolActivo] = useState<RolSimulado>('TUTOR');
  const [tutorActivo, setTutorActivo] = useState<Tutor>(TUTORES_DEMO[0]);
  const [estudianteActivo, setEstudianteActivo] = useState<EstudianteCatalogo>(CATALOGO_ESTUDIANTES[0]);
  const [seccionActiva, setSeccionActiva] = useState<SeccionNavegacion>('dashboard');
  const [colapsado, setColapsado] = useState(false);

  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [tutoradoSeleccionado, setTutoradoSeleccionado] = useState<AsignacionTutorado | null>(null);
  const [tutorados, setTutorados] = useState<AsignacionTutorado[]>([]);

  // Sincronizar el rol activo y perfil (Tutor o Alumno) con la sesión JWT autenticada
  useEffect(() => {
    if (!sesion) return;

    if (sesion.usuario.rol === 'TUTOR') {
      setRolActivo('TUTOR');
      const tutorEncontrado =
        TUTORES_DEMO.find((t) => t.id === sesion.usuario.tutorProfileId) ||
        TUTORES_DEMO.find((t) => t.email.toLowerCase() === sesion.usuario.email.toLowerCase()) ||
        TUTORES_DEMO[0];
      if (tutorEncontrado) {
        setTutorActivo({
          ...tutorEncontrado,
          nombre: sesion.usuario.nombre,
          departamento: sesion.usuario.departamento || tutorEncontrado.departamento,
          cubículo: sesion.usuario.cubículo || tutorEncontrado.cubículo
        });
      }
    } else {
      setRolActivo('ALUMNO');
      const estEncontrado =
        CATALOGO_ESTUDIANTES.find((e) => e.id === sesion.usuario.estudianteProfileId) ||
        CATALOGO_ESTUDIANTES.find((e) => e.email.toLowerCase() === sesion.usuario.email.toLowerCase()) ||
        CATALOGO_ESTUDIANTES[0];
      if (estEncontrado) {
        setEstudianteActivo({
          ...estEncontrado,
          nombre: sesion.usuario.nombre,
          matricula: sesion.usuario.matricula || estEncontrado.matricula,
          carrera: sesion.usuario.carrera || estEncontrado.carrera,
          semestre: sesion.usuario.semestre || estEncontrado.semestre,
          telefono: sesion.usuario.telefono || estEncontrado.telefono
        });
      }
    }
  }, [sesion]);

  // Redirección automática post-login según el rol autenticado
  const handlePostLoginRedirect = (rolAutenticado: RolUsuario) => {
    if (rolAutenticado === 'TUTOR') {
      setRolActivo('TUTOR');
      setSeccionActiva('dashboard');
    } else {
      setRolActivo('ALUMNO');
      setSeccionActiva('dashboard');
    }
  };

  const handleCambiarRolConSesion = (nuevoRol: RolSimulado) => {
    setRolActivo(nuevoRol);
    setSeccionActiva('dashboard');
    if (nuevoRol === 'TUTOR') {
      cambiarPerfilDemo(tutorActivo.id, 'TUTOR');
    } else {
      cambiarPerfilDemo(estudianteActivo.id, 'TUTORADO');
    }
  };

  const handleCambiarTutorConSesion = (t: Tutor) => {
    setTutorActivo(t);
    setTutoradoSeleccionado(null);
    cambiarPerfilDemo(t.id, 'TUTOR');
  };

  const handleCambiarEstudianteConSesion = (e: EstudianteCatalogo) => {
    setEstudianteActivo(e);
    cambiarPerfilDemo(e.id, 'TUTORADO');
  };

  const cargarDatos = async () => {
    const res = await tutoriaService.getMisTutorados(tutorActivo.id);
    if (res.success && res.data) {
      setTutorados(res.data);
    }
  };

  useEffect(() => {
    cargarDatos();
    const unsub = tutoriaService.subscribe(() => {
      cargarDatos();
    });
    return () => unsub();
  }, [tutorActivo.id]);

  const total = tutorados.length;
  const enRiesgo = tutorados.filter(t => t.estado === 'EN_RIESGO' || t.estado === 'CONDICIONADO');
  const promedioGeneral = total > 0
    ? (tutorados.reduce((acc, curr) => acc + curr.estudiante.promedio, 0) / total).toFixed(1)
    : '0.0';
  const totalNotas = tutorados.reduce((acc, curr) => acc + (curr.notas?.length || 0), 0);

  // Sesiones agendadas en formato de lista pequeña para el Dashboard
  const proximasSesionesResumen = [
    {
      id: 'ses-1',
      hora: '11:00 AM',
      fecha: 'Hoy, 15 Oct',
      alumno: 'Carlos Eduardo Peña',
      carrera: 'Ing. en Sistemas',
      semestre: 3,
      modalidad: 'Presencial',
      cubículo: tutorActivo.cubículo,
      urgente: true,
      tema: 'Plan de Regularización Académica Preventiva'
    },
    {
      id: 'ses-2',
      hora: '04:00 PM',
      fecha: 'Mañana, 16 Oct',
      alumno: 'Mariana Silva Robledo',
      carrera: 'Ing. en Software',
      semestre: 5,
      modalidad: 'Virtual',
      cubículo: 'Google Meet',
      urgente: false,
      tema: 'Revisión y Validación de Proyecto Terminal'
    },
    {
      id: 'ses-3',
      hora: '09:30 AM',
      fecha: 'Vie, 17 Oct',
      alumno: 'Jorge Ramos Morales',
      carrera: 'Tecnologías de Información',
      semestre: 4,
      modalidad: 'Presencial',
      cubículo: tutorActivo.cubículo,
      urgente: false,
      tema: 'Asesoría para Trámite de Beca Institucional'
    }
  ];

  return (
    <ProtectedRoute
      onLoginRedirect={handlePostLoginRedirect}
      onIrInicioAutorizado={() => setSeccionActiva('dashboard')}
    >
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 pb-16 md:pb-0">
        {/* ======================================================== */}
        {/* 1. SECCIÓN SIDEBAR (IZQUIERDA) & BOTTOM TAB BAR MÓVIL    */}
        {/* ======================================================== */}
        <Sidebar
          rolActivo={rolActivo}
          onCambiarRol={handleCambiarRolConSesion}
          tutorActivo={tutorActivo}
          estudianteActivo={estudianteActivo}
          onCambiarTutor={handleCambiarTutorConSesion}
          onCambiarEstudiante={handleCambiarEstudianteConSesion}
          catalogoTutores={TUTORES_DEMO}
          catalogoEstudiantes={CATALOGO_ESTUDIANTES}
          seccionActiva={seccionActiva}
          onCambiarSeccion={setSeccionActiva}
          conteoTutorados={total}
          colapsado={colapsado}
          onToggleColapsar={() => setColapsado(prev => !prev)}
          onCerrarSesion={logout}
        />

        {/* ======================================================== */}
        {/* CONTENEDOR PRINCIPAL: Adaptado al ancho del Sidebar      */}
        {/* ======================================================== */}
        <div
          className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ${
            colapsado ? 'md:pl-20' : 'md:pl-64'
          }`}
        >
          {/* Barra Superior Estática y Minimalista (Sin botón de hamburguesa) */}
          <Header
            rolActivo={rolActivo}
            onCambiarRol={handleCambiarRolConSesion}
            tutorActivo={tutorActivo}
            estudianteActivo={estudianteActivo}
            seccionActiva={seccionActiva}
            catalogoTutores={TUTORES_DEMO}
            catalogoEstudiantes={CATALOGO_ESTUDIANTES}
            onCambiarTutor={handleCambiarTutorConSesion}
            onCambiarEstudiante={handleCambiarEstudianteConSesion}
            onIrPerfil={() => setSeccionActiva('perfil')}
            onCerrarSesion={logout}
          />

          {/* ======================================================== */}
          {/* REFACTORIZACIÓN MODULAR DE VISTAS                        */}
          {/* ======================================================== */}
          <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* VISTA TRANSVERSAL: MI PERFIL Y BASE DE USUARIOS */}
            {seccionActiva === 'perfil' && (
              <MiPerfilView
                onCambioRol={(nuevoRol) => {
                  handlePostLoginRedirect(nuevoRol);
                }}
              />
            )}

            {seccionActiva !== 'perfil' && rolActivo === 'TUTOR' && (
            <>
              {/* =================================================== */}
              {/* VISTA 1: INICIO / DASHBOARD (dashboard.component.html)*/}
              {/* Estrictamente un Resumen con Métricas KPI y lista   */}
              {/* pequeña de Próximas Sesiones / Próxima Acción       */}
              {/* =================================================== */}
              {seccionActiva === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start animate-in fade-in duration-200">
                  {/* Contenido Central: Resumen y Métricas KPI */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Tarjeta de Bienvenida del Tutor */}
                    <div className="bg-white dark:bg-slate-900 rounded-[16px] p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#20B2AA]/15 text-[#0E7470] dark:text-[#20B2AA] font-heading">
                            Resumen Institucional
                          </span>
                          <span className="text-xs text-[#64748B] dark:text-slate-400">
                            Ciclo Escolar 2026-1
                          </span>
                        </div>
                        <h1 className="font-heading font-semibold text-xl sm:text-2xl text-slate-900 dark:text-white mt-1 tracking-tight">
                          Bienvenido, {tutorActivo.nombre}
                        </h1>
                        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
                          {tutorActivo.departamento} &bull; Cubículo de tutoría: {tutorActivo.cubículo}
                        </p>
                      </div>

                      <button
                        onClick={() => setModalAsignarAbierto(true)}
                        className="px-4 py-2.5 bg-[#20B2AA] hover:bg-[#1CA099] active:bg-[#178B85] text-white rounded-[12px] text-xs font-semibold flex items-center gap-2 shadow-xs transition-all hover:scale-[1.01] cursor-pointer self-start sm:self-auto"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Asignar Alumno</span>
                      </button>
                    </div>

                    {/* Tarjetas de KPI (Métricas Principales) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard
                        title="Tutorados Asignados"
                        value={total}
                        subtitle="Acompañamiento escolar"
                        icon={Users}
                        variant="default"
                      />

                      <StatCard
                        title="Alumnos en Riesgo"
                        value={enRiesgo.length}
                        badge={total > 0 && enRiesgo.length > 0 ? `(${Math.round((enRiesgo.length / total) * 100)}%)` : undefined}
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

                    {/* Tarjeta de Próximas Sesiones Agendadas en Formato de Lista Pequeña */}
                    <div className="bg-white dark:bg-slate-900 rounded-[16px] p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#20B2AA]/15 text-[#20B2AA] flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h2 className="font-heading font-semibold text-base text-slate-900 dark:text-white">
                              Próximas Sesiones Agendadas
                            </h2>
                            <p className="text-xs text-[#64748B] dark:text-slate-400">
                              Citas programadas en agenda para los próximos días
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSeccionActiva('calendario')}
                          className="text-xs font-semibold text-[#20B2AA] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ver calendario completo</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Lista pequeña y limpia (no vista de calendario grande) */}
                      <div className="space-y-3">
                        {proximasSesionesResumen.map((ses) => (
                          <div
                            key={ses.id}
                            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                              ses.urgente
                                ? 'bg-[#FFF5F2] dark:bg-rose-950/20 border-[#FF7F50]/40'
                                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`px-2.5 py-1.5 rounded-lg text-center font-mono shrink-0 ${
                                  ses.urgente
                                    ? 'bg-[#FF7F50] text-white font-bold'
                                    : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                                }`}
                              >
                                <span className="block text-[10px] font-semibold uppercase">{ses.fecha.split(',')[0]}</span>
                                <span className="block text-xs font-bold">{ses.hora}</span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-heading font-semibold text-xs text-slate-900 dark:text-white">
                                    {ses.alumno}
                                  </span>
                                  {ses.urgente && (
                                    <span className="text-[9px] uppercase font-bold px-2 py-0.2 rounded-full bg-[#FF7F50] text-white">
                                      Atención Urgente
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {ses.carrera} &bull; {formatSemestre(ses.semestre)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 truncate">
                                  {ses.tema}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                {ses.modalidad === 'Virtual' ? (
                                  <Video className="w-3 h-3 text-sky-500" />
                                ) : (
                                  <MapPin className="w-3 h-3 text-emerald-500" />
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
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Panel Derecho: Resumen Ejecutivo y Acción Principal */}
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

              {/* =================================================== */}
              {/* VISTA 2: CALENDARIO Y SESIONES                      */}
              {/* (calendario.component.html)                         */}
              {/* Aquí se mueve toda la cuadrícula del calendario     */}
              {/* visual de sesiones expandida sin distracciones      */}
              {/* =================================================== */}
              {seccionActiva === 'calendario' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Cuadrícula Completa del Calendario Visual de Sesiones */}
                  <VisualCalendarWidget
                    citas={[]}
                    onNuevaSesion={() => {}}
                  />

                  {/* Vista de Gestión y Detalle de Citas y Sesiones */}
                  <CalendarioSesionesView
                    rolActivo="TUTOR"
                    tutorActivo={tutorActivo}
                    estudianteActivo={estudianteActivo}
                    catalogoEstudiantes={CATALOGO_ESTUDIANTES}
                  />
                </div>
              )}

              {/* =================================================== */}
              {/* VISTA 3: ALUMNOS / MI TUTORÍA                       */}
              {/* (alumnos.component.html)                            */}
              {/* Mueve aquí las tarjetas detalladas de los perfiles  */}
              {/* (como Ana Lucía Morales con semestre y carrera)     */}
              {/* =================================================== */}
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

          {/* ======================================================== */}
          {/* VISTAS PARA EL ROL DE ALUMNO                             */}
          {/* ======================================================== */}
          {seccionActiva !== 'perfil' && rolActivo === 'ALUMNO' && (
            <>
              {/* 1. Inicio / Dashboard o Mi Tutoría */}
              {(seccionActiva === 'dashboard' || seccionActiva === 'tutorados') && (
                <div className="max-w-6xl w-full mx-auto animate-in fade-in duration-200">
                  <AlumnoPortalView
                    estudianteActivo={estudianteActivo}
                    onCambiarEstudiante={handleCambiarEstudianteConSesion}
                    catalogoEstudiantes={CATALOGO_ESTUDIANTES}
                  />
                </div>
              )}

              {/* 2. Calendario y Sesiones */}
              {seccionActiva === 'calendario' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <VisualCalendarWidget
                    citas={[]}
                    onNuevaSesion={() => {}}
                  />

                  <CalendarioSesionesView
                    rolActivo="ALUMNO"
                    tutorActivo={tutorActivo}
                    estudianteActivo={estudianteActivo}
                    catalogoEstudiantes={CATALOGO_ESTUDIANTES}
                  />
                </div>
              )}

              {/* 3. Mis Notas Personales (Vista Dedicada y Exclusiva) */}
              {seccionActiva === 'notas' && (
                <div className="animate-in fade-in duration-200">
                  <NotasPersonalesView />
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer Institucional */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-4 mt-auto text-xs text-[#64748B] dark:text-slate-400">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#20B2AA]" />
              <span>
                <strong className="text-slate-800 dark:text-slate-200 font-heading">Tutoría Pro</strong> &bull; Portal de Acompañamiento Escolar
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
              <span>Periodo Activo 2026-1</span>
              <span>&bull;</span>
              <span>Universidad Tecnológica</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modales de Gestión de Tutoría */}
      <AsignarTutoradoModal
        isOpen={modalAsignarAbierto}
        onClose={() => setModalAsignarAbierto(false)}
        tutorActivo={tutorActivo}
        onAsignacionExitosa={cargarDatos}
      />

      <DetalleTutoradoModal
        asignacion={tutoradoSeleccionado}
        onClose={() => setTutoradoSeleccionado(null)}
        tutorActivo={tutorActivo}
        onActualizacion={cargarDatos}
      />
      </div>
    </ProtectedRoute>
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
