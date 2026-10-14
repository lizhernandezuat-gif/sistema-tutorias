import React, { useState, useEffect } from 'react';
import { Tutor, EstudianteCatalogo, CitaAsesoria, RolSimulado, SolicitarAsesoriaPayload } from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { formatSemestre, getCarreraCorta } from '../utils/tutoriaUtils';
import { abrirGoogleCalendar, descargarArchivoICS } from '../utils/calendarExportUtils';
import { AvatarWithFallback } from './AvatarWithFallback';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  PlusCircle,
  CheckCircle2,
  X,
  Send,
  Filter,
  User,
  ExternalLink,
  CalendarCheck,
  CalendarPlus,
  Download,
  ChevronDown,
  Users,
  Check
} from 'lucide-react';

interface CalendarioSesionesViewProps {
  rolActivo: RolSimulado;
  tutorActivo: Tutor;
  estudianteActivo: EstudianteCatalogo;
  catalogoEstudiantes: EstudianteCatalogo[];
}

export const CalendarioSesionesView: React.FC<CalendarioSesionesViewProps> = ({
  rolActivo,
  tutorActivo,
  estudianteActivo,
  catalogoEstudiantes
}) => {
  const [citas, setCitas] = useState<CitaAsesoria[]>([]);
  const [filtroModalidad, setFiltroModalidad] = useState<'TODAS' | 'Presencial' | 'Virtual'>('TODAS');
  const [filtroTipo, setFiltroTipo] = useState<'TODAS' | 'INDIVIDUAL' | 'GRUPAL'>('TODAS');
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false);
  const [menuExportarAbierto, setMenuExportarAbierto] = useState(false);

  // Modal Cancelar Sesión (sin window.confirm)
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [citaACancelar, setCitaACancelar] = useState<CitaAsesoria | null>(null);

  // Formulario de nueva sesión (Soporte Individual y Grupal)
  const [tipoNuevaSesion, setTipoNuevaSesion] = useState<'INDIVIDUAL' | 'GRUPAL'>('INDIVIDUAL');
  const [estudianteSeleccionadoId, setEstudianteSeleccionadoId] = useState(estudianteActivo.id);
  const [alumnosGrupalesIds, setAlumnosGrupalesIds] = useState<string[]>(
    catalogoEstudiantes.map((e) => e.id)
  );
  const [cupoMaximo, setCupoMaximo] = useState<number>(25);
  const [tema, setTema] = useState('Revisión de Avance Curricular');
  const [fecha, setFecha] = useState('2026-10-18');
  const [hora, setHora] = useState('11:00 AM');
  const [modalidad, setModalidad] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [motivoDetalle, setMotivoDetalle] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cargarCitas = async () => {
    if (rolActivo === 'TUTOR') {
      const res = await tutoriaService.getCitasTutor(tutorActivo.id);
      if (res.data) {
        setCitas(res.data);
      }
    } else {
      const res = await tutoriaService.getMiTutoriaComoAlumno(estudianteActivo.id);
      if (res.data?.citas) {
        setCitas(res.data.citas);
      }
    }
  };

  useEffect(() => {
    cargarCitas();
    const unsub = tutoriaService.subscribe(() => {
      cargarCitas();
    });
    return () => unsub();
  }, [rolActivo, tutorActivo.id, estudianteActivo.id]);

  const handleAgendarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeExito(null);

    const esGrupal = tipoNuevaSesion === 'GRUPAL';

    const payload: SolicitarAsesoriaPayload = {
      estudianteId: esGrupal ? 'TODOS' : (rolActivo === 'TUTOR' ? estudianteSeleccionadoId : estudianteActivo.id),
      tutorId: tutorActivo.id,
      tema,
      fecha,
      hora,
      modalidad,
      motivoDetalle,
      tipo: tipoNuevaSesion,
      estudiantesIds: esGrupal ? alumnosGrupalesIds : [rolActivo === 'TUTOR' ? estudianteSeleccionadoId : estudianteActivo.id],
      cupoMaximo: esGrupal ? cupoMaximo : 1
    };

    const res = await tutoriaService.solicitarCitaComoAlumno(payload);
    setGuardando(false);

    if (res.success) {
      setMensajeExito(esGrupal ? '¡Sesión grupal agendada con éxito!' : 'Sesión agendada exitosamente en el calendario.');
      setTimeout(() => {
        setModalAgendarAbierto(false);
        setMensajeExito(null);
        setMotivoDetalle('');
      }, 1200);
      cargarCitas();
    }
  };

  const handlePedirCancelar = (cita: CitaAsesoria) => {
    setCitaACancelar(cita);
    setModalCancelarAbierto(true);
  };

  const handleConfirmarCancelar = async () => {
    if (!citaACancelar) return;
    await tutoriaService.cancelarCitaComoAlumno(citaACancelar.id);
    setModalCancelarAbierto(false);
    setCitaACancelar(null);
    cargarCitas();
  };

  const toggleSeleccionAlumnoGrupal = (id: string) => {
    setAlumnosGrupalesIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const seleccionarTodosAlumnos = () => {
    if (alumnosGrupalesIds.length === catalogoEstudiantes.length) {
      setAlumnosGrupalesIds([]);
    } else {
      setAlumnosGrupalesIds(catalogoEstudiantes.map((e) => e.id));
    }
  };

  const citasFiltradas = citas.filter((c) => {
    const matchModalidad = filtroModalidad === 'TODAS' || c.modalidad === filtroModalidad;
    const matchTipo =
      filtroTipo === 'TODAS' ||
      (filtroTipo === 'GRUPAL' && (c.tipo === 'GRUPAL' || c.estudianteId === 'TODOS')) ||
      (filtroTipo === 'INDIVIDUAL' && c.tipo !== 'GRUPAL' && c.estudianteId !== 'TODOS');
    return matchModalidad && matchTipo;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabecera del Calendario */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
              Calendario de Sesiones y Asesorías
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EE7402]/10 text-[#EE7402] border border-[#EE7402]/30">
              Ciclo 2026-1
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {rolActivo === 'TUTOR'
              ? `Agenda de sesiones individuales y grupales para ${tutorActivo.nombre}`
              : `Tus sesiones de acompañamiento tutorial con ${tutorActivo.nombre}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro por tipo de sesión */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setFiltroTipo('TODAS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filtroTipo === 'TODAS'
                  ? 'bg-white dark:bg-slate-800 text-[#EE7402] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroTipo('INDIVIDUAL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'INDIVIDUAL'
                  ? 'bg-white dark:bg-slate-800 text-[#EE7402] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Individuales</span>
            </button>
            <button
              onClick={() => setFiltroTipo('GRUPAL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'GRUPAL'
                  ? 'bg-white dark:bg-slate-800 text-[#EE7402] shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Grupales</span>
            </button>
          </div>

          {/* Filtro por modalidad */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setFiltroModalidad('TODAS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filtroModalidad === 'TODAS'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todo formato
            </button>
            <button
              onClick={() => setFiltroModalidad('Presencial')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filtroModalidad === 'Presencial'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Presencial
            </button>
            <button
              onClick={() => setFiltroModalidad('Virtual')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filtroModalidad === 'Virtual'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Virtual
            </button>
          </div>

          {/* Botón Exportar a Google Calendar */}
          <div className="relative">
            <button
              onClick={() => setMenuExportarAbierto((prev) => !prev)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700 shrink-0"
              title="Exportar sesiones a Google Calendar o descargar archivo .ics"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#EE7402]" />
              <span className="hidden sm:inline">Google Calendar</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {menuExportarAbierto && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    const proxima = citasFiltradas.find((c) => c.estado !== 'Cancelada') || citasFiltradas[0];
                    if (proxima) {
                      const alumno = catalogoEstudiantes.find((e) => e.id === proxima.estudianteId) || estudianteActivo;
                      abrirGoogleCalendar(proxima, alumno.nombre, tutorActivo.nombre);
                    }
                    setMenuExportarAbierto(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4 text-[#EE7402] shrink-0" />
                  <div>
                    <span className="font-semibold block">Abrir en Google Calendar</span>
                    <span className="text-[10px] text-slate-400 block">Añade la próxima sesión activa</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    descargarArchivoICS(citasFiltradas, 'sesiones_tutoria_uat.ics', tutorActivo.nombre);
                    setMenuExportarAbierto(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1"
                >
                  <Download className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <span className="font-semibold block">Descargar archivo .ics</span>
                    <span className="text-[10px] text-slate-400 block">Compatible con Google, Apple y Outlook</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setModalAgendarAbierto(true)}
            className="px-3.5 py-1.5 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.01] cursor-pointer shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Agendar Sesión</span>
          </button>
        </div>
      </div>

      {/* Grid de Sesiones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {citasFiltradas.length > 0 ? (
          citasFiltradas.map((cita) => {
            const esGrupal = cita.tipo === 'GRUPAL' || cita.estudianteId === 'TODOS';
            const alumno = catalogoEstudiantes.find((e) => e.id === cita.estudianteId) || estudianteActivo;
            const esVirtual = cita.modalidad === 'Virtual';
            const esCancelada = cita.estado === 'Cancelada';

            return (
              <div
                key={cita.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                  esCancelada
                    ? 'border-slate-200 dark:border-slate-800 opacity-60'
                    : esGrupal
                    ? 'border-[#EE7402]/30 hover:border-[#EE7402] dark:hover:border-[#EE7402]/70 shadow-sm'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-[#EE7402]/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          esCancelada
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            : cita.estado === 'Confirmada'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        {cita.estado}
                      </span>

                      {/* Tag Individual vs Grupal */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          esGrupal
                            ? 'bg-[#EE7402]/10 text-[#EE7402] border-[#EE7402]/30'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {esGrupal ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span>{esGrupal ? 'Sesión Grupal' : 'Individual'}</span>
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      {esVirtual ? <Video className="w-3.5 h-3.5 text-sky-500" /> : <MapPin className="w-3.5 h-3.5 text-[#EE7402]" />}
                      {cita.modalidad}
                    </span>
                  </div>

                  <h3 className="font-heading font-semibold text-sm text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {cita.tema}
                  </h3>

                  {/* Participantes / Alumnos */}
                  {esGrupal ? (
                    <div className="p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/40 my-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#EE7402]" />
                          <span>Tutoría Grupal</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#EE7402] font-bold">
                          {cita.estudiantesIds?.length || catalogoEstudiantes.length} alumnos convocados
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {rolActivo === 'TUTOR'
                          ? 'Convocatoria general para tus tutorados asignados'
                          : `Sesión grupal dirigida por ${tutorActivo.nombre}`}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 my-3">
                      <AvatarWithFallback
                        src={rolActivo === 'TUTOR' ? alumno.avatar : tutorActivo.avatar}
                        alt={rolActivo === 'TUTOR' ? alumno.nombre : tutorActivo.nombre}
                        className="w-8 h-8 rounded-lg shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                          {rolActivo === 'TUTOR' ? alumno.nombre : tutorActivo.nombre}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {rolActivo === 'TUTOR'
                            ? `${formatSemestre(alumno.semestre)} • ${alumno.matricula}`
                            : tutorActivo.departamento}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fecha y Hora */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                    <div className="flex items-center gap-2 text-[11px]">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#EE7402]" />
                      <span className="font-medium">{cita.fecha}</span>
                      <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{cita.hora}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {esVirtual ? (
                        <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                          <Video className="w-3 h-3" />
                          Google Meet disponible
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {cita.lugar || (esGrupal ? 'Aula Magna de Tutorías UAT' : tutorActivo.cubículo)}
                        </span>
                      )}
                    </div>
                  </div>

                  {cita.motivoDetalle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 line-clamp-2">
                      &ldquo;{cita.motivoDetalle}&rdquo;
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {esVirtual && cita.enlaceVirtual && !esCancelada ? (
                      <a
                        href={cita.enlaceVirtual}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#EE7402] font-semibold hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Unirse</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {esCancelada ? 'Cancelada' : 'En agenda'}
                      </span>
                    )}

                    {!esCancelada && (
                      <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => abrirGoogleCalendar(cita, esGrupal ? 'Grupo de Tutorados UAT' : alumno.nombre, tutorActivo.nombre)}
                          className="p-1 rounded-md text-[#EE7402] hover:bg-[#EE7402]/10 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="Añadir esta cita a Google Calendar"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>Google Cal</span>
                        </button>
                        <button
                          onClick={() => descargarArchivoICS([cita], `sesion_${cita.fecha}_${cita.id}.ics`, tutorActivo.nombre)}
                          className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] cursor-pointer"
                          title="Descargar archivo .ics para esta cita"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {!esCancelada && (
                    <button
                      onClick={() => handlePedirCancelar(cita)}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-auto"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EE7402]/10 text-[#EE7402] flex items-center justify-center mx-auto">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
              No hay sesiones programadas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {filtroModalidad !== 'TODAS' || filtroTipo !== 'TODAS'
                ? 'No hay sesiones con los filtros seleccionados.'
                : 'No se encontraron citas activas para este ciclo escolar.'}
            </p>
            <button
              onClick={() => setModalAgendarAbierto(true)}
              className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Programar una Sesión</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal para Agendar Nueva Sesión (Individual o Grupal) */}
      {modalAgendarAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAgendarAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Programar Sesión de Tutoría
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {rolActivo === 'TUTOR' ? `Organizada por ${tutorActivo.nombre}` : `Con tu tutor: ${tutorActivo.nombre}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalAgendarAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAgendarSesion} className="p-5 space-y-4 overflow-y-auto">
              {mensajeExito && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="font-semibold">{mensajeExito}</p>
                </div>
              )}

              {/* Selector de Tipo de Sesión: Individual vs Grupal (Disponible para Tutor) */}
              {rolActivo === 'TUTOR' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Tipo de Formato Tutorial:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setTipoNuevaSesion('INDIVIDUAL')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        tipoNuevaSesion === 'INDIVIDUAL'
                          ? 'bg-[#EE7402]/10 border-[#EE7402] text-[#EE7402] shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Sesión Individual (1 a 1)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoNuevaSesion('GRUPAL')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        tipoNuevaSesion === 'GRUPAL'
                          ? 'bg-[#EE7402]/10 border-[#EE7402] text-[#EE7402] shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Sesión Grupal (Tutorados)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Si es Individual: selector de 1 alumno */}
              {rolActivo === 'TUTOR' && tipoNuevaSesion === 'INDIVIDUAL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Seleccionar Alumno Tutorado <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={estudianteSeleccionadoId}
                    onChange={(e) => setEstudianteSeleccionadoId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 cursor-pointer"
                  >
                    {catalogoEstudiantes.map((al) => (
                      <option key={al.id} value={al.id}>
                        {al.nombre} ({formatSemestre(al.semestre)} • {al.matricula})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Si es Grupal: selección múltiple o convocatoria general */}
              {rolActivo === 'TUTOR' && tipoNuevaSesion === 'GRUPAL' && (
                <div className="space-y-2 p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-xl border border-orange-200/50 dark:border-orange-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Alumnos Convocados ({alumnosGrupalesIds.length} seleccionados)
                    </span>
                    <button
                      type="button"
                      onClick={seleccionarTodosAlumnos}
                      className="text-[11px] font-bold text-[#EE7402] hover:underline cursor-pointer"
                    >
                      {alumnosGrupalesIds.length === catalogoEstudiantes.length
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todo mi grupo'}
                    </button>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {catalogoEstudiantes.map((al) => {
                      const estaSeleccionado = alumnosGrupalesIds.includes(al.id);
                      return (
                        <label
                          key={al.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            estaSeleccionado
                              ? 'bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/60 font-medium text-slate-900 dark:text-white'
                              : 'hover:bg-white/60 dark:hover:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={estaSeleccionado}
                            onChange={() => toggleSeleccionAlumnoGrupal(al.id)}
                            className="rounded border-slate-300 text-[#EE7402] focus:ring-[#EE7402]"
                          />
                          <span className="truncate flex-1">{al.nombre}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{al.matricula}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Tema o Motivo de la Sesión <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder={
                    tipoNuevaSesion === 'GRUPAL'
                      ? 'Ej. Tutoría Grupal: Inducción y Técnicas de Estudio'
                      : 'Ej. Revisión de calificaciones parciales y plan de trabajo'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Fecha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Hora <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 cursor-pointer"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Modalidad
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalidad('Presencial')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      modalidad === 'Presencial'
                        ? 'bg-[#EE7402]/10 border-[#EE7402] text-[#EE7402] font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      Presencial{' '}
                      {tipoNuevaSesion === 'GRUPAL'
                        ? '(Aula Magna UAT)'
                        : `(${tutorActivo.cubículo.split(',')[1]?.trim() || 'Cubículo'})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalidad('Virtual')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      modalidad === 'Virtual'
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Virtual (Meet)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Observaciones adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={motivoDetalle}
                  onChange={(e) => setMotivoDetalle(e.target.value)}
                  placeholder="Detalles sobre los puntos a tratar en la sesión..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE7402]/30 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAgendarAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Agendando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{tipoNuevaSesion === 'GRUPAL' ? 'Convocar Sesión Grupal' : 'Guardar en Agenda'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Cancelar Cita (Sin window.confirm) */}
      {modalCancelarAbierto && citaACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                ¿Cancelar esta sesión de tutoría?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La cita cambiará a estado Cancelada y se liberará el horario de agenda.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                {citaACancelar.tema}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {citaACancelar.fecha} &bull; {citaACancelar.hora} &bull; Modalidad: {citaACancelar.modalidad}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalCancelarAbierto(false);
                  setCitaACancelar(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Mantener Cita
              </button>
              <button
                type="button"
                onClick={handleConfirmarCancelar}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Sí, Cancelar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
