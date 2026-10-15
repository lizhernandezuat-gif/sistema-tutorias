import React, { useState, useEffect, useMemo } from 'react';
import {
  Tutor,
  EstudianteCatalogo,
  CitaAsesoria,
  RolSimulado,
  SolicitarAsesoriaPayload,
  AgendarSesionGrupalPayload,
  DisponibilidadTutor,
  PropuestaHorario,
  BloqueDisponibilidad,
  NotaSeguimiento
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
  AlertCircle,
  Inbox,
  Send,
  BookmarkCheck,
  Sliders,
  Trash2
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
  const [erroresAgendar, setErroresAgendar] = useState<Record<string, string>>({});

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

  // Estados para Disponibilidad Semanal (Tutor)
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadTutor | null>(null);
  const [modalDisponibilidadAbierto, setModalDisponibilidadAbierto] = useState(false);
  const [diasLaboralesConfig, setDiasLaboralesConfig] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bloquesConfig, setBloquesConfig] = useState<BloqueDisponibilidad[]>([]);
  const [duracionSesionConfig, setDuracionSesionConfig] = useState(45);
  const [modalidadPreferidaConfig, setModalidadPreferidaConfig] = useState<'Presencial' | 'Virtual' | 'Híbrida'>('Híbrida');
  const [lugarHabitualConfig, setLugarHabitualConfig] = useState('');
  const [meetHabitualConfig, setMeetHabitualConfig] = useState('');
  const [guardandoDisponibilidad, setGuardandoDisponibilidad] = useState(false);

  // Estados para Propuestas de Horario Alternativo
  const [propuestas, setPropuestas] = useState<PropuestaHorario[]>([]);
  const [modalPropuestasTutorAbierto, setModalPropuestasTutorAbierto] = useState(false);
  const [modalProponerHorarioAbierto, setModalProponerHorarioAbierto] = useState(false);
  const [modalMisPropuestasAlumnoAbierto, setModalMisPropuestasAlumnoAbierto] = useState(false);
  const [propuestaTemaForm, setPropuestaTemaForm] = useState('Revisión y Asesoría Académica');
  const [propuestaFechaForm, setPropuestaFechaForm] = useState('');
  const [propuestaHoraForm, setPropuestaHoraForm] = useState('10:00 AM');
  const [propuestaModalidadForm, setPropuestaModalidadForm] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [propuestaMotivoForm, setPropuestaMotivoForm] = useState('');
  const [citaOriginalPropuestaId, setCitaOriginalPropuestaId] = useState<string | undefined>(undefined);
  const [enviandoPropuesta, setEnviandoPropuesta] = useState(false);
  const [motivoRechazoForm, setMotivoRechazoForm] = useState('');
  const [propuestaARechazarId, setPropuestaARechazarId] = useState<string | null>(null);

  // Estados para Concluir Sesión y Registrar Acuerdos en Bitácora
  const [modalAcuerdosSesionAbierto, setModalAcuerdosSesionAbierto] = useState(false);
  const [citaParaAcuerdos, setCitaParaAcuerdos] = useState<CitaAsesoria | null>(null);
  const [tipoAcuerdoForm, setTipoAcuerdoForm] = useState<NotaSeguimiento['tipo']>('Sesión Ordinaria');
  const [acuerdosTextoForm, setAcuerdosTextoForm] = useState('');
  const [observacionesConfidencialesForm, setObservacionesConfidencialesForm] = useState('');
  const [marcarSesionCompletada, setMarcarSesionCompletada] = useState(true);
  const [guardandoAcuerdo, setGuardandoAcuerdo] = useState(false);

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

  // Cargar Disponibilidad y Propuestas
  const cargarDisponibilidadYPropuestas = async () => {
    const resDisp = await tutoriaService.getDisponibilidadTutor(tutorActivo.id);
    if (resDisp.success && resDisp.data) {
      setDisponibilidad(resDisp.data);
      if (bloquesConfig.length === 0 && resDisp.data.bloques) {
        setBloquesConfig(resDisp.data.bloques);
        setDiasLaboralesConfig(resDisp.data.diasLaborales || [1, 2, 3, 4, 5]);
        setDuracionSesionConfig(resDisp.data.duracionSesionMinutos || 45);
        setModalidadPreferidaConfig(resDisp.data.modalidadPreferida || 'Híbrida');
        setLugarHabitualConfig(resDisp.data.lugarHabitual || '');
        setMeetHabitualConfig(resDisp.data.enlaceMeetHabitual || '');
      }
    }

    const resProp = await tutoriaService.getPropuestasHorario(
      rolActivo === 'TUTOR' ? { tutorId: tutorActivo.id } : { estudianteId: estudianteActivo.id }
    );
    if (resProp.success && resProp.data) {
      setPropuestas(resProp.data);
    }
  };

  useEffect(() => {
    cargarCitas();
    cargarDisponibilidadYPropuestas();
    const unsub = tutoriaService.subscribe(() => {
      cargarCitas();
      cargarDisponibilidadYPropuestas();
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

  // Manejo de Agendar Sesión (Validación estética y persistencia)
  const handleAgendarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeExito(null);
    setMensajeError(null);

    const errores: Record<string, string> = {};
    if (!tema.trim()) {
      errores.tema = 'Ingresa el tema o motivo de la sesión (mínimo 3 caracteres)';
    } else if (tema.trim().length < 3) {
      errores.tema = 'El tema debe tener al menos 3 caracteres';
    }

    if (!fechaForm) {
      errores.fecha = 'Selecciona una fecha válida';
    }

    if (!horaForm.trim()) {
      errores.hora = 'Ingresa o selecciona la hora de la sesión';
    }

    if (tipoNuevaSesion === 'GRUPAL') {
      const participantes =
        rolActivo === 'TUTOR'
          ? estudiantesGrupalesSeleccionados
          : [estudianteActivo.id, ...estudiantesGrupalesSeleccionados.filter((id) => id !== estudianteActivo.id)];

      if (participantes.length === 0) {
        errores.participantes = 'Selecciona al menos un tutorado para la sesión grupal';
      }
    }

    if (modalidadForm === 'Virtual' && enlaceVirtualForm.trim() && !enlaceVirtualForm.trim().startsWith('http')) {
      errores.enlace = 'Ingresa un enlace de videollamada válido (debe iniciar con https://)';
    }

    if (Object.keys(errores).length > 0) {
      setErroresAgendar(errores);
      return;
    }

    setErroresAgendar({});
    setGuardando(true);

    if (tipoNuevaSesion === 'GRUPAL') {
      const participantes =
        rolActivo === 'TUTOR'
          ? estudiantesGrupalesSeleccionados
          : [estudianteActivo.id, ...estudiantesGrupalesSeleccionados.filter((id) => id !== estudianteActivo.id)];

      const payload: AgendarSesionGrupalPayload = {
        tutorId: tutorActivo.id,
        estudiantesIds: participantes,
        tema: tema.trim(),
        fecha: fechaForm,
        hora: horaForm,
        modalidad: modalidadForm,
        lugar: modalidadForm === 'Presencial' ? (lugarForm.trim() || 'Aula Magna de Asesorías UAT') : undefined,
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

  const handleConfirmarCancelar = async (eliminarPermanente = false) => {
    if (!citaACancelar) return;
    if (eliminarPermanente) {
      await tutoriaService.eliminarCita(citaACancelar.id);
    } else {
      if (rolActivo === 'TUTOR') {
        await tutoriaService.cancelarCitaComoTutor(citaACancelar.id);
      } else {
        await tutoriaService.cancelarCitaComoAlumno(citaACancelar.id);
      }
    }
    setModalCancelarAbierto(false);
    const idCancelada = citaACancelar.id;
    setCitaACancelar(null);
    if (citaSeleccionadaDetalle && citaSeleccionadaDetalle.id === idCancelada) {
      setCitaSeleccionadaDetalle(null);
    }
    await cargarCitas();
  };

  // Guardar Disponibilidad Semanal del Tutor
  const handleGuardarDisponibilidadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoDisponibilidad(true);
    const res = await tutoriaService.guardarDisponibilidadTutor({
      tutorId: tutorActivo.id,
      diasLaborales: diasLaboralesConfig,
      bloques: bloquesConfig,
      duracionSesionMinutos: duracionSesionConfig,
      modalidadPreferida: modalidadPreferidaConfig,
      lugarHabitual: lugarHabitualConfig,
      enlaceMeetHabitual: meetHabitualConfig
    });
    setGuardandoDisponibilidad(false);
    if (res.success) {
      setDisponibilidad(res.data || null);
      setModalDisponibilidadAbierto(false);
      setMensajeExito('Disponibilidad semanal guardada y publicada.');
      setTimeout(() => setMensajeExito(null), 3500);
      cargarDisponibilidadYPropuestas();
    }
  };

  // Responder a Propuestas de Horarios Alternativos (Tutor)
  const handleAceptarPropuesta = async (propuestaId: string) => {
    const res = await tutoriaService.responderPropuestaHorario({
      propuestaId,
      tutorId: tutorActivo.id,
      accion: 'aceptar'
    });
    if (res.success) {
      setMensajeExito(res.message);
      setTimeout(() => setMensajeExito(null), 4000);
      cargarCitas();
      cargarDisponibilidadYPropuestas();
    }
  };

  const handleRechazarPropuestaSubmit = async (propuestaId: string) => {
    const res = await tutoriaService.responderPropuestaHorario({
      propuestaId,
      tutorId: tutorActivo.id,
      accion: 'rechazar',
      motivoRespuesta: motivoRechazoForm.trim() || undefined
    });
    setPropuestaARechazarId(null);
    setMotivoRechazoForm('');
    if (res.success) {
      setMensajeExito('Propuesta de horario rechazada.');
      setTimeout(() => setMensajeExito(null), 3000);
      cargarDisponibilidadYPropuestas();
    }
  };

  // Crear Propuesta de Horario Alternativo (Alumno)
  const handleCrearPropuestaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propuestaFechaForm || !propuestaHoraForm || !propuestaMotivoForm.trim()) {
      setMensajeError('Completa la fecha, la hora propuesta y el motivo del cambio.');
      return;
    }
    setEnviandoPropuesta(true);
    const res = await tutoriaService.crearPropuestaHorario({
      citaId: citaOriginalPropuestaId,
      estudianteId: estudianteActivo.id,
      estudianteNombre: estudianteActivo.nombre,
      estudianteMatricula: estudianteActivo.matricula,
      tutorId: tutorActivo.id,
      tema: propuestaTemaForm.trim(),
      modalidad: propuestaModalidadForm,
      fechaPropuesta: propuestaFechaForm,
      horaPropuesta: propuestaHoraForm,
      motivoCambio: propuestaMotivoForm.trim()
    });
    setEnviandoPropuesta(false);
    if (res.success) {
      setModalProponerHorarioAbierto(false);
      setPropuestaMotivoForm('');
      setCitaOriginalPropuestaId(undefined);
      setMensajeExito('Propuesta enviada con éxito a tu tutor.');
      setTimeout(() => setMensajeExito(null), 4000);
      cargarDisponibilidadYPropuestas();
    } else {
      setMensajeError(res.message);
    }
  };

  // Concluir Sesión y Registrar Acuerdos en Bitácora (Tutor)
  const handleGuardarAcuerdoSesionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaParaAcuerdos || !acuerdosTextoForm.trim()) {
      return;
    }
    setGuardandoAcuerdo(true);
    const alumnoId = citaParaAcuerdos.estudianteId === 'GRUPAL' || citaParaAcuerdos.estudianteId === 'TODOS'
      ? (citaParaAcuerdos.estudiantesIds?.[0] || 'est-101')
      : citaParaAcuerdos.estudianteId;

    const res = await tutoriaService.registrarAcuerdoSesion({
      tutorId: tutorActivo.id,
      estudianteId: alumnoId,
      citaId: citaParaAcuerdos.id,
      tipo: tipoAcuerdoForm,
      acuerdos: acuerdosTextoForm.trim(),
      observaciones: observacionesConfidencialesForm.trim() || undefined
    });
    setGuardandoAcuerdo(false);
    if (res.success) {
      setModalAcuerdosSesionAbierto(false);
      setCitaParaAcuerdos(null);
      setCitaSeleccionadaDetalle(null);
      setMensajeExito('Acuerdos de sesión registrados permanentemente en la bitácora escolar.');
      setTimeout(() => setMensajeExito(null), 4000);
      cargarCitas();
    }
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

        <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          {/* Lado Izquierdo: Controles de Navegación Temporal y Periodo */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={handleAnterior}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
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
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Periodo siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 capitalize tracking-tight px-1 select-none">
              {MESES[fechaSeleccionada.getMonth()]} {fechaSeleccionada.getFullYear()}
            </span>
          </div>

          {/* Lado Derecho: Selector de Vistas + Herramientas de Agenda + Botón Agendar */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
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
                      descargarArchivoICS(citasFiltradas, 'calendario_asesoria_uat.ics', tutorActivo.nombre);
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

            {/* Disponibilidad Semanal (Tutor) */}
            {rolActivo === 'TUTOR' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (disponibilidad) {
                      setDiasLaboralesConfig(disponibilidad.diasLaborales || [1, 2, 3, 4, 5]);
                      setBloquesConfig(disponibilidad.bloques || []);
                      setDuracionSesionConfig(disponibilidad.duracionSesionMinutos || 45);
                      setModalidadPreferidaConfig(disponibilidad.modalidadPreferida || 'Híbrida');
                      setLugarHabitualConfig(disponibilidad.lugarHabitual || '');
                      setMeetHabitualConfig(disponibilidad.enlaceMeetHabitual || '');
                    }
                    setModalDisponibilidadAbierto(true);
                  }}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Configurar horario de atención y disponibilidad semanal"
                >
                  <Clock className="w-3.5 h-3.5 text-[#EE7402]" />
                  <span className="hidden sm:inline">Disponibilidad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalPropuestasTutorAbierto(true)}
                  className="relative px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Bandeja de propuestas de horario enviadas por alumnos"
                >
                  <Inbox className="w-3.5 h-3.5 text-[#EE7402]" />
                  <span className="hidden sm:inline">Propuestas</span>
                  {propuestas.filter((p) => p.estado === 'Pendiente').length > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#EE7402] text-white rounded-full text-[10px] font-black animate-pulse">
                      {propuestas.filter((p) => p.estado === 'Pendiente').length}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Proponer Horario Alternativo (Alumno) */}
            {rolActivo === 'ALUMNO' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setPropuestaTemaForm('Revisión y Asesoría Académica');
                    const manana = new Date();
                    manana.setDate(manana.getDate() + 1);
                    setPropuestaFechaForm(formatIsoDate(manana));
                    setPropuestaHoraForm('10:00 AM');
                    setPropuestaModalidadForm('Presencial');
                    setPropuestaMotivoForm('');
                    setModalProponerHorarioAbierto(true);
                  }}
                  className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-200 dark:border-amber-800"
                  title="Proponer un horario alternativo que se ajuste a tus clases"
                >
                  <Send className="w-3.5 h-3.5 text-[#EE7402]" />
                  <span className="hidden sm:inline">Proponer Horario</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalMisPropuestasAlumnoAbierto(true)}
                  className="relative px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="Consultar estado de mis propuestas"
                >
                  <Inbox className="w-3.5 h-3.5 text-[#EE7402]" />
                  <span className="hidden sm:inline">Mis Propuestas ({propuestas.length})</span>
                </button>
              </>
            )}

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
                              <div className="flex items-center gap-1">
                                <span className="font-black shrink-0">
                                  {esGrupal ? `(${cita.estudiantesIds?.length || 1})` : 'Confirmada'}
                                </span>
                                {cita.estado !== 'Cancelada' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePedirCancelar(cita);
                                    }}
                                    className="p-0.5 rounded hover:bg-rose-500/30 text-white/80 hover:text-white transition-colors cursor-pointer"
                                    title="Cancelar esta cita"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
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
                        {cita.estado !== 'Cancelada' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePedirCancelar(cita);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer flex items-center gap-1"
                            title="Cancelar esta cita de asesoría"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                        )}
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
                  No hay sesiones de asesoría programadas para esta fecha.
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

                      {cita.estado !== 'Cancelada' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePedirCancelar(cita);
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer flex items-center gap-1"
                          title="Cancelar esta sesión de asesoría"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancelar Cita</span>
                        </button>
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
                Los 12 meses destacan periodos de clases, días inhábiles, recesos vacacionales y talleres de asesoría. Haz clic en cualquier mes o día para navegar.
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
                                ? `${citasDia.length} sesión(es) de asesoría (${dia.getDate()} de ${nombreMes})`
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
                    Detalle de la Sesión de Asesoría
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

              {/* Acción del Tutor: Concluir Sesión y Registrar Acuerdos en Bitácora */}
              {rolActivo === 'TUTOR' && citaSeleccionadaDetalle.estado !== 'Cancelada' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCitaParaAcuerdos(citaSeleccionadaDetalle);
                      setTipoAcuerdoForm('Sesión Ordinaria');
                      setAcuerdosTextoForm('');
                      setObservacionesConfidencialesForm('');
                      setMarcarSesionCompletada(true);
                      setModalAcuerdosSesionAbierto(true);
                    }}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer text-xs"
                  >
                    <BookmarkCheck className="w-4 h-4 text-emerald-200" />
                    <span>✍️ Concluir Sesión y Registrar Acuerdos en Bitácora</span>
                  </button>
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
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancelar Sesión</span>
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
                    Programar Sesión de Asesoría
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

            <form noValidate onSubmit={handleAgendarSesion} className="p-5 space-y-4 overflow-y-auto">
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
                    onClick={() => {
                      setTipoNuevaSesion('INDIVIDUAL');
                      setErroresAgendar((prev) => ({ ...prev, participantes: '' }));
                    }}
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
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#EE7402]/30"
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
                <div className={`p-3.5 rounded-xl border transition-all ${
                  erroresAgendar.participantes
                    ? 'border-rose-400 dark:border-rose-500/80 bg-rose-50/20'
                    : 'bg-orange-50/40 dark:bg-slate-950 border-orange-200/60 dark:border-slate-800'
                } space-y-2`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Tutorados Convocados ({estudiantesGrupalesSeleccionados.length}):</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setEstudiantesGrupalesSeleccionados(catalogoEstudiantes.map((e) => e.id));
                          setErroresAgendar((prev) => ({ ...prev, participantes: '' }));
                        }}
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
                                setEstudiantesGrupalesSeleccionados((prev) => {
                                  const next = prev.includes(est.id) ? prev.filter((id) => id !== est.id) : [...prev, est.id];
                                  if (next.length > 0) {
                                    setErroresAgendar((err) => ({ ...err, participantes: '' }));
                                  }
                                  return next;
                                });
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
                  {erroresAgendar.participantes && (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-medium pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{erroresAgendar.participantes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tema */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tema o Motivo de la Sesión <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => {
                    setTema(e.target.value);
                    if (erroresAgendar.tema) {
                      setErroresAgendar((prev) => ({ ...prev, tema: '' }));
                    }
                  }}
                  placeholder="Ej. Taller de Hábitos de Estudio / Asesoría de Álgebra"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-medium transition-all ${
                    erroresAgendar.tema
                      ? 'border-rose-400 dark:border-rose-500/80 bg-rose-50/15 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#EE7402]/30'
                  }`}
                />
                {erroresAgendar.tema && (
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{erroresAgendar.tema}</span>
                  </div>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fechaForm}
                    onChange={(e) => {
                      setFechaForm(e.target.value);
                      if (erroresAgendar.fecha) {
                        setErroresAgendar((prev) => ({ ...prev, fecha: '' }));
                      }
                    }}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono transition-all ${
                      erroresAgendar.fecha
                        ? 'border-rose-400 dark:border-rose-500/80 bg-rose-50/15 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#EE7402]/30'
                    }`}
                  />
                  {erroresAgendar.fecha && (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{erroresAgendar.fecha}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hora <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={horaForm}
                    onChange={(e) => {
                      setHoraForm(e.target.value);
                      if (erroresAgendar.hora) {
                        setErroresAgendar((prev) => ({ ...prev, hora: '' }));
                      }
                    }}
                    placeholder="Ej. 11:00 AM"
                    className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl p-2.5 text-xs text-slate-900 dark:text-white transition-all ${
                      erroresAgendar.hora
                        ? 'border-rose-400 dark:border-rose-500/80 bg-rose-50/15 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#EE7402]/30'
                    }`}
                  />
                  {erroresAgendar.hora && (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-[11px] font-medium mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{erroresAgendar.hora}</span>
                    </div>
                  )}
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
                    placeholder={tipoNuevaSesion === 'GRUPAL' ? 'Aula Magna de Asesorías UAT' : 'Cubículo del Tutor'}
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

      {/* ======================================================== */}
      {/* MODAL 1: CONCLUIR SESIÓN Y REGISTRAR EN BITÁCORA         */}
      {/* ======================================================== */}
      {modalAcuerdosSesionAbierto && citaParaAcuerdos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                  <BookmarkCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base">Registrar Acuerdos y Concluir Sesión</h3>
                  <p className="text-xs text-emerald-100">Bitácora institucional del expediente del tutorado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAcuerdosSesionAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarAcuerdoSesionSubmit} className="p-6 space-y-4 text-xs">
              {/* Resumen de la sesión */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                  <span>Tema: {citaParaAcuerdos.tema}</span>
                  <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                    {citaParaAcuerdos.fecha} &bull; {citaParaAcuerdos.hora}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Participante:{' '}
                  <strong>
                    {catalogoEstudiantes.find((e) => e.id === citaParaAcuerdos.estudianteId)?.nombre ||
                      citaParaAcuerdos.estudianteId}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Registro *
                </label>
                <select
                  value={tipoAcuerdoForm}
                  onChange={(e) => setTipoAcuerdoForm(e.target.value as NotaSeguimiento['tipo'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="Sesión Ordinaria">Sesión Ordinaria</option>
                  <option value="Acuerdo / Compromiso">Acuerdo / Compromiso Académico</option>
                  <option value="Seguimiento Académico">Seguimiento Académico</option>
                  <option value="Canalización">Canalización UAT</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Acuerdos y Compromisos Acordados *
                </label>
                <textarea
                  rows={4}
                  required
                  value={acuerdosTextoForm}
                  onChange={(e) => setAcuerdosTextoForm(e.target.value)}
                  placeholder="Detalla los compromisos contraídos por el tutorado (ej. Entregar avances de proyecto el 20 de octubre, asistir a asesoría de cálculo...)"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones Confidenciales del Tutor (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacionesConfidencialesForm}
                  onChange={(e) => setObservacionesConfidencialesForm(e.target.value)}
                  placeholder="Anotaciones privadas del docente tutor..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkMarcarCompletada"
                  checked={marcarSesionCompletada}
                  onChange={(e) => setMarcarSesionCompletada(e.target.checked)}
                  className="rounded text-emerald-600 accent-emerald-600"
                />
                <label htmlFor="chkMarcarCompletada" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Marcar sesión como &quot;Completada&quot; en el calendario oficial
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAcuerdosSesionAbierto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAcuerdo}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{guardandoAcuerdo ? 'Guardando...' : 'Guardar Acuerdos en Bitácora'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CONFIGURACIÓN DE DISPONIBILIDAD SEMANAL (TUTOR)  */}
      {/* ======================================================== */}
      {modalDisponibilidadAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-gradient-to-r from-[#002B49] to-[#003860] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EE7402] text-white flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base">Disponibilidad Semanal de Asesoría</h3>
                  <p className="text-xs text-orange-200">Horario de trabajo y atención para asesorías UAT</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDisponibilidadAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarDisponibilidadSubmit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Días laborales */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Días de Atención Semanal:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { dia: 1, label: 'Lunes' },
                    { dia: 2, label: 'Martes' },
                    { dia: 3, label: 'Miércoles' },
                    { dia: 4, label: 'Jueves' },
                    { dia: 5, label: 'Viernes' },
                    { dia: 6, label: 'Sábado' }
                  ].map(({ dia, label }) => {
                    const activo = diasLaboralesConfig.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => {
                          if (activo) {
                            setDiasLaboralesConfig((prev) => prev.filter((d) => d !== dia));
                            setBloquesConfig((prev) => prev.filter((b) => b.diaSemana !== dia));
                          } else {
                            setDiasLaboralesConfig((prev) => [...prev, dia].sort());
                            setBloquesConfig((prev) => [
                              ...prev,
                              {
                                diaSemana: dia,
                                horaInicio: '09:00',
                                horaFin: '13:00',
                                modalidad: 'Presencial',
                                activo: true
                              }
                            ]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          activo
                            ? 'bg-[#EE7402]/10 border-[#EE7402] text-[#EE7402] font-bold shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>{label}</span>
                        {activo && <Check className="w-3.5 h-3.5 text-[#EE7402]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horarios por día activo */}
              <div className="space-y-2.5">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Horarios y Modalidad por Día:
                </label>
                {diasLaboralesConfig.length > 0 ? (
                  diasLaboralesConfig.map((diaNum) => {
                    const diaNombre = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaNum];
                    const bloque = bloquesConfig.find((b) => b.diaSemana === diaNum) || {
                      diaSemana: diaNum,
                      horaInicio: '09:00',
                      horaFin: '13:00',
                      modalidad: 'Presencial' as const,
                      activo: true
                    };

                    const updateBloque = (nuevo: Partial<BloqueDisponibilidad>) => {
                      setBloquesConfig((prev) => {
                        const existe = prev.some((b) => b.diaSemana === diaNum);
                        if (existe) {
                          return prev.map((b) => (b.diaSemana === diaNum ? { ...b, ...nuevo } : b));
                        }
                        return [...prev, { ...bloque, ...nuevo }];
                      });
                    };

                    return (
                      <div
                        key={diaNum}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 w-24">
                          {diaNombre}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">De:</span>
                            <input
                              type="time"
                              value={bloque.horaInicio}
                              onChange={(e) => updateBloque({ horaInicio: e.target.value })}
                              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">A:</span>
                            <input
                              type="time"
                              value={bloque.horaFin}
                              onChange={(e) => updateBloque({ horaFin: e.target.value })}
                              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                            />
                          </div>

                          <select
                            value={bloque.modalidad}
                            onChange={(e) => updateBloque({ modalidad: e.target.value as any })}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <option value="Presencial">Presencial</option>
                            <option value="Virtual">Virtual</option>
                            <option value="Ambas">Híbrida / Ambas</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">Selecciona al menos un día laboral arriba.</p>
                )}
              </div>

              {/* Ajustes generales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duración Estándar de Sesión
                  </label>
                  <select
                    value={duracionSesionConfig}
                    onChange={(e) => setDuracionSesionConfig(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos (Recomendado UAT)</option>
                    <option value={60}>60 minutos (1 hora)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Modalidad Preferente
                  </label>
                  <select
                    value={modalidadPreferidaConfig}
                    onChange={(e) => setModalidadPreferidaConfig(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Híbrida">Híbrida (Presencial o Virtual)</option>
                    <option value="Presencial">Solo Presencial</option>
                    <option value="Virtual">Solo Virtual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cubículo o Lugar Habitual
                  </label>
                  <input
                    type="text"
                    value={lugarHabitualConfig}
                    onChange={(e) => setLugarHabitualConfig(e.target.value)}
                    placeholder="Cubículo 204, Edificio B"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enlace de Google Meet Habitual
                  </label>
                  <input
                    type="url"
                    value={meetHabitualConfig}
                    onChange={(e) => setMeetHabitualConfig(e.target.value)}
                    placeholder="https://meet.google.com/uat-tut-2026"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalDisponibilidadAbierto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoDisponibilidad}
                  className="px-5 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {guardandoDisponibilidad ? 'Guardando...' : 'Guardar y Publicar Horario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: BANDEJA DE PROPUESTAS DE HORARIO (TUTOR)        */}
      {/* ======================================================== */}
      {modalPropuestasTutorAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-gradient-to-r from-[#EE7402] to-[#D96200] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base">Propuestas de Horario de Tutorados</h3>
                  <p className="text-xs text-orange-100">Solicitudes de reprogramación y horarios alternativos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPropuestasTutorAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {propuestas.length > 0 ? (
                propuestas.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {prop.estudianteNombre}
                          </span>
                          {prop.estudianteMatricula && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Mat: {prop.estudianteMatricula}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#EE7402] font-semibold block mt-0.5">
                          Tema: {prop.tema}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                          prop.estado === 'Aceptada'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : prop.estado === 'Rechazada'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                        }`}
                      >
                        {prop.estado}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fecha Solicitada:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{prop.fechaPropuesta}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Hora Solicitada:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{prop.horaPropuesta}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Modalidad:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{prop.modalidad}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Motivo / Justificación del Alumno:
                      </span>
                      <p className="p-2.5 rounded-lg bg-orange-50/40 dark:bg-slate-900 text-slate-700 dark:text-slate-300 italic border border-orange-100 dark:border-slate-800">
                        &quot;{prop.motivoCambio}&quot;
                      </p>
                    </div>

                    {/* Si ya fue respondida, mostrar comentario */}
                    {prop.motivoRespuestaTutor && (
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        <strong>Tu respuesta:</strong> {prop.motivoRespuestaTutor}
                      </div>
                    )}

                    {/* Acciones para propuestas pendientes */}
                    {prop.estado === 'Pendiente' && (
                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2">
                        {propuestaARechazarId === prop.id ? (
                          <div className="w-full space-y-2">
                            <input
                              type="text"
                              value={motivoRechazoForm}
                              onChange={(e) => setMotivoRechazoForm(e.target.value)}
                              placeholder="Motivo del rechazo (ej. Horario ocupado en Consejo Técnico)..."
                              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 text-xs"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setPropuestaARechazarId(null)}
                                className="px-3 py-1 text-slate-500 font-semibold"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRechazarPropuestaSubmit(prop.id)}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
                              >
                                Confirmar Rechazo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setPropuestaARechazarId(prop.id)}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAceptarPropuesta(prop.id)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aceptar y Agendar en Calendario</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No tienes propuestas de horario pendientes en este momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: PROPONER HORARIO ALTERNATIVO (ALUMNO)           */}
      {/* ======================================================== */}
      {modalProponerHorarioAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-gradient-to-r from-[#EE7402] to-[#D96200] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base">Proponer Horario Alternativo</h3>
                  <p className="text-xs text-orange-100">Solicitud directa a tu docente tutor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalProponerHorarioAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearPropuestaSubmit} className="p-6 space-y-4 text-xs">
              {/* Información del horario del tutor */}
              <div className="p-3 bg-orange-50/60 dark:bg-slate-800 rounded-xl border border-orange-200/60 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                <div className="font-bold text-[#EE7402] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Horario habitual de atención de {tutorActivo.nombre}:</span>
                </div>
                <p>
                  {disponibilidad?.bloques && disponibilidad.bloques.length > 0
                    ? disponibilidad.bloques
                        .map((b) => `${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][b.diaSemana]} ${b.horaInicio}-${b.horaFin}`)
                        .join(' | ')
                    : 'Lunes a Viernes 09:00 AM - 01:00 PM'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Si este horario se te empalma con clases o prácticas, propón una fecha y hora alternativa a continuación.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tema o Asunto de la Asesoría *
                </label>
                <input
                  type="text"
                  required
                  value={propuestaTemaForm}
                  onChange={(e) => setPropuestaTemaForm(e.target.value)}
                  placeholder="Dudas sobre materias, avance de titulación, etc."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Propuesta *
                  </label>
                  <input
                    type="date"
                    required
                    value={propuestaFechaForm}
                    onChange={(e) => setPropuestaFechaForm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hora Propuesta *
                  </label>
                  <select
                    value={propuestaHoraForm}
                    onChange={(e) => setPropuestaHoraForm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {[
                      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
                      '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
                      '04:00 PM', '05:00 PM', '06:00 PM'
                    ].map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Modalidad Preferida *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Presencial', 'Virtual'] as const).map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setPropuestaModalidadForm(mod)}
                      className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                        propuestaModalidadForm === mod
                          ? 'border-[#EE7402] bg-[#EE7402]/10 text-[#EE7402] font-bold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo o Justificación del Cambio *
                </label>
                <textarea
                  rows={3}
                  required
                  value={propuestaMotivoForm}
                  onChange={(e) => setPropuestaMotivoForm(e.target.value)}
                  placeholder="Explica a tu tutor por qué necesitas este horario (ej. Se me empalma con la práctica de laboratorio de Redes a las 11:00 AM)..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EE7402] resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalProponerHorarioAbierto(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoPropuesta}
                  className="px-5 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{enviandoPropuesta ? 'Enviando...' : 'Enviar Propuesta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: MIS PROPUESTAS DE HORARIO (ALUMNO)              */}
      {/* ======================================================== */}
      {modalMisPropuestasAlumnoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-6">
            <div className="p-5 bg-gradient-to-r from-[#002B49] to-[#003860] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EE7402] text-white flex items-center justify-center font-bold">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base">Mis Propuestas de Horario</h3>
                  <p className="text-xs text-orange-200">Historial de solicitudes enviadas a tu tutor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalMisPropuestasAlumnoAbierto(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs max-h-[70vh] overflow-y-auto">
              {propuestas.length > 0 ? (
                propuestas.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {prop.tema}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          prop.estado === 'Aceptada'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : prop.estado === 'Rechazada'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {prop.estado}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Horario Solicitado:</strong> {prop.fechaPropuesta} a las {prop.horaPropuesta} ({prop.modalidad})
                    </div>

                    <p className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      Motivo: &quot;{prop.motivoCambio}&quot;
                    </p>

                    {prop.motivoRespuestaTutor && (
                      <div className="p-2 rounded-lg bg-orange-50 dark:bg-slate-800 text-[11px] text-[#EE7402] dark:text-orange-300 font-medium">
                        <strong>Respuesta de tu tutor:</strong> {prop.motivoRespuestaTutor}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No has enviado propuestas de horario alternativo aún.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: CONFIRMACIÓN DE CANCELACIÓN O ELIMINACIÓN DE CITA */}
      {/* ======================================================== */}
      {modalCancelarAbierto && citaACancelar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalCancelarAbierto(false);
              setCitaACancelar(null);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[#EE7402] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  Cancelar Sesión de Asesoría
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ¿Confirmas que deseas cancelar esta cita del calendario institucional?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="font-semibold text-slate-900 dark:text-white truncate">
                {citaACancelar.tema}
              </div>
              <div className="text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 text-[11px]">
                <span>📅 {citaACancelar.fecha}</span>
                <span>&bull;</span>
                <span>⏰ {citaACancelar.hora}</span>
                <span>&bull;</span>
                <span>📍 {citaACancelar.modalidad}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              La sesión se marcará como cancelada y se retirará automáticamente de las próximas sesiones activas de los participantes en toda la plataforma.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalCancelarAbierto(false);
                  setCitaACancelar(null);
                }}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => handleConfirmarCancelar(false)}
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar Cita</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmarCancelar(true)}
                className="w-full sm:w-auto px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Definitivo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
