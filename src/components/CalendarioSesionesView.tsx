import React, { useState, useEffect, useMemo } from 'react';
import {
  Tutor,
  EstudianteCatalogo,
  CitaAsesoria,
  RolSimulado,
  SolicitarAsesoriaPayload,
  AgendarSesionGrupalPayload
} from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { formatSemestre } from '../utils/tutoriaUtils';
import { abrirGoogleCalendar, descargarArchivoICS } from '../utils/calendarExportUtils';
import {
  EVENTOS_CALENDARIO_UAT_2026,
  getEventoEscolarUat,
  esInhabilOVacacionesUat,
  EventoEscolarUAT
} from '../data/calendarioUatData';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  PlusCircle,
  CheckCircle2,
  X,
  User,
  Users,
  CalendarCheck,
  CalendarPlus,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  UserPlus,
  Search,
  Sparkles,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  AlertTriangle,
  Award,
  Info,
  BookOpen,
  AlertCircle
} from 'lucide-react';

export type TipoVistaCalendario = 'semana' | 'mes' | 'dia' | 'ano';

interface CalendarioSesionesViewProps {
  rolActivo: RolSimulado;
  tutorActivo: Tutor;
  estudianteActivo: EstudianteCatalogo;
  catalogoEstudiantes: EstudianteCatalogo[];
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_SEMANA_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const CalendarioSesionesView: React.FC<CalendarioSesionesViewProps> = ({
  rolActivo,
  tutorActivo,
  estudianteActivo,
  catalogoEstudiantes
}) => {
  const [citas, setCitas] = useState<CitaAsesoria[]>([]);

  // Vista por defecto: SEMANA (requisito institucional)
  const [vista, setVista] = useState<TipoVistaCalendario>('semana');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(() => new Date());

  // Filtros unificados
  const [filtroTipo, setFiltroTipo] = useState<'TODAS' | 'INDIVIDUAL' | 'GRUPAL'>('TODAS');
  const [filtroModalidad, setFiltroModalidad] = useState<'TODAS' | 'Presencial' | 'Virtual'>('TODAS');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [citaSeleccionadaDetalle, setCitaSeleccionadaDetalle] = useState<CitaAsesoria | null>(null);
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false);
  const [menuExportarAbierto, setMenuExportarAbierto] = useState(false);
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [citaACancelar, setCitaACancelar] = useState<CitaAsesoria | null>(null);

  // Formulario Nueva Sesión
  const [tipoNuevaSesion, setTipoNuevaSesion] = useState<'INDIVIDUAL' | 'GRUPAL'>(
    rolActivo === 'TUTOR' ? 'GRUPAL' : 'INDIVIDUAL'
  );
  const [estudianteSeleccionadoId, setEstudianteSeleccionadoId] = useState(
    catalogoEstudiantes[0]?.id || estudianteActivo.id
  );
  const [estudiantesGrupalesSeleccionados, setEstudiantesGrupalesSeleccionados] = useState<string[]>(
    catalogoEstudiantes.map((e) => e.id)
  );
  const [tema, setTema] = useState('Revisión de Avance Curricular y Estrategias Académicas');
  const [fechaForm, setFechaForm] = useState(() => new Date().toISOString().split('T')[0]);
  const [horaForm, setHoraForm] = useState('11:00 AM');
  const [modalidadForm, setModalidadForm] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [lugarForm, setLugarForm] = useState('');
  const [enlaceVirtualForm, setEnlaceVirtualForm] = useState('');
  const [motivoForm, setMotivoForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Modal Editar Participantes de Sesión Grupal (Tutor)
  const [modalEditarParticipantesAbierto, setModalEditarParticipantesAbierto] = useState(false);
  const [citaParaEditarParticipantes, setCitaParaEditarParticipantes] = useState<CitaAsesoria | null>(null);
  const [participantesEdicionIds, setParticipantesEdicionIds] = useState<string[]>([]);
  const [guardandoParticipantes, setGuardandoParticipantes] = useState(false);

  // Formateador seguro YYYY-MM-DD
  const formatIsoDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (d: Date): boolean => {
    const hoy = new Date();
    return (
      d.getDate() === hoy.getDate() &&
      d.getMonth() === hoy.getMonth() &&
      d.getFullYear() === hoy.getFullYear()
    );
  };

  const isSameDay = (d1: Date, d2: Date): boolean => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Cargar Citas (Grupales e Individuales)
  const cargarCitas = async () => {
    if (rolActivo === 'TUTOR') {
      const res = await tutoriaService.getCitasPorTutor(tutorActivo.id);
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

  // Navegación Temporal
  const handleAnterior = () => {
    const nueva = new Date(fechaSeleccionada);
    if (vista === 'semana') {
      nueva.setDate(nueva.getDate() - 7);
    } else if (vista === 'mes') {
      nueva.setMonth(nueva.getMonth() - 1);
    } else if (vista === 'dia') {
      nueva.setDate(nueva.getDate() - 1);
    } else if (vista === 'ano') {
      nueva.setFullYear(nueva.getFullYear() - 1);
    }
    setFechaSeleccionada(nueva);
  };

  const handleSiguiente = () => {
    const nueva = new Date(fechaSeleccionada);
    if (vista === 'semana') {
      nueva.setDate(nueva.getDate() + 7);
    } else if (vista === 'mes') {
      nueva.setMonth(nueva.getMonth() + 1);
    } else if (vista === 'dia') {
      nueva.setDate(nueva.getDate() + 1);
    } else if (vista === 'ano') {
      nueva.setFullYear(nueva.getFullYear() + 1);
    }
    setFechaSeleccionada(nueva);
  };

  const handleIrAHoy = () => {
    setFechaSeleccionada(new Date());
  };

  // Filtrado de citas (Grupales e Individuales garantizadas)
  const citasFiltradas = useMemo(() => {
    return citas.filter((c) => {
      const esGrupal =
        c.esGrupal === true ||
        c.tipo === 'GRUPAL' ||
        c.estudianteId === 'GRUPAL' ||
        c.estudianteId === 'TODOS' ||
        (c.estudiantesIds && c.estudiantesIds.length > 1);

      const matchTipo =
        filtroTipo === 'TODAS' ||
        (filtroTipo === 'GRUPAL' && esGrupal) ||
        (filtroTipo === 'INDIVIDUAL' && !esGrupal);

      const matchModalidad = filtroModalidad === 'TODAS' || c.modalidad === filtroModalidad;

      const q = busqueda.toLowerCase().trim();
      const matchBusqueda =
        !q ||
        c.tema.toLowerCase().includes(q) ||
        (c.motivoDetalle && c.motivoDetalle.toLowerCase().includes(q)) ||
        (c.fecha && c.fecha.includes(q)) ||
        (c.lugar && c.lugar.toLowerCase().includes(q));

      return matchTipo && matchModalidad && matchBusqueda;
    });
  }, [citas, filtroTipo, filtroModalidad, busqueda]);

  // Citas por fecha
  const getCitasDeFecha = (d: Date): CitaAsesoria[] => {
    const iso = formatIsoDate(d);
    return citasFiltradas.filter((c) => (c.fecha || '').startsWith(iso));
  };

  // Abrir modal con fecha preseleccionada
  const handleAbrirAgendarParaFecha = (d: Date) => {
    const iso = formatIsoDate(d);
    setFechaForm(iso);
    setMensajeExito(null);
    setMensajeError(null);
    setModalAgendarAbierto(true);
  };

  // Generador de días de la semana activa (Lunes a Domingo)
  const diasSemanaActiva = useMemo(() => {
    const diaSemana = fechaSeleccionada.getDay();
    const diff = (diaSemana + 6) % 7; // Lunes = 0
    const lunes = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate());
    lunes.setDate(fechaSeleccionada.getDate() - diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }, [fechaSeleccionada]);

  // Generador de la cuadrícula del mes
  const diasMesActivo = useMemo(() => {
    const anio = fechaSeleccionada.getFullYear();
    const mes = fechaSeleccionada.getMonth();
    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);

    const diaSemanaPrimer = (primerDiaMes.getDay() + 6) % 7; // Lunes = 0
    const totalDias = ultimoDiaMes.getDate();

    const dias: { fecha: Date; esMesActual: boolean }[] = [];

    // Días del mes previo
    for (let i = diaSemanaPrimer - 1; i >= 0; i--) {
      const d = new Date(anio, mes, -i);
      dias.push({ fecha: d, esMesActual: false });
    }

    // Días del mes actual
    for (let i = 1; i <= totalDias; i++) {
      const d = new Date(anio, mes, i);
      dias.push({ fecha: d, esMesActual: true });
    }

    // Rellenar hasta completar múltiplos de 7
    const restantes = (7 - (dias.length % 7)) % 7;
    for (let i = 1; i <= restantes; i++) {
      const d = new Date(anio, mes + 1, i);
      dias.push({ fecha: d, esMesActual: false });
    }

    return dias;
  }, [fechaSeleccionada]);

  // Manejo de Agendar Sesión (Persistencia robusta)
  const handleAgendarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeExito(null);
    setMensajeError(null);

    if (tipoNuevaSesion === 'GRUPAL') {
      const participantes =
        rolActivo === 'TUTOR'
          ? estudiantesGrupalesSeleccionados
          : [estudianteActivo.id, ...estudiantesGrupalesSeleccionados.filter((id) => id !== estudianteActivo.id)];

      if (participantes.length === 0) {
        setMensajeError('Por favor selecciona al menos un estudiante para la sesión grupal.');
        setGuardando(false);
        return;
      }

      const payload: AgendarSesionGrupalPayload = {
        tutorId: tutorActivo.id,
        estudiantesIds: participantes,
        tema: tema.trim(),
        fecha: fechaForm,
        hora: horaForm,
        modalidad: modalidadForm,
        lugar: modalidadForm === 'Presencial' ? (lugarForm.trim() || 'Aula Magna de Tutorías UAT') : undefined,
        enlaceVirtual: modalidadForm === 'Virtual' ? (enlaceVirtualForm.trim() || 'https://meet.google.com/tutoria-grupal-uat') : undefined,
        motivoDetalle: motivoForm.trim()
      };

      const res = await tutoriaService.agendarSesionGrupal(payload);
      setGuardando(false);

      if (res.success) {
        setMensajeExito('Sesión grupal agendada con éxito y confirmada en la agenda institucional.');
        setTimeout(() => {
          setModalAgendarAbierto(false);
          setMensajeExito(null);
          setMotivoForm('');
        }, 1100);
        cargarCitas();
      } else {
        setMensajeError(res.message);
      }
    } else {
      // Individual (1 a 1)
      const payload: SolicitarAsesoriaPayload = {
        estudianteId: rolActivo === 'TUTOR' ? estudianteSeleccionadoId : estudianteActivo.id,
        tutorId: tutorActivo.id,
        tema: tema.trim(),
        fecha: fechaForm,
        hora: horaForm,
        modalidad: modalidadForm,
        lugar: modalidadForm === 'Presencial' ? (lugarForm.trim() || tutorActivo.cubículo || 'Cubículo del Tutor') : undefined,
        enlaceVirtual: modalidadForm === 'Virtual' ? (enlaceVirtualForm.trim() || 'https://meet.google.com/tutoria-individual-uat') : undefined,
        motivoDetalle: motivoForm.trim(),
        tipo: 'INDIVIDUAL'
      };

      const res = await tutoriaService.solicitarCitaComoAlumno(payload);
      setGuardando(false);

      if (res.success) {
        setMensajeExito('Asesoría individual agendada y confirmada en el calendario institucional.');
        setTimeout(() => {
          setModalAgendarAbierto(false);
          setMensajeExito(null);
          setMotivoForm('');
        }, 1100);
        cargarCitas();
      } else {
        setMensajeError(res.message);
      }
    }
  };

  // Respuesta de asistencia del alumno a sesión grupal (Interactiva y Real)
  const handleResponderSesionGrupal = async (citaId: string, respuesta: 'Confirmada' | 'Rechazada') => {
    const res = await tutoriaService.responderCitaGrupalComoAlumno(citaId, estudianteActivo.id, respuesta);
    if (res.success) {
      cargarCitas();
      if (citaSeleccionadaDetalle && citaSeleccionadaDetalle.id === citaId) {
        setCitaSeleccionadaDetalle(res.data || null);
      }
    }
  };

  // Editar participantes de sesión grupal existente (Tutor)
  const handleAbrirEditarParticipantes = (cita: CitaAsesoria) => {
    setCitaParaEditarParticipantes(cita);
    setParticipantesEdicionIds(cita.estudiantesIds || []);
    setModalEditarParticipantesAbierto(true);
  };

  const handleGuardarParticipantesEdicion = async () => {
    if (!citaParaEditarParticipantes) return;
    setGuardandoParticipantes(true);
    const res = await tutoriaService.actualizarParticipantesSesionGrupal(
      citaParaEditarParticipantes.id,
      participantesEdicionIds
    );
    setGuardandoParticipantes(false);
    if (res.success) {
      setModalEditarParticipantesAbierto(false);
      setCitaParaEditarParticipantes(null);
      if (citaSeleccionadaDetalle && citaSeleccionadaDetalle.id === citaParaEditarParticipantes.id) {
        setCitaSeleccionadaDetalle(res.data || null);
      }
      cargarCitas();
    }
  };

  // Cancelar Sesión
  const handlePedirCancelar = (cita: CitaAsesoria) => {
    setCitaACancelar(cita);
    setModalCancelarAbierto(true);
  };

  const handleConfirmarCancelar = async () => {
    if (!citaACancelar) return;
    if (rolActivo === 'TUTOR') {
      await tutoriaService.cancelarCitaComoTutor(citaACancelar.id);
    } else {
      await tutoriaService.cancelarCitaComoAlumno(citaACancelar.id);
    }
    setModalCancelarAbierto(false);
    setCitaACancelar(null);
    if (citaSeleccionadaDetalle && citaSeleccionadaDetalle.id === citaACancelar.id) {
      setCitaSeleccionadaDetalle(null);
    }
    cargarCitas();
  };

  // Colorimetría Oficial de Franjas de Eventos
  const getEstiloFranja = (cita: CitaAsesoria) => {
    const esCancelada = cita.estado === 'Cancelada';
    const esGrupal =
      cita.esGrupal === true ||
      cita.tipo === 'GRUPAL' ||
      cita.estudianteId === 'GRUPAL' ||
      cita.estudianteId === 'TODOS' ||
      (cita.estudiantesIds && cita.estudiantesIds.length > 1);
    const esVirtual = cita.modalidad === 'Virtual';

    if (esCancelada) {
      return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 line-through border-slate-300';
    }
    if (esGrupal) {
      // Naranja Institucional UAT para Talleres Grupales
      return 'bg-[#EE7402] text-white font-bold border-l-4 border-l-amber-200 border-[#BF5600] shadow-2xs hover:bg-[#D96200]';
    }
    if (esVirtual) {
      // Azul Institucional Google Meet
      return 'bg-[#0284C7] text-white font-bold border-l-4 border-l-sky-200 border-sky-800 shadow-2xs hover:bg-[#0369A1]';
    }
    // Asesoría Individual Presencial: Verde Institucional
    return 'bg-[#15803D] text-white font-bold border-l-4 border-l-emerald-200 border-emerald-800 shadow-2xs hover:bg-[#166534]';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. BARRA SUPERIOR INSTITUCIONAL UAT (BLOQUE MODERNO) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Barra superior de acento UAT */}
        <div className="h-1.5 bg-gradient-to-r from-[#EE7402] via-[#F59E0B] to-[#EE7402]" />

        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Lado Izquierdo: Identidad, Periodo y Navegación */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EE7402] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#EE7402]/10 text-[#EE7402] border border-[#EE7402]/20">
                    Ciclo Escolar UAT 2026
                  </span>
                  {isToday(fechaSeleccionada) && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#EE7402] text-white shadow-xs flex items-center gap-1 animate-in fade-in">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      HOY
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {rolActivo === 'TUTOR' ? tutorActivo.nombre : `Tutor: ${tutorActivo.nombre}`}
                  </span>
                </div>
                <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white capitalize tracking-tight">
                  {vista === 'semana' ? (
                    <>
                      Semana del {diasSemanaActiva[0].getDate()} de {MESES[diasSemanaActiva[0].getMonth()]} al{' '}
                      {diasSemanaActiva[6].getDate()} de {MESES[diasSemanaActiva[6].getMonth()]} {fechaSeleccionada.getFullYear()}
                    </>
                  ) : vista === 'mes' ? (
                    `${MESES[fechaSeleccionada.getMonth()]} ${fechaSeleccionada.getFullYear()}`
                  ) : vista === 'dia' ? (
                    `${DIAS_SEMANA_LARGOS[(fechaSeleccionada.getDay() + 6) % 7]}, ${fechaSeleccionada.getDate()} de ${MESES[fechaSeleccionada.getMonth()]} ${fechaSeleccionada.getFullYear()}`
                  ) : (
                    `Calendario Escolar UAT ${fechaSeleccionada.getFullYear()}`
                  )}
                </h2>
              </div>
            </div>

            {/* Controles de Navegación: Anterior / Hoy / Siguiente */}
            <div className="flex items-center gap-1.5 self-start sm:self-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={handleAnterior}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                title="Periodo anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleIrAHoy}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isToday(fechaSeleccionada)
                    ? 'bg-[#EE7402] text-white shadow-xs font-black ring-1 ring-white/50'
                    : 'text-slate-800 dark:text-white hover:bg-white dark:hover:bg-slate-700'
                }`}
                title={
                  isToday(fechaSeleccionada)
                    ? 'Visualizando el día de HOY'
                    : 'Restablecer e ir inmediatamente al día de HOY'
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isToday(fechaSeleccionada) ? 'bg-white animate-pulse' : 'bg-[#EE7402]'
                  }`}
                />
                <span>Hoy</span>
              </button>
              <button
                type="button"
                onClick={handleSiguiente}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                title="Periodo siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lado Derecho: Selector de Vistas + Exportar + Botón Agendar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* SELECTOR DE VISTAS (SEMANA POR DEFECTO, MES, DÍA, AÑO) */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setVista('semana')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  vista === 'semana'
                    ? 'bg-[#EE7402] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Semana</span>
              </button>

              <button
                type="button"
                onClick={() => setVista('mes')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  vista === 'mes'
                    ? 'bg-[#EE7402] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Mes</span>
              </button>

              <button
                type="button"
                onClick={() => setVista('dia')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  vista === 'dia'
                    ? 'bg-[#EE7402] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Día</span>
              </button>

              <button
                type="button"
                onClick={() => setVista('ano')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  vista === 'ano'
                    ? 'bg-[#EE7402] text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Año</span>
              </button>
            </div>

            {/* Menú Exportar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuExportarAbierto((prev) => !prev)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Exportar a Google Calendar o .ics"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-[#EE7402]" />
                <span className="hidden sm:inline">Exportar</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {menuExportarAbierto && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      const proxima = citasFiltradas.find((c) => c.estado !== 'Cancelada') || citasFiltradas[0];
                      if (proxima) {
                        const alumno = catalogoEstudiantes.find((e) => e.id === proxima.estudianteId) || estudianteActivo;
                        abrirGoogleCalendar(proxima, alumno.nombre, tutorActivo.nombre);
                      }
                      setMenuExportarAbierto(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <CalendarPlus className="w-4 h-4 text-[#EE7402]" />
                    <span>Añadir a Google Calendar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      descargarArchivoICS(citasFiltradas, 'calendario_tutoria_uat.ics', tutorActivo.nombre);
                      setMenuExportarAbierto(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                  >
                    <Download className="w-4 h-4 text-sky-500" />
                    <span>Descargar archivo .ics</span>
                  </button>
                </div>
              )}
            </div>

            {/* Botón Principal: Agendar Sesión */}
            <button
              type="button"
              onClick={() => {
                setFechaForm(formatIsoDate(new Date()));
                setModalAgendarAbierto(true);
              }}
              className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.01] cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Agendar Sesión</span>
            </button>
          </div>
        </div>

        {/* 2. BARRA DE FILTROS Y LEYENDA INSTITUCIONAL UAT (COLORIMETRÍA COMPLETA) */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Selectores de Tipo y Modalidad */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Filtrar:</span>
            <div className="inline-flex p-0.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setFiltroTipo('TODAS')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filtroTipo === 'TODAS' ? 'bg-[#EE7402] text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Todas ({citas.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('INDIVIDUAL')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filtroTipo === 'INDIVIDUAL' ? 'bg-[#EE7402] text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Individuales
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('GRUPAL')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filtroTipo === 'GRUPAL' ? 'bg-[#EE7402] text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Grupales
              </button>
            </div>

            <div className="inline-flex p-0.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setFiltroModalidad('TODAS')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filtroModalidad === 'TODAS' ? 'bg-slate-800 dark:bg-slate-700 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Todo formato
              </button>
              <button
                type="button"
                onClick={() => setFiltroModalidad('Presencial')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filtroModalidad === 'Presencial' ? 'bg-[#EE7402] text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Presencial
              </button>
              <button
                type="button"
                onClick={() => setFiltroModalidad('Virtual')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  filtroModalidad === 'Virtual' ? 'bg-[#0284C7] text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Virtual
              </button>
            </div>
          </div>

          {/* Leyenda Visual Oficial del Calendario Escolar UAT */}
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5" title="Día actual en curso">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EE7402] ring-2 ring-amber-300" />
              <span className="font-bold text-[#EE7402]">Hoy (Día en curso)</span>
            </span>
            <span className="flex items-center gap-1.5" title="Día seleccionado actualmente">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0F172A] ring-1 ring-[#EE7402]" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Seleccionado</span>
            </span>
            <span className="flex items-center gap-1.5" title="Días no laborables conforme al calendario oficial UAT">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-600" />
              <span className="font-semibold text-red-700 dark:text-red-400">Inhábil</span>
            </span>
            <span className="flex items-center gap-1.5" title="Receso de Semana Santa, Verano e Invierno">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
              <span className="font-semibold text-indigo-700 dark:text-indigo-400">Vacaciones</span>
            </span>
            <span className="flex items-center gap-1.5" title="Periodos de Exámenes Parciales y Ordinarios">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              <span className="font-semibold text-amber-700 dark:text-amber-400">Exámenes</span>
            </span>
            <span className="flex items-center gap-1.5" title="Talleres grupales organizados por el tutor">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EE7402]" />
              <span className="font-bold text-[#EE7402]">Taller Grupal</span>
            </span>
            <span className="flex items-center gap-1.5" title="Asesoría individual personalizada">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#15803D]" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Asesoría 1 a 1</span>
            </span>
            <span className="flex items-center gap-1.5" title="Sesión virtual por Google Meet institucional">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7]" />
              <span className="font-semibold text-sky-700 dark:text-sky-400">Virtual (Meet)</span>
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VISTA A: SEMANA (VISTA POR DEFECTO CON BLOQUES SÓLIDOS)  */}
      {/* ======================================================== */}
      {vista === 'semana' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Cabecera de 7 Columnas con Bloques Sólidos de Color */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-[#1E293B] text-white">
            {diasSemanaActiva.map((dia, idx) => {
              const esDiaHoy = isToday(dia);
              const esDiaSeleccionado = isSameDay(dia, fechaSeleccionada);
              const eventoUat = getEventoEscolarUat(formatIsoDate(dia));

              return (
                <button
                  key={dia.toISOString()}
                  type="button"
                  onClick={() => setFechaSeleccionada(dia)}
                  className={`p-3 text-center transition-all cursor-pointer border-r last:border-r-0 border-slate-700/60 relative ${
                    esDiaHoy && esDiaSeleccionado
                      ? 'bg-[#EE7402] text-white shadow-xl font-black ring-4 ring-amber-300 border-b-4 border-b-white z-20'
                      : esDiaHoy
                      ? 'bg-[#EE7402] text-white shadow-inner font-black ring-2 ring-[#EE7402] border-b-4 border-b-amber-300'
                      : esDiaSeleccionado
                      ? 'bg-[#0F172A] text-white font-black ring-3 ring-[#EE7402] border-b-4 border-b-[#EE7402] shadow-md z-10'
                      : 'bg-[#1E293B] text-slate-200 hover:bg-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`text-[11px] font-extrabold uppercase tracking-wider ${
                        esDiaHoy || esDiaSeleccionado ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {DIAS_SEMANA_CORTOS[idx]}
                    </span>
                    {esDiaHoy && esDiaSeleccionado ? (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-black/40 text-white leading-tight flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                        HOY
                      </span>
                    ) : esDiaHoy ? (
                      <span className="text-[9px] font-black uppercase px-1 rounded bg-black/30 text-white leading-tight">
                        HOY
                      </span>
                    ) : esDiaSeleccionado ? (
                      <span className="text-[9px] font-black uppercase px-1 rounded bg-[#EE7402] text-white leading-tight">
                        ACTIVO
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span
                      className={`text-lg font-heading font-black leading-none ${
                        esDiaHoy ? 'text-white underline decoration-2' : ''
                      }`}
                    >
                      {dia.getDate()}
                    </span>
                    {eventoUat && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          eventoUat.tipo === 'INHABIL'
                            ? 'bg-red-400'
                            : eventoUat.tipo === 'VACACIONES'
                            ? 'bg-indigo-300'
                            : 'bg-amber-300'
                        }`}
                        title={eventoUat.nombre}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cuadrícula de Contenido de la Semana con Franjas Horizontales */}
          <div className="grid grid-cols-7 min-h-[480px] divide-x divide-slate-200 dark:divide-slate-800">
            {diasSemanaActiva.map((dia) => {
              const iso = formatIsoDate(dia);
              const citasDia = getCitasDeFecha(dia);
              const esDiaHoy = isToday(dia);
              const esDiaSeleccionado = isSameDay(dia, fechaSeleccionada);
              const eventoUat = getEventoEscolarUat(iso);

              return (
                <div
                  key={dia.toISOString()}
                  onClick={() => setFechaSeleccionada(dia)}
                  className={`p-2 flex flex-col justify-between transition-all cursor-pointer relative ${
                    esDiaSeleccionado && esDiaHoy
                      ? 'ring-2 ring-inset ring-[#EE7402] bg-orange-100/30 dark:bg-orange-950/30 border-t-4 border-t-[#EE7402]'
                      : esDiaSeleccionado
                      ? 'ring-2 ring-inset ring-[#EE7402] bg-orange-50/40 dark:bg-orange-950/20 border-t-4 border-t-[#EE7402]'
                      : esDiaHoy
                      ? 'bg-[#EE7402]/5 dark:bg-[#EE7402]/10 border-t-4 border-t-amber-400'
                      : 'bg-transparent hover:bg-slate-50/40'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Badge de selección interactivo */}
                    {esDiaSeleccionado && (
                      <div className="flex items-center justify-between text-[10px] font-bold pb-1 border-b border-orange-200 dark:border-orange-900/60 text-[#EE7402]">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EE7402] animate-pulse" />
                          {esDiaHoy ? 'Hoy • Activo' : 'Seleccionado'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVista('dia');
                          }}
                          className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-[#EE7402] text-white hover:bg-[#D96200] transition-colors cursor-pointer"
                          title="Abrir agenda de este día"
                        >
                          Ver día &rarr;
                        </button>
                      </div>
                    )}
                    {!esDiaSeleccionado && esDiaHoy && (
                      <div className="text-[10px] font-bold pb-0.5 text-[#EE7402] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EE7402]" />
                        <span>Día en curso</span>
                      </div>
                    )}

                    {/* Indicador de Día Inhábil / Vacaciones / Exámenes */}
                    {eventoUat && (
                      <div
                        className={`p-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 shadow-2xs ${
                          eventoUat.tipo === 'INHABIL'
                            ? 'bg-red-600 text-white border-red-700'
                            : eventoUat.tipo === 'VACACIONES'
                            ? 'bg-indigo-600 text-white border-indigo-700'
                            : 'bg-amber-400 text-slate-950 border-amber-500'
                        }`}
                        title={eventoUat.descripcion || eventoUat.nombre}
                      >
                        {eventoUat.tipo === 'INHABIL' ? (
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                        ) : eventoUat.tipo === 'VACACIONES' ? (
                          <Sparkles className="w-3 h-3 shrink-0" />
                        ) : (
                          <Award className="w-3 h-3 shrink-0" />
                        )}
                        <span className="truncate leading-tight">{eventoUat.nombre}</span>
                      </div>
                    )}

                    {/* Franjas Horizontales de Sesiones */}
                    {citasDia.length > 0 ? (
                      citasDia.map((cita) => {
                        const estilo = getEstiloFranja(cita);
                        const esGrupal =
                          cita.esGrupal === true ||
                          cita.tipo === 'GRUPAL' ||
                          cita.estudianteId === 'GRUPAL' ||
                          cita.estudianteId === 'TODOS' ||
                          (cita.estudiantesIds && cita.estudiantesIds.length > 1);
                        const alumno = catalogoEstudiantes.find((e) => e.id === cita.estudianteId);

                        return (
                          <div
                            key={cita.id}
                            onClick={() => setCitaSeleccionadaDetalle(cita)}
                            className={`p-2 rounded-xl text-left transition-all cursor-pointer hover:scale-[1.02] border ${estilo}`}
                            title={`${cita.tema} - ${cita.hora} (${cita.modalidad})`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono mb-1 opacity-95">
                              <span className="font-extrabold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {cita.hora}
                              </span>
                              {cita.modalidad === 'Virtual' ? (
                                <Video className="w-3 h-3" />
                              ) : (
                                <MapPin className="w-3 h-3" />
                              )}
                            </div>

                            <p className="font-heading font-bold text-xs line-clamp-2 leading-tight">
                              {cita.tema}
                            </p>

                            <div className="mt-1.5 pt-1 border-t border-white/20 flex items-center justify-between text-[10px] opacity-95">
                              <span className="truncate max-w-[85px]">
                                {esGrupal ? 'Taller Grupal' : alumno?.nombre?.split(' ')[0] || 'Tutorado'}
                              </span>
                              <span className="font-black shrink-0">
                                {esGrupal ? `(${cita.estudiantesIds?.length || 1})` : 'Confirmada'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      !eventoUat && (
                        <div className="py-8 text-center text-[11px] text-slate-400">
                          Sin citas
                        </div>
                      )
                    )}
                  </div>

                  {/* Botón rápido para programar en este día */}
                  <button
                    type="button"
                    onClick={() => handleAbrirAgendarParaFecha(dia)}
                    className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#EE7402] hover:border-[#EE7402] hover:bg-[#EE7402]/5 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Agendar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA B: MES COMPLETO (CUADRÍCULA CLÁSICA INSTITUCIONAL) */}
      {/* ======================================================== */}
      {vista === 'mes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Encabezado sólido de días en Naranja UAT */}
          <div className="grid grid-cols-7 bg-[#EE7402] text-white text-center font-heading font-bold text-xs uppercase tracking-wider py-2.5">
            {DIAS_SEMANA_CORTOS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 auto-rows-fr border-b border-slate-200 dark:border-slate-800 divide-x divide-y divide-slate-200 dark:border-slate-800">
            {diasMesActivo.map(({ fecha, esMesActual }) => {
              const iso = formatIsoDate(fecha);
              const citasDia = getCitasDeFecha(fecha);
              const esDiaHoy = isToday(fecha);
              const esSeleccionado = isSameDay(fecha, fechaSeleccionada);
              const eventoUat = getEventoEscolarUat(iso);

              return (
                <div
                  key={fecha.toISOString()}
                  onClick={() => setFechaSeleccionada(fecha)}
                  className={`min-h-[115px] p-2 flex flex-col justify-between transition-all cursor-pointer relative ${
                    !esMesActual
                      ? 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 opacity-60'
                      : esSeleccionado && esDiaHoy
                      ? 'ring-4 ring-[#EE7402] border-2 border-[#BF5600] bg-orange-100/90 dark:bg-orange-950/60 shadow-xl scale-[1.02] z-20'
                      : esSeleccionado
                      ? 'ring-4 ring-[#EE7402] border-2 border-[#EE7402] bg-orange-50/80 dark:bg-orange-950/50 shadow-lg scale-[1.02] z-20'
                      : esDiaHoy
                      ? 'border-2 border-[#EE7402] bg-orange-50/60 dark:bg-orange-950/20 shadow-xs'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {/* Encabezado del número de día */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs w-6 h-6 rounded-full flex items-center justify-center ${
                          esDiaHoy
                            ? 'bg-[#EE7402] text-white shadow-xs font-black ring-2 ring-white/70'
                            : esSeleccionado
                            ? 'bg-[#0F172A] text-white font-black ring-2 ring-[#EE7402]'
                            : 'text-slate-800 dark:text-slate-200 font-bold'
                        }`}
                      >
                        {fecha.getDate()}
                      </span>

                      {esDiaHoy && esSeleccionado ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#EE7402] text-white leading-tight flex items-center gap-1 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          HOY • ACTIVO
                        </span>
                      ) : esDiaHoy ? (
                        <span className="text-[9px] font-black uppercase px-1 rounded bg-[#EE7402] text-white leading-tight">
                          HOY
                        </span>
                      ) : esSeleccionado ? (
                        <span className="text-[9px] font-black uppercase px-1 rounded bg-[#EE7402] text-white leading-tight">
                          ACTIVO
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1">
                      {citasDia.length > 0 && (
                        <span className="text-[10px] font-black text-[#EE7402] px-1.5 py-0.2 rounded-full bg-[#EE7402]/10 border border-[#EE7402]/20">
                          {citasDia.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Banner de Evento Escolar UAT */}
                  {eventoUat && (
                    <div
                      className={`mb-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold truncate ${
                        eventoUat.tipo === 'INHABIL'
                          ? 'bg-red-600 text-white'
                          : eventoUat.tipo === 'VACACIONES'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                      title={eventoUat.descripcion || eventoUat.nombre}
                    >
                      {eventoUat.nombre}
                    </div>
                  )}

                  {/* Franjas Sólidas Horizontales de Eventos */}
                  <div className="space-y-1 my-auto">
                    {citasDia.slice(0, 2).map((cita) => {
                      const estilo = getEstiloFranja(cita);
                      return (
                        <div
                          key={cita.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCitaSeleccionadaDetalle(cita);
                          }}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-bold truncate cursor-pointer transition-transform hover:scale-[1.02] flex items-center justify-between gap-1 border ${estilo}`}
                          title={`${cita.tema} - ${cita.hora}`}
                        >
                          <span className="truncate">{cita.tema}</span>
                          <span className="font-mono text-[9px] shrink-0 opacity-90">{cita.hora}</span>
                        </div>
                      );
                    })}
                    {citasDia.length > 2 && (
                      <span className="text-[10px] font-bold text-slate-500 block text-right pr-1">
                        +{citasDia.length - 2} más
                      </span>
                    )}
                  </div>

                  {/* Acción rápida de agendar */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirAgendarParaFecha(fecha);
                      }}
                      className="text-[10px] text-slate-400 hover:text-[#EE7402] flex items-center gap-0.5 cursor-pointer"
                      title="Agendar en esta fecha"
                    >
                      <PlusCircle className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PANEL INFORMATIVO Y RESUMEN DEL DÍA SELECCIONADO (TEXTO COMPLETO Y LEGIBLE) */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-3 h-3 rounded-full bg-[#EE7402]" />
                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Día Seleccionado:{' '}
                  <span className="text-[#EE7402]">
                    {DIAS_SEMANA_LARGOS[(fechaSeleccionada.getDay() + 6) % 7]}, {fechaSeleccionada.getDate()} de {MESES[fechaSeleccionada.getMonth()]} de {fechaSeleccionada.getFullYear()}
                  </span>
                </h3>
                {isToday(fechaSeleccionada) ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#EE7402] text-white shadow-2xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    HOY (DÍA EN CURSO)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleIrAHoy}
                    className="text-[11px] font-bold text-[#EE7402] hover:underline cursor-pointer ml-1"
                  >
                    &bull; Ir al día de Hoy
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setVista('dia')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Ver agenda completa de este día en la vista de Día"
                >
                  <Clock className="w-3.5 h-3.5 text-[#EE7402]" />
                  <span>Ver en Detalle (Día)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAbrirAgendarParaFecha(fechaSeleccionada)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#EE7402] hover:bg-[#D96200] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Agendar para este día</span>
                </button>
              </div>
            </div>

            {/* Aviso Completo si es Inhábil o Periodo de Examen */}
            {(() => {
              const ev = getEventoEscolarUat(formatIsoDate(fechaSeleccionada));
              if (!ev) return null;
              return (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-2xs ${
                    ev.tipo === 'INHABIL'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200'
                      : ev.tipo === 'VACACIONES'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white mt-0.5 ${
                      ev.tipo === 'INHABIL' ? 'bg-red-600' : ev.tipo === 'VACACIONES' ? 'bg-indigo-600' : 'bg-amber-500 text-slate-950 font-bold'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-80">
                      Calendario Escolar UAT 2026 &bull; {ev.tipo === 'INHABIL' ? 'Día Inhábil Oficial' : ev.tipo === 'VACACIONES' ? 'Receso Vacacional Institucional' : 'Periodo de Evaluación'}
                    </span>
                    <h4 className="font-heading font-bold text-sm">{ev.nombre}</h4>
                    <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                      {ev.descripcion || 'Suspensión oficial de actividades escolares y administrativas conforme al calendario institucional UAT.'}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Lista Completa de Sesiones sin recortes */}
            <div className="space-y-2">
              {getCitasDeFecha(fechaSeleccionada).length > 0 ? (
                getCitasDeFecha(fechaSeleccionada).map((cita) => {
                  const esGrupal =
                    cita.esGrupal === true ||
                    cita.tipo === 'GRUPAL' ||
                    cita.estudianteId === 'GRUPAL' ||
                    cita.estudianteId === 'TODOS' ||
                    (cita.estudiantesIds && cita.estudiantesIds.length > 1);
                  const alumno = catalogoEstudiantes.find((e) => e.id === cita.estudianteId);

                  return (
                    <div
                      key={cita.id}
                      onClick={() => setCitaSeleccionadaDetalle(cita)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#EE7402] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`px-2.5 py-1.5 rounded-lg text-center shrink-0 border ${getEstiloFranja(cita)}`}
                        >
                          <span className="block font-mono text-xs font-black">{cita.hora}</span>
                          <span className="block text-[9px] uppercase font-bold">{cita.modalidad}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                esGrupal
                                  ? 'bg-orange-100 text-[#EE7402] dark:bg-orange-950 dark:text-orange-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {esGrupal ? `Taller Grupal (${cita.estudiantesIds?.length || 1} participantes)` : 'Asesoría Individual'}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">{cita.estado}</span>
                          </div>
                          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                            {cita.tema}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                            {cita.modalidad === 'Virtual' ? (
                              <>
                                <Video className="w-3.5 h-3.5 text-sky-500" />
                                <span>Google Meet</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3.5 h-3.5 text-[#EE7402]" />
                                <span>{cita.lugar || tutorActivo.cubículo || 'Aula Magna'}</span>
                              </>
                            )}
                            <span>&bull;</span>
                            <span>{esGrupal ? 'Múltiples alumnos' : alumno?.nombre || 'Tutorado'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCitaSeleccionadaDetalle(cita);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  No hay sesiones de tutoría programadas para esta fecha.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA C: DÍA DETALLADO (LÍNEA TEMPORAL VISUAL)           */}
      {/* ======================================================== */}
      {vista === 'dia' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
          {/* Alerta de Calendario UAT si el día es Inhábil o Vacacional */}
          {(() => {
            const ev = getEventoEscolarUat(formatIsoDate(fechaSeleccionada));
            if (!ev) return null;
            return (
              <div
                className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                  ev.tipo === 'INHABIL'
                    ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200'
                    : ev.tipo === 'VACACIONES'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-200'
                    : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white ${
                    ev.tipo === 'INHABIL' ? 'bg-red-600' : ev.tipo === 'VACACIONES' ? 'bg-indigo-600' : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-80">
                    Calendario Oficial UAT &bull; {ev.tipo === 'INHABIL' ? 'Día Inhábil Oficial' : ev.tipo === 'VACACIONES' ? 'Receso Vacacional Institucional' : 'Periodo de Evaluación'}
                  </span>
                  <h4 className="font-heading font-bold text-sm">{ev.nombre}</h4>
                  {ev.descripcion && <p className="text-xs opacity-90 mt-0.5">{ev.descripcion}</p>}
                </div>
              </div>
            );
          })()}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Agenda del {DIAS_SEMANA_LARGOS[(fechaSeleccionada.getDay() + 6) % 7]}, {fechaSeleccionada.getDate()} de {MESES[fechaSeleccionada.getMonth()]} de {fechaSeleccionada.getFullYear()}
                </h3>
                {isToday(fechaSeleccionada) ? (
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#EE7402] text-white shadow-2xs flex items-center gap-1.5 animate-in fade-in">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    HOY (DÍA EN CURSO)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleIrAHoy}
                    className="text-xs font-bold text-[#EE7402] hover:underline cursor-pointer flex items-center gap-1 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-200 dark:border-orange-900"
                    title="Volver a la fecha de hoy"
                  >
                    <span>Ir a Hoy</span>
                    &rarr;
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {getCitasDeFecha(fechaSeleccionada).length} sesiones programadas para esta fecha
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setVista('semana')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Volver a la vista de Semana"
              >
                <CalendarRange className="w-3.5 h-3.5 text-[#EE7402]" />
                <span>Ver Semana</span>
              </button>
              <button
                type="button"
                onClick={() => handleAbrirAgendarParaFecha(fechaSeleccionada)}
                className="px-3.5 py-1.5 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Programar Cita</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {getCitasDeFecha(fechaSeleccionada).length > 0 ? (
              getCitasDeFecha(fechaSeleccionada).map((cita) => {
                const esGrupal =
                  cita.esGrupal === true ||
                  cita.tipo === 'GRUPAL' ||
                  cita.estudianteId === 'GRUPAL' ||
                  cita.estudianteId === 'TODOS' ||
                  (cita.estudiantesIds && cita.estudiantesIds.length > 1);
                const estilo = getEstiloFranja(cita);
                const alumno = catalogoEstudiantes.find((e) => e.id === cita.estudianteId);
                const alumnoConfirmacion = cita.confirmaciones ? cita.confirmaciones[estudianteActivo.id] : undefined;

                return (
                  <div
                    key={cita.id}
                    onClick={() => setCitaSeleccionadaDetalle(cita)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#EE7402] transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40 hover:shadow-xs"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`px-3 py-2 rounded-xl text-center shrink-0 border ${estilo}`}>
                        <span className="block font-mono text-xs font-extrabold leading-tight">{cita.hora}</span>
                        <span className="block text-[10px] uppercase font-semibold">{cita.modalidad}</span>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              esGrupal
                                ? 'bg-[#EE7402]/15 text-[#EE7402] border-[#EE7402]/30'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {esGrupal ? `Taller Grupal (${cita.estudiantesIds?.length || 1} alumnos)` : 'Asesoría Individual'}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">
                            {cita.estado}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {cita.tema}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          {cita.modalidad === 'Virtual' ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-sky-500" />
                              <span>Google Meet UAT</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5 text-[#EE7402]" />
                              <span>{cita.lugar || (esGrupal ? 'Aula Magna' : tutorActivo.cubículo)}</span>
                            </>
                          )}
                          <span>&bull;</span>
                          <span>{esGrupal ? 'Taller de Grupo' : alumno?.nombre || 'Tutorado'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Confirmación activa e interactiva del alumno en grupales */}
                      {rolActivo === 'ALUMNO' && esGrupal && alumnoConfirmacion === 'Pendiente' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResponderSesionGrupal(cita.id, 'Confirmada');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResponderSesionGrupal(cita.id, 'Rechazada');
                            }}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Declinar</span>
                          </button>
                        </div>
                      )}

                      {cita.modalidad === 'Virtual' && cita.enlaceVirtual && (
                        <a
                          href={cita.enlaceVirtual}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Meet</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCitaSeleccionadaDetalle(cita);
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Detalles
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200">
                  No hay sesiones para este día
                </h4>
                <p className="text-xs text-slate-500">
                  Aprovecha este horario libre o programa una asesoría usando el botón superior.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA D: AÑO COMPLETO (12 MESES CON COLORIMETRÍA UAT)     */}
      {/* ======================================================== */}
      {vista === 'ano' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>Panorama del Calendario Escolar UAT {fechaSeleccionada.getFullYear()}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EE7402]/10 text-[#EE7402] border border-[#EE7402]/20 font-bold">
                  Periodos 2026-1 & 2026-3
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Los 12 meses destacan periodos de clases, días inhábiles, recesos vacacionales y talleres de tutoría. Haz clic en cualquier mes o día para navegar.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="px-3 py-1 rounded-xl bg-orange-50 text-[#EE7402] border border-orange-200 dark:bg-orange-950/40 dark:border-orange-900">
                {citasFiltradas.length} Sesiones Registradas
              </span>
            </div>
          </div>

          {/* Cuadrícula de 12 Meses en Miniatura con Colorimetría Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MESES.map((nombreMes, mesIndex) => {
              const anio = fechaSeleccionada.getFullYear();
              const primerDia = new Date(anio, mesIndex, 1);
              const ultimoDia = new Date(anio, mesIndex + 1, 0);
              const diasMes: Date[] = [];
              for (let d = 1; d <= ultimoDia.getDate(); d++) {
                diasMes.push(new Date(anio, mesIndex, d));
              }

              // Conteo de citas en este mes
              const citasMes = citasFiltradas.filter((c) => {
                if (!c.fecha) return false;
                const [y, m] = c.fecha.split('-');
                return Number(y) === anio && Number(m) === mesIndex + 1;
              });

              // Eventos escolares UAT destacados en este mes
              const eventosDelMes = EVENTOS_CALENDARIO_UAT_2026.filter((ev) => {
                const [yI, mI] = ev.fechaInicio.split('-');
                const [yF, mF] = ev.fechaFin.split('-');
                return (
                  (Number(yI) === anio && Number(mI) === mesIndex + 1) ||
                  (Number(yF) === anio && Number(mF) === mesIndex + 1)
                );
              });

              return (
                <div
                  key={nombreMes}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/30 dark:bg-slate-950/40 hover:border-[#EE7402] transition-all flex flex-col justify-between"
                >
                  {/* Encabezado del Mes */}
                  <div
                    onClick={() => {
                      const nueva = new Date(fechaSeleccionada);
                      nueva.setMonth(mesIndex);
                      setFechaSeleccionada(nueva);
                      setVista('mes');
                    }}
                    className="p-3 bg-[#1E293B] text-white flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-heading font-bold text-xs uppercase tracking-wider">
                      {nombreMes}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {citasMes.length > 0 && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#EE7402] text-white">
                          {citasMes.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuadrícula de días del mes */}
                  <div className="p-3">
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-1">
                      {DIAS_SEMANA_CORTOS.map((d) => (
                        <span key={d} className="text-slate-400 font-bold text-[9px]">
                          {d[0]}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                      {Array.from({ length: (primerDia.getDay() + 6) % 7 }).map((_, i) => (
                        <span key={i} />
                      ))}
                      {diasMes.map((dia) => {
                        const iso = formatIsoDate(dia);
                        const citasDia = getCitasDeFecha(dia);
                        const tieneCitas = citasDia.length > 0;
                        const esGrupal = tieneCitas && citasDia.some((c) => c.esGrupal || c.tipo === 'GRUPAL');
                        const esDiaHoy = isToday(dia);
                        const esSeleccionado = isSameDay(dia, fechaSeleccionada);
                        const eventoUat = getEventoEscolarUat(iso);

                        let colorClase = 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60';

                        if (esDiaHoy && esSeleccionado) {
                          colorClase = 'bg-[#EE7402] text-white font-black shadow-md ring-3 ring-amber-300 scale-115 z-20';
                        } else if (esDiaHoy) {
                          colorClase = 'bg-[#EE7402] text-white font-black shadow-xs ring-2 ring-white scale-105 z-10';
                        } else if (esSeleccionado) {
                          colorClase = 'bg-[#0F172A] text-white font-black ring-2 ring-[#EE7402] shadow-xs scale-110 z-10';
                        } else if (tieneCitas) {
                          colorClase = esGrupal
                            ? 'bg-[#EE7402] text-white font-bold shadow-2xs'
                            : 'bg-[#15803D] text-white font-bold shadow-2xs';
                        } else if (eventoUat?.tipo === 'INHABIL') {
                          colorClase = 'bg-red-600 text-white font-bold';
                        } else if (eventoUat?.tipo === 'VACACIONES') {
                          colorClase = 'bg-indigo-600 text-white font-semibold';
                        } else if (eventoUat?.tipo === 'EXAMENES') {
                          colorClase = 'bg-amber-400 text-slate-950 font-bold';
                        }

                        return (
                          <button
                            key={dia.toISOString()}
                            type="button"
                            onClick={() => {
                              setFechaSeleccionada(dia);
                              setVista('dia');
                            }}
                            className={`w-5 h-5 mx-auto rounded-md flex items-center justify-center font-medium transition-all hover:scale-125 cursor-pointer text-[10px] relative ${colorClase}`}
                            title={
                              esDiaHoy
                                ? `¡HOY! ${dia.getDate()} de ${nombreMes}`
                                : eventoUat
                                ? `${eventoUat.nombre} (${dia.getDate()} de ${nombreMes})`
                                : tieneCitas
                                ? `${citasDia.length} sesión(es) de tutoría (${dia.getDate()} de ${nombreMes})`
                                : `${dia.getDate()} de ${nombreMes}`
                            }
                          >
                            {dia.getDate()}
                            {esDiaHoy && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-300 rounded-full ring-1 ring-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resumen de Hitos UAT del Mes */}
                  {eventosDelMes.length > 0 && (
                    <div className="px-3 py-1.5 bg-slate-100/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[9px] font-semibold text-slate-600 dark:text-slate-400 truncate">
                      {eventosDelMes.map((e) => e.nombre).join(' • ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Panel contextual de fecha seleccionada en Vista Año */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EE7402] text-white flex items-center justify-center font-bold shrink-0">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Fecha Seleccionada:</span>
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>
                    {DIAS_SEMANA_LARGOS[(fechaSeleccionada.getDay() + 6) % 7]}, {fechaSeleccionada.getDate()} de {MESES[fechaSeleccionada.getMonth()]} de {fechaSeleccionada.getFullYear()}
                  </span>
                  {isToday(fechaSeleccionada) && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#EE7402] text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      HOY
                    </span>
                  )}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleIrAHoy}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Ir a Hoy
              </button>
              <button
                type="button"
                onClick={() => setVista('semana')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-bold hover:bg-slate-900 transition-colors cursor-pointer flex items-center gap-1"
              >
                <CalendarRange className="w-3.5 h-3.5 text-[#EE7402]" />
                <span>Ver en Semana</span>
              </button>
              <button
                type="button"
                onClick={() => setVista('dia')}
                className="px-3.5 py-1.5 rounded-lg bg-[#EE7402] hover:bg-[#D96200] text-white font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Ver en Detalle (Día)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETALLE COMPLETO DE CITA AL HACER CLIC             */}
      {/* ======================================================== */}
      {citaSeleccionadaDetalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCitaSeleccionadaDetalle(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Cabecera con Bloque de Color Institucional UAT */}
            <div className="p-5 bg-gradient-to-r from-[#EE7402] to-[#D96200] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    {citaSeleccionadaDetalle.esGrupal ||
                    citaSeleccionadaDetalle.tipo === 'GRUPAL' ||
                    citaSeleccionadaDetalle.estudianteId === 'GRUPAL'
                      ? 'Taller Grupal Institucional'
                      : 'Asesoría Individual 1 a 1'}
                  </span>
                  <h3 className="font-heading font-bold text-base text-white mt-0.5">
                    Detalle de la Sesión de Tutoría
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCitaSeleccionadaDetalle(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Tema Principal */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Tema / Asunto:</span>
                <p className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {citaSeleccionadaDetalle.tema}
                </p>
                {citaSeleccionadaDetalle.motivoDetalle && (
                  <p className="text-xs text-slate-500 mt-1">
                    {citaSeleccionadaDetalle.motivoDetalle}
                  </p>
                )}
              </div>

              {/* Fecha, Hora y Modalidad */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Fecha y Hora:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#EE7402]" />
                    <span>{citaSeleccionadaDetalle.fecha} &bull; {citaSeleccionadaDetalle.hora}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Modalidad y Lugar:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                    {citaSeleccionadaDetalle.modalidad === 'Virtual' ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-sky-500" />
                        <span>Google Meet</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-[#EE7402]" />
                        <span className="truncate">{citaSeleccionadaDetalle.lugar || 'Aula Magna UAT'}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Participantes */}
              {citaSeleccionadaDetalle.esGrupal ||
              citaSeleccionadaDetalle.tipo === 'GRUPAL' ||
              citaSeleccionadaDetalle.estudianteId === 'GRUPAL' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Tutorados Convocados ({citaSeleccionadaDetalle.estudiantesIds?.length || 0}):
                    </span>
                    {rolActivo === 'TUTOR' && (
                      <button
                        type="button"
                        onClick={() => handleAbrirEditarParticipantes(citaSeleccionadaDetalle)}
                        className="text-[#EE7402] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Modificar lista</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl p-2 bg-slate-50 dark:bg-slate-950">
                    {(citaSeleccionadaDetalle.estudiantesIds || []).map((id) => {
                      const est = catalogoEstudiantes.find((e) => e.id === id);
                      const conf = citaSeleccionadaDetalle.confirmaciones
                        ? citaSeleccionadaDetalle.confirmaciones[id]
                        : 'Confirmada';
                      return (
                        <div key={id} className="py-1.5 flex items-center justify-between">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{est?.nombre || id}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              conf === 'Confirmada'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : conf === 'Rechazada'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {conf || 'Confirmada'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Participante:</span>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#EE7402]" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {catalogoEstudiantes.find((e) => e.id === citaSeleccionadaDetalle.estudianteId)?.nombre ||
                        'Alumno Asignado'}
                    </span>
                  </div>
                </div>
              )}

              {/* Botón de Google Meet si es virtual */}
              {citaSeleccionadaDetalle.modalidad === 'Virtual' && citaSeleccionadaDetalle.enlaceVirtual && (
                <a
                  href={citaSeleccionadaDetalle.enlaceVirtual}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Unirse a Google Meet</span>
                </a>
              )}

              {/* Respuesta interactiva del alumno en sesión grupal */}
              {rolActivo === 'ALUMNO' &&
                (citaSeleccionadaDetalle.esGrupal ||
                  citaSeleccionadaDetalle.tipo === 'GRUPAL' ||
                  citaSeleccionadaDetalle.estudianteId === 'GRUPAL') && (
                  <div className="p-3 rounded-xl bg-orange-50/70 dark:bg-slate-800 border border-orange-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Tu Asistencia:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleResponderSesionGrupal(citaSeleccionadaDetalle.id, 'Confirmada')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResponderSesionGrupal(citaSeleccionadaDetalle.id, 'Rechazada')}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Declinar</span>
                      </button>
                    </div>
                  </div>
                )}

              {/* Acciones del pie */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    abrirGoogleCalendar(
                      citaSeleccionadaDetalle,
                      citaSeleccionadaDetalle.esGrupal ? 'Taller Grupal UAT' : 'Asesoría',
                      tutorActivo.nombre
                    )
                  }
                  className="text-[#EE7402] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Google Cal</span>
                </button>

                {citaSeleccionadaDetalle.estado !== 'Cancelada' && (
                  <button
                    type="button"
                    onClick={() => handlePedirCancelar(citaSeleccionadaDetalle)}
                    className="text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Cancelar Sesión
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL AGENDAR SESIÓN CON SELECTOR DE TIPO INTUITIVO      */}
      {/* ======================================================== */}
      {modalAgendarAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAgendarAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Cabecera del Modal con Bloque Institucional */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#EE7402] to-[#D96200] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <PlusCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-white">
                    Programar Sesión de Tutoría
                  </h3>
                  <p className="text-xs text-white/80">
                    {rolActivo === 'TUTOR' ? `Organiza: ${tutorActivo.nombre}` : `Con: ${tutorActivo.nombre}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAgendarAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAgendarSesion} className="p-5 space-y-4 overflow-y-auto">
              {mensajeExito && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{mensajeExito}</span>
                </div>
              )}

              {mensajeError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2 font-semibold">
                  <X className="w-4 h-4 text-rose-600" />
                  <span>{mensajeError}</span>
                </div>
              )}

              {/* SELECTOR DE TIPO (PESTAÑAS DESTACADAS) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Modalidad de Convocatoria:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTipoNuevaSesion('INDIVIDUAL')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      tipoNuevaSesion === 'INDIVIDUAL'
                        ? 'border-[#EE7402] bg-orange-50/70 dark:bg-orange-950/20 shadow-xs ring-1 ring-[#EE7402]'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        tipoNuevaSesion === 'INDIVIDUAL' ? 'bg-[#EE7402] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-heading font-bold text-xs block text-slate-900 dark:text-white">
                        Individual (1 a 1)
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        Asesoría personalizada
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoNuevaSesion('GRUPAL')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      tipoNuevaSesion === 'GRUPAL'
                        ? 'border-[#EE7402] bg-orange-50/70 dark:bg-orange-950/20 shadow-xs ring-1 ring-[#EE7402]'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        tipoNuevaSesion === 'GRUPAL' ? 'bg-[#EE7402] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-heading font-bold text-xs block text-slate-900 dark:text-white">
                        Grupal (Taller)
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        Taller con múltiples tutorados
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* SI ES INDIVIDUAL: MOSTRAR SELECTOR DEL ALUMNO ÚNICO */}
              {tipoNuevaSesion === 'INDIVIDUAL' && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {rolActivo === 'TUTOR' ? 'Alumno Tutorado:' : 'Tutor Asignado:'}
                  </label>
                  {rolActivo === 'TUTOR' ? (
                    <select
                      value={estudianteSeleccionadoId}
                      onChange={(e) => setEstudianteSeleccionadoId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium"
                    >
                      {catalogoEstudiantes.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.nombre} — Matrícula: {est.matricula} ({est.carrera})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {tutorActivo.nombre} ({tutorActivo.departamento})
                    </p>
                  )}
                </div>
              )}

              {/* SI ES GRUPAL: LISTADO DINÁMICO DE SELECCIÓN MÚLTIPLE */}
              {tipoNuevaSesion === 'GRUPAL' && (
                <div className="p-3.5 rounded-xl bg-orange-50/40 dark:bg-slate-950 border border-orange-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Tutorados Convocados ({estudiantesGrupalesSeleccionados.length}):</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setEstudiantesGrupalesSeleccionados(catalogoEstudiantes.map((e) => e.id))}
                        className="text-[#EE7402] hover:underline cursor-pointer"
                      >
                        Todos
                      </button>
                      <span className="text-slate-300">&bull;</span>
                      <button
                        type="button"
                        onClick={() => setEstudiantesGrupalesSeleccionados([])}
                        className="text-slate-500 hover:underline cursor-pointer"
                      >
                        Ninguno
                      </button>
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 space-y-1">
                    {catalogoEstudiantes.map((est) => {
                      const sel = estudiantesGrupalesSeleccionados.includes(est.id);
                      return (
                        <label
                          key={est.id}
                          className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => {
                                setEstudiantesGrupalesSeleccionados((prev) =>
                                  prev.includes(est.id) ? prev.filter((id) => id !== est.id) : [...prev, est.id]
                                );
                              }}
                              className="rounded text-[#EE7402] accent-[#EE7402]"
                            />
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {est.nombre} ({est.matricula})
                            </span>
                          </div>
                          {sel && <span className="text-[10px] font-bold text-emerald-600">Convocado</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tema */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tema o Motivo de la Sesión *
                </label>
                <input
                  type="text"
                  required
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ej. Taller de Hábitos de Estudio / Asesoría de Álgebra"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaForm}
                    onChange={(e) => setFechaForm(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hora *
                  </label>
                  <input
                    type="text"
                    required
                    value={horaForm}
                    onChange={(e) => setHoraForm(e.target.value)}
                    placeholder="Ej. 11:00 AM"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Modalidad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Modalidad:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalidadForm('Presencial')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      modalidadForm === 'Presencial'
                        ? 'border-[#EE7402] bg-[#EE7402]/10 text-[#EE7402]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Presencial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidadForm('Virtual')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      modalidadForm === 'Virtual'
                        ? 'border-[#0284C7] bg-sky-50 text-[#0284C7]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Virtual (Meet)</span>
                  </button>
                </div>
              </div>

              {/* Lugar o Meet Link */}
              {modalidadForm === 'Presencial' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Aula o Cubículo:
                  </label>
                  <input
                    type="text"
                    value={lugarForm}
                    onChange={(e) => setLugarForm(e.target.value)}
                    placeholder={tipoNuevaSesion === 'GRUPAL' ? 'Aula Magna de Tutorías UAT' : 'Cubículo del Tutor'}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enlace de Google Meet:
                  </label>
                  <input
                    type="url"
                    value={enlaceVirtualForm}
                    onChange={(e) => setEnlaceVirtualForm(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs"
                  />
                </div>
              )}

              {/* Botones del Modal */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAgendarAbierto(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {guardando ? 'Guardando...' : tipoNuevaSesion === 'GRUPAL' ? 'Convocar Taller' : 'Agendar Sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICAR PARTICIPANTES GRUPALES (TUTOR) */}
      {modalEditarParticipantesAbierto && citaParaEditarParticipantes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#EE7402]" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Modificar Participantes del Taller
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarParticipantesAbierto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto border rounded-xl p-2 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-950">
              {catalogoEstudiantes.map((est) => {
                const sel = participantesEdicionIds.includes(est.id);
                return (
                  <label key={est.id} className="flex items-center justify-between p-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => {
                          setParticipantesEdicionIds((prev) =>
                            prev.includes(est.id) ? prev.filter((id) => id !== est.id) : [...prev, est.id]
                          );
                        }}
                        className="rounded text-[#EE7402] accent-[#EE7402]"
                      />
                      <span className="text-xs font-semibold">{est.nombre}</span>
                    </div>
                    {sel && <span className="text-[10px] font-bold text-emerald-600">Incluido</span>}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setModalEditarParticipantesAbierto(false)}
                className="px-3 py-1.5 text-xs text-slate-500 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoParticipantes}
                onClick={handleGuardarParticipantesEdicion}
                className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {guardandoParticipantes ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR CANCELACIÓN */}
      {modalCancelarAbierto && citaACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                ¿Cancelar esta sesión?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La cita cambiará a estado Cancelada y el horario quedará liberado en la agenda institucional.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalCancelarAbierto(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Mantener Cita
              </button>
              <button
                type="button"
                onClick={handleConfirmarCancelar}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
