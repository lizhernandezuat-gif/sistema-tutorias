import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  PlusCircle,
  CalendarPlus,
  Download,
  ExternalLink,
  Users,
  User,
  CheckCircle2,
  X,
  Filter,
  Check,
  CalendarDays,
  CalendarRange,
  Eye,
  Sparkles,
  LayoutGrid,
  Send,
  AlertTriangle,
  CalendarCheck
} from 'lucide-react';
import {
  CitaAsesoria,
  Tutor,
  EstudianteCatalogo,
  RolSimulado,
  AgendarSesionGrupalPayload,
  SolicitarAsesoriaPayload
} from '../types/tutoria';
import { tutoriaService } from '../services/tutoriaService';
import { abrirGoogleCalendar, descargarArchivoICS } from '../utils/calendarExportUtils';
import { AvatarWithFallback } from './AvatarWithFallback';
import { formatSemestre } from '../utils/tutoriaUtils';

export type TipoVistaCalendario = 'mes' | 'semana' | 'dia' | 'ano';

interface VisualCalendarWidgetProps {
  citas: CitaAsesoria[];
  onNuevaSesion?: (fechaIso?: string) => void;
  onSeleccionarCita?: (cita: CitaAsesoria) => void;
  rolActivo?: RolSimulado;
  tutorActivo?: Tutor;
  estudianteActivo?: EstudianteCatalogo;
  catalogoEstudiantes?: EstudianteCatalogo[];
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_SEMANA_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const VisualCalendarWidget: React.FC<VisualCalendarWidgetProps> = ({
  citas,
  onNuevaSesion,
  onSeleccionarCita,
  rolActivo = 'TUTOR',
  tutorActivo,
  estudianteActivo,
  catalogoEstudiantes = []
}) => {
  // Fecha seleccionada y estado actual (conectado a la fecha real del sistema)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(() => new Date());
  const [vista, setVista] = useState<TipoVistaCalendario>('mes');
  const [filtroModalidad, setFiltroModalidad] = useState<'TODAS' | 'Presencial' | 'Virtual'>('TODAS');
  const [filtroTipo, setFiltroTipo] = useState<'TODAS' | 'INDIVIDUAL' | 'GRUPAL'>('TODAS');

  // Modales
  const [citaDetalleModal, setCitaDetalleModal] = useState<CitaAsesoria | null>(null);
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false);

  // Formulario rápido de agendar sesión
  const [formTipo, setFormTipo] = useState<'individual' | 'grupal'>(
    rolActivo === 'TUTOR' ? 'grupal' : 'individual'
  );
  const [formEstudianteId, setFormEstudianteId] = useState<string>(
    catalogoEstudiantes[0]?.id || estudianteActivo?.id || 'est-101'
  );
  const [formEstudiantesGrupales, setFormEstudiantesGrupales] = useState<string[]>([
    catalogoEstudiantes[0]?.id || estudianteActivo?.id || 'est-101'
  ]);
  const [formTema, setFormTema] = useState('Sesión de Acompañamiento y Asesoría');
  const [formFecha, setFormFecha] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [formHora, setFormHora] = useState('11:00 AM');
  const [formModalidad, setFormModalidad] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [formLugar, setFormLugar] = useState('');
  const [formMotivo, setFormMotivo] = useState('');
  const [guardandoSesion, setGuardandoSesion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Funciones de formateo y comparación inmunes a zona horaria
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

  // Filtrado de citas según modalidad y tipo
  const citasFiltradas = useMemo(() => {
    return citas.filter((c) => {
      const matchMod = filtroModalidad === 'TODAS' || c.modalidad === filtroModalidad;
      const esGrupal = c.esGrupal || c.estudianteId === 'GRUPAL' || (c.estudiantesIds && c.estudiantesIds.length > 1);
      const matchTipo =
        filtroTipo === 'TODAS' ||
        (filtroTipo === 'GRUPAL' && esGrupal) ||
        (filtroTipo === 'INDIVIDUAL' && !esGrupal);

      return matchMod && matchTipo;
    });
  }, [citas, filtroModalidad, filtroTipo]);

  // Citas que caen en una fecha específica
  const getCitasDeFecha = (d: Date): CitaAsesoria[] => {
    const iso = formatIsoDate(d);
    return citasFiltradas.filter((c) => (c.fecha || '').startsWith(iso));
  };

  // Navegación (Anterior / Siguiente / Hoy)
  const handleAnterior = () => {
    const nueva = new Date(fechaSeleccionada);
    if (vista === 'mes') {
      nueva.setMonth(nueva.getMonth() - 1);
    } else if (vista === 'semana') {
      nueva.setDate(nueva.getDate() - 7);
    } else if (vista === 'dia') {
      nueva.setDate(nueva.getDate() - 1);
    } else if (vista === 'ano') {
      nueva.setFullYear(nueva.getFullYear() - 1);
    }
    setFechaSeleccionada(nueva);
  };

  const handleSiguiente = () => {
    const nueva = new Date(fechaSeleccionada);
    if (vista === 'mes') {
      nueva.setMonth(nueva.getMonth() + 1);
    } else if (vista === 'semana') {
      nueva.setDate(nueva.getDate() + 7);
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

  // Abrir modal de agendar con fecha seleccionada precargada
  const handleAbrirAgendarParaFecha = (d: Date) => {
    const iso = formatIsoDate(d);
    setFormFecha(iso);
    setModalAgendarAbierto(true);
    if (onNuevaSesion) {
      onNuevaSesion(iso);
    }
  };

  // Guardar nueva sesión desde el widget
  const handleGuardarNuevaSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoSesion(true);
    setMensajeExito(null);

    const tutorId = tutorActivo?.id || 'tutor-001';

    if (rolActivo === 'TUTOR' && formTipo === 'grupal') {
      const payload: AgendarSesionGrupalPayload = {
        tutorId,
        estudiantesIds: formEstudiantesGrupales,
        tema: formTema,
        fecha: formFecha,
        hora: formHora,
        modalidad: formModalidad,
        lugar: formModalidad === 'Presencial' ? (formLugar || 'Aula Magna de Asesorías / Cubículo') : undefined,
        enlaceVirtual: formModalidad === 'Virtual' ? 'https://meet.google.com/tutoria-uat' : undefined,
        motivoDetalle: formMotivo
      };
      await tutoriaService.agendarSesionGrupal(payload);
    } else {
      const payload: SolicitarAsesoriaPayload = {
        estudianteId: rolActivo === 'TUTOR' ? formEstudianteId : (estudianteActivo?.id || 'est-101'),
        tutorId,
        tema: formTema,
        fecha: formFecha,
        hora: formHora,
        modalidad: formModalidad,
        motivoDetalle: formMotivo
      };
      await tutoriaService.solicitarCitaComoAlumno(payload);
    }

    setGuardandoSesion(false);
    setMensajeExito('Sesión agendada exitosamente.');
    setTimeout(() => {
      setModalAgendarAbierto(false);
      setMensajeExito(null);
    }, 1000);
  };

  // Generador de días de la semana (Lunes a Domingo)
  const diasSemanaActiva = useMemo(() => {
    const diaSemana = fechaSeleccionada.getDay();
    const diff = (diaSemana + 6) % 7; // Lunes = 0
    const lunes = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate());
    lunes.setDate(fechaSeleccionada.getDate() - diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate());
      d.setDate(lunes.getDate() + i);
      return d;
    });
  }, [fechaSeleccionada]);

  // Generador de matriz mensual (Lunes a Domingo, 35 o 42 celdas)
  const matrizMes = useMemo(() => {
    const year = fechaSeleccionada.getFullYear();
    const month = fechaSeleccionada.getMonth();

    const primerDia = new Date(year, month, 1);
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const diasEnMesAnterior = new Date(year, month, 0).getDate();

    const inicioDiaSemana = (primerDia.getDay() + 6) % 7; // Lunes = 0
    const celdas: { fecha: Date; esMesActual: boolean }[] = [];

    // Días del mes anterior
    for (let i = inicioDiaSemana - 1; i >= 0; i--) {
      celdas.push({
        fecha: new Date(year, month - 1, diasEnMesAnterior - i),
        esMesActual: false
      });
    }

    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
      celdas.push({
        fecha: new Date(year, month, d),
        esMesActual: true
      });
    }

    // Días del mes siguiente para completar la matriz
    const totalCeldas = celdas.length > 35 ? 42 : 35;
    const restantes = totalCeldas - celdas.length;
    for (let d = 1; d <= restantes; d++) {
      celdas.push({
        fecha: new Date(year, month + 1, d),
        esMesActual: false
      });
    }

    return celdas;
  }, [fechaSeleccionada]);

  // Título dinámico según vista activa
  const tituloPeriodo = useMemo(() => {
    const y = fechaSeleccionada.getFullYear();
    const m = fechaSeleccionada.getMonth();

    if (vista === 'mes') {
      return `${MESES[m]} de ${y}`;
    }
    if (vista === 'semana') {
      const dInicio = diasSemanaActiva[0];
      const dFin = diasSemanaActiva[6];
      return `${dInicio.getDate()} ${MESES[dInicio.getMonth()].slice(0, 3)} - ${dFin.getDate()} ${MESES[dFin.getMonth()].slice(0, 3)} ${dFin.getFullYear()}`;
    }
    if (vista === 'dia') {
      const diaNombre = DIAS_SEMANA_LARGOS[(fechaSeleccionada.getDay() + 6) % 7];
      return `${diaNombre}, ${fechaSeleccionada.getDate()} de ${MESES[m]} de ${y}`;
    }
    if (vista === 'ano') {
      return `Año Institucional ${y}`;
    }
    return '';
  }, [vista, fechaSeleccionada, diasSemanaActiva]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[16px] p-5 sm:p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-slate-200/90 dark:border-slate-800 transition-all space-y-5">
      {/* ======================================================== */}
      {/* 1. BARRA SUPERIOR: Título, Navegación y Selector de Vista */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        {/* Lado izquierdo: Título y Navegación Fecha */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#EE7402]/10 text-[#EE7402] flex items-center justify-center font-bold shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white capitalize">
                  {tituloPeriodo}
                </h2>
                {isToday(fechaSeleccionada) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EE7402] text-white">
                    Hoy
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                Sistema Institucional de Asesorías UAT &bull; Ciclo Activo 2026-1
              </p>
            </div>
          </div>

          {/* Botones de navegación: Anterior, Hoy, Siguiente */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs ml-auto sm:ml-2">
            <button
              onClick={handleAnterior}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleIrAHoy}
              className="px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-200 hover:text-[#EE7402] transition-colors cursor-pointer text-xs"
            >
              Hoy
            </button>
            <button
              onClick={handleSiguiente}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Período siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lado derecho: Selector de Vistas (Día, Semana, Mes, Año) y Acciones */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end">
          {/* Selector de Vistas estilo Google Calendar */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setVista('dia')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                vista === 'dia'
                  ? 'bg-white dark:bg-slate-900 text-[#EE7402] shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Día</span>
            </button>

            <button
              onClick={() => setVista('semana')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                vista === 'semana'
                  ? 'bg-white dark:bg-slate-900 text-[#EE7402] shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>

            <button
              onClick={() => setVista('mes')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                vista === 'mes'
                  ? 'bg-white dark:bg-slate-900 text-[#EE7402] shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Mes</span>
            </button>

            <button
              onClick={() => setVista('ano')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                vista === 'ano'
                  ? 'bg-white dark:bg-slate-900 text-[#EE7402] shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Año</span>
            </button>
          </div>

          {/* Exportar .ICS */}
          <button
            onClick={() => descargarArchivoICS(citasFiltradas, 'calendario_asesoria_uat.ics')}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
            title="Exportar archivo de calendario .ics"
          >
            <Download className="w-4 h-4 text-[#EE7402]" />
          </button>

          {/* Botón Agendar Sesión */}
          <button
            onClick={() => handleAbrirAgendarParaFecha(fechaSeleccionada)}
            className="px-3.5 py-2 bg-[#EE7402] hover:bg-[#D96200] active:bg-[#BF5600] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Agendar</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BARRA DE FILTROS RÁPIDOS (MODALIDAD Y TIPO DE SESIÓN) */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filtrar:</span>
          </span>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setFiltroModalidad('TODAS')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                filtroModalidad === 'TODAS'
                  ? 'bg-white dark:bg-slate-900 font-bold text-[#EE7402] shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroModalidad('Presencial')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                filtroModalidad === 'Presencial'
                  ? 'bg-white dark:bg-slate-900 font-bold text-emerald-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Presencial
            </button>
            <button
              onClick={() => setFiltroModalidad('Virtual')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                filtroModalidad === 'Virtual'
                  ? 'bg-white dark:bg-slate-900 font-bold text-sky-600 shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Virtual
            </button>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setFiltroTipo('TODAS')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                filtroTipo === 'TODAS'
                  ? 'bg-white dark:bg-slate-900 font-bold text-[#EE7402] shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroTipo('GRUPAL')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'GRUPAL'
                  ? 'bg-white dark:bg-slate-900 font-bold text-[#EE7402] shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              <Users className="w-2.5 h-2.5" />
              <span>Grupales</span>
            </button>
            <button
              onClick={() => setFiltroTipo('INDIVIDUAL')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                filtroTipo === 'INDIVIDUAL'
                  ? 'bg-white dark:bg-slate-900 font-bold text-[#EE7402] shadow-2xs'
                  : 'text-slate-500'
              }`}
            >
              <User className="w-2.5 h-2.5" />
              <span>Individuales</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Mostrando <strong className="text-[#EE7402]">{citasFiltradas.length}</strong> sesiones en la base de datos
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. VISTA: MES                                            */}
      {/* ======================================================== */}
      {vista === 'mes' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          {/* Cabecera días semana (Lun - Dom) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 pb-1">
            {DIAS_SEMANA_CORTOS.map((d) => (
              <div key={d} className="py-1 uppercase text-[11px] tracking-wider font-mono">
                {d}
              </div>
            ))}
          </div>

          {/* Cuadrícula de 35 o 42 celdas */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {matrizMes.map((celda, index) => {
              const citasDelDia = getCitasDeFecha(celda.fecha);
              const hoy = isToday(celda.fecha);
              const seleccionada = isSameDay(celda.fecha, fechaSeleccionada);

              return (
                <div
                  key={index}
                  onClick={() => setFechaSeleccionada(celda.fecha)}
                  className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group ${
                    !celda.esMesActual
                      ? 'bg-slate-50/40 dark:bg-slate-950/20 border-slate-200/50 dark:border-slate-800/40 opacity-40'
                      : seleccionada
                      ? 'bg-orange-50/50 dark:bg-slate-800/80 border-[#EE7402] ring-2 ring-[#EE7402]/20'
                      : hoy
                      ? 'bg-white dark:bg-slate-900 border-[#EE7402]/60 ring-1 ring-[#EE7402]/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Encabezado de la celda: Número de día */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 rounded-lg flex items-center justify-center ${
                        hoy
                          ? 'bg-[#EE7402] text-white shadow-2xs'
                          : seleccionada
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-700 dark:text-slate-300 group-hover:text-[#EE7402]'
                      }`}
                    >
                      {celda.fecha.getDate()}
                    </span>

                    {citasDelDia.length > 0 && (
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {citasDelDia.length}
                      </span>
                    )}
                  </div>

                  {/* Lista resumida de citas en el día */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {citasDelDia.slice(0, 2).map((c) => {
                      const esGrupal = c.esGrupal || c.estudianteId === 'GRUPAL' || (c.estudiantesIds && c.estudiantesIds.length > 1);
                      return (
                        <div
                          key={c.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCitaDetalleModal(c);
                            if (onSeleccionarCita) onSeleccionarCita(c);
                          }}
                          className={`px-1.5 py-0.5 rounded-md text-[10px] truncate font-medium transition-transform hover:scale-[1.02] flex items-center gap-1 ${
                            esGrupal
                              ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-200 border border-[#EE7402]/30'
                              : c.modalidad === 'Virtual'
                              ? 'bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200 border border-sky-200 dark:border-sky-800'
                              : 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                          }`}
                          title={`${c.hora} - ${c.tema}`}
                        >
                          {esGrupal ? <Users className="w-2.5 h-2.5 shrink-0" /> : <Clock className="w-2.5 h-2.5 shrink-0" />}
                          <span className="truncate">{c.tema}</span>
                        </div>
                      );
                    })}

                    {citasDelDia.length > 2 && (
                      <span className="text-[9px] font-bold text-[#EE7402] block text-center">
                        +{citasDelDia.length - 2} más
                      </span>
                    )}
                  </div>

                  {/* Botón flotante sutil para agendar ese día */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAbrirAgendarParaFecha(celda.fecha);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-[#EE7402] font-bold flex items-center gap-0.5 justify-center py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 transition-opacity"
                    title={`Agendar sesión para el ${celda.fecha.getDate()} de ${MESES[celda.fecha.getMonth()]}`}
                  >
                    <span>+ Agendar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. VISTA: SEMANA                                         */}
      {/* ======================================================== */}
      {vista === 'semana' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {diasSemanaActiva.map((dia, index) => {
              const citasDelDia = getCitasDeFecha(dia);
              const hoy = isToday(dia);
              const seleccionada = isSameDay(dia, fechaSeleccionada);

              return (
                <div
                  key={index}
                  onClick={() => setFechaSeleccionada(dia)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col min-h-[280px] ${
                    seleccionada
                      ? 'bg-orange-50/40 dark:bg-slate-800/80 border-[#EE7402] ring-2 ring-[#EE7402]/20'
                      : hoy
                      ? 'bg-white dark:bg-slate-900 border-[#EE7402]/70 ring-1 ring-[#EE7402]/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  {/* Encabezado del Día */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-mono">
                        {DIAS_SEMANA_CORTOS[index]}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {MESES[dia.getMonth()].slice(0, 3)}
                      </span>
                    </div>

                    <span
                      className={`text-sm font-mono font-bold w-7 h-7 rounded-xl flex items-center justify-center ${
                        hoy
                          ? 'bg-[#EE7402] text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {dia.getDate()}
                    </span>
                  </div>

                  {/* Lista de citas de ese día de la semana */}
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[320px]">
                    {citasDelDia.length > 0 ? (
                      citasDelDia.map((c) => {
                        const esGrupal = c.esGrupal || c.estudianteId === 'GRUPAL' || (c.estudiantesIds && c.estudiantesIds.length > 1);
                        return (
                          <div
                            key={c.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCitaDetalleModal(c);
                            }}
                            className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer hover:scale-[1.02] shadow-2xs ${
                              esGrupal
                                ? 'bg-orange-50/90 dark:bg-orange-950/40 border-[#EE7402]/40 text-orange-950 dark:text-orange-200'
                                : c.modalidad === 'Virtual'
                                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-950 dark:text-sky-200'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono font-semibold mb-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {c.hora}
                              </span>
                              {esGrupal ? (
                                <span className="px-1.5 py-0.2 rounded-full bg-[#EE7402] text-white text-[9px] font-bold">
                                  Grupal
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-slate-500">
                                  {c.modalidad}
                                </span>
                              )}
                            </div>

                            <h4 className="font-semibold text-xs leading-tight line-clamp-2">
                              {c.tema}
                            </h4>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-300 dark:text-slate-600 text-xs">
                        <span>Sin citas</span>
                      </div>
                    )}
                  </div>

                  {/* Botón para agendar en ese día de la semana */}
                  <button
                    onClick={() => handleAbrirAgendarParaFecha(dia)}
                    className="w-full mt-2 py-1.5 text-[11px] font-semibold text-[#EE7402] hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-center"
                  >
                    + Agendar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. VISTA: DÍA                                            */}
      {/* ======================================================== */}
      {vista === 'dia' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Tira horizontal de selección rápida de días de la semana */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {diasSemanaActiva.map((dia, idx) => {
              const seleccionado = isSameDay(dia, fechaSeleccionada);
              const hoy = isToday(dia);
              const conteoCitas = getCitasDeFecha(dia).length;

              return (
                <button
                  key={idx}
                  onClick={() => setFechaSeleccionada(dia)}
                  className={`px-3 py-2 rounded-xl text-center shrink-0 transition-all cursor-pointer border ${
                    seleccionado
                      ? 'bg-[#EE7402] text-white border-[#EE7402] shadow-xs'
                      : hoy
                      ? 'bg-orange-50 dark:bg-slate-800 border-[#EE7402]/40 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="block text-[10px] font-mono uppercase font-semibold">
                    {DIAS_SEMANA_CORTOS[idx]}
                  </span>
                  <span className="block text-sm font-bold font-mono">
                    {dia.getDate()}
                  </span>
                  {conteoCitas > 0 && (
                    <span
                      className={`block text-[9px] font-bold rounded-full px-1.5 mt-0.5 ${
                        seleccionado ? 'bg-white text-[#EE7402]' : 'bg-[#EE7402] text-white'
                      }`}
                    >
                      {conteoCitas} {conteoCitas === 1 ? 'cita' : 'citas'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Agenda detallada del día seleccionado */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#EE7402]" />
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                  Agenda del {fechaSeleccionada.getDate()} de {MESES[fechaSeleccionada.getMonth()]} de {fechaSeleccionada.getFullYear()}
                </h3>
              </div>

              <button
                onClick={() => handleAbrirAgendarParaFecha(fechaSeleccionada)}
                className="px-3 py-1.5 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Agendar para este día</span>
              </button>
            </div>

            {/* Listado de citas del día */}
            {getCitasDeFecha(fechaSeleccionada).length > 0 ? (
              <div className="space-y-3">
                {getCitasDeFecha(fechaSeleccionada).map((c) => {
                  const esGrupal = c.esGrupal || c.estudianteId === 'GRUPAL' || (c.estudiantesIds && c.estudiantesIds.length > 1);

                  return (
                    <div
                      key={c.id}
                      onClick={() => setCitaDetalleModal(c)}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#EE7402] transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#EE7402] px-2 py-0.5 rounded-md bg-[#EE7402]/10 border border-[#EE7402]/20">
                            {c.hora}
                          </span>
                          {esGrupal ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 flex items-center gap-1">
                              <Users className="w-3 h-3 text-[#EE7402]" />
                              <span>Sesión Grupal ({c.estudiantesIds?.length || 0} alumnos)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              Individual
                            </span>
                          )}

                          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                            {c.modalidad === 'Virtual' ? <Video className="w-3 h-3 text-sky-500" /> : <MapPin className="w-3 h-3 text-emerald-500" />}
                            {c.modalidad}
                          </span>
                        </div>

                        <h4 className="font-heading font-semibold text-sm text-slate-900 dark:text-white">
                          {c.tema}
                        </h4>

                        {c.motivoDetalle && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                            &ldquo;{c.motivoDetalle}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirGoogleCalendar(c, esGrupal ? 'Sesión Grupal' : 'Alumno Tutorado', tutorActivo?.nombre);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <CalendarPlus className="w-3 h-3 text-[#EE7402]" />
                          <span>Google Cal</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCitaDetalleModal(c);
                          }}
                          className="px-3 py-1 text-xs font-semibold text-[#EE7402] hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <CalendarCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No hay sesiones registradas para este día.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. VISTA: AÑO                                            */}
      {/* ======================================================== */}
      {vista === 'ano' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {MESES.map((nombreMes, mesIdx) => {
              const year = fechaSeleccionada.getFullYear();
              const mesIso = `${year}-${String(mesIdx + 1).padStart(2, '0')}`;
              const citasDelMes = citasFiltradas.filter((c) => (c.fecha || '').startsWith(mesIso));
              const esMesActual = new Date().getMonth() === mesIdx && new Date().getFullYear() === year;

              return (
                <div
                  key={nombreMes}
                  onClick={() => {
                    const nueva = new Date(year, mesIdx, 1);
                    setFechaSeleccionada(nueva);
                    setVista('mes');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between min-h-[120px] ${
                    esMesActual
                      ? 'bg-orange-50/50 dark:bg-slate-800/80 border-[#EE7402] ring-2 ring-[#EE7402]/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-[#EE7402]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                      {nombreMes}
                    </h4>
                    {esMesActual && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EE7402] text-white">
                        Actual
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 my-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400 block">
                      {citasDelMes.length > 0 ? (
                        <strong className="text-[#EE7402] font-mono">
                          {citasDelMes.length} {citasDelMes.length === 1 ? 'sesión programada' : 'sesiones programadas'}
                        </strong>
                      ) : (
                        <span className="text-slate-400">Sin sesiones</span>
                      )}
                    </span>

                    {/* Dotes de colores para días con sesiones */}
                    {citasDelMes.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {citasDelMes.slice(0, 6).map((c, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              c.esGrupal ? 'bg-[#EE7402]' : c.modalidad === 'Virtual' ? 'bg-sky-500' : 'bg-emerald-500'
                            }`}
                            title={c.tema}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-[#EE7402] font-semibold hover:underline block pt-1">
                    Ver mes completo &rarr;
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DETALLE COMPLETO DE CITA SELECCIONADA             */}
      {/* ======================================================== */}
      {citaDetalleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCitaDetalleModal(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                    {citaDetalleModal.estado}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {citaDetalleModal.modalidad}
                  </span>
                  {citaDetalleModal.esGrupal && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EE7402]/15 text-[#EE7402] border border-[#EE7402]/30 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Sesión Grupal</span>
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                  {citaDetalleModal.tema}
                </h3>
              </div>

              <button
                onClick={() => setCitaDetalleModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <CalendarIcon className="w-4 h-4 text-[#EE7402]" />
                <span className="font-semibold">{citaDetalleModal.fecha}</span>
                <span>&bull;</span>
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-mono">{citaDetalleModal.hora}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                {citaDetalleModal.modalidad === 'Virtual' ? (
                  <Video className="w-4 h-4 text-sky-500" />
                ) : (
                  <MapPin className="w-4 h-4 text-emerald-500" />
                )}
                <span>
                  {citaDetalleModal.modalidad === 'Virtual'
                    ? citaDetalleModal.enlaceVirtual || 'Reunión en Google Meet UAT'
                    : citaDetalleModal.lugar || (tutorActivo?.cubículo || 'Cubículo Institucional')}
                </span>
              </div>

              {citaDetalleModal.motivoDetalle && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">
                    Motivo / Detalle:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    &ldquo;{citaDetalleModal.motivoDetalle}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => abrirGoogleCalendar(citaDetalleModal, 'Alumno', tutorActivo?.nombre)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-[#EE7402]" />
                  <span>Google Cal</span>
                </button>
                <button
                  onClick={() => descargarArchivoICS([citaDetalleModal], `cita_${citaDetalleModal.fecha}.ics`, tutorActivo?.nombre)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
                  title="Descargar archivo .ics"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setCitaDetalleModal(null)}
                className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AGENDAR NUEVA SESIÓN DESDE EL WIDGET              */}
      {/* ======================================================== */}
      {modalAgendarAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAgendarAbierto(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EE7402]/15 text-[#EE7402] flex items-center justify-center">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Agendar Sesión de Asesoría
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fecha preseleccionada: <strong>{formFecha}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalAgendarAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevaSesion} className="space-y-3.5 text-xs">
              {mensajeExito && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{mensajeExito}</span>
                </div>
              )}

              {/* Selector individual / grupal si es tutor */}
              {rolActivo === 'TUTOR' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTipo('grupal')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formTipo === 'grupal'
                        ? 'bg-[#EE7402]/10 border-[#EE7402] text-[#EE7402]'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Sesión Grupal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormTipo('individual')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formTipo === 'individual'
                        ? 'bg-[#EE7402]/10 border-[#EE7402] text-[#EE7402]'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Individual</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tema o Motivo *
                </label>
                <input
                  type="text"
                  required
                  value={formTema}
                  onChange={(e) => setFormTema(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#EE7402]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#EE7402]/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hora *
                  </label>
                  <select
                    value={formHora}
                    onChange={(e) => setFormHora(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#EE7402]/30 cursor-pointer"
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

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormModalidad('Presencial')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                    formModalidad === 'Presencial'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Presencial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormModalidad('Virtual')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                    formModalidad === 'Virtual'
                      ? 'bg-sky-50 border-sky-500 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Virtual</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAgendarAbierto(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoSesion}
                  className="px-4 py-2 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {guardandoSesion ? 'Guardando...' : 'Confirmar y Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
