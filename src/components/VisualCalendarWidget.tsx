import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Video, ChevronLeft, ChevronRight, AlertCircle, PlusCircle, CalendarPlus } from 'lucide-react';
import { CitaAsesoria } from '../types/tutoria';
import { descargarArchivoICS } from '../utils/calendarExportUtils';

interface VisualCalendarWidgetProps {
  citas: CitaAsesoria[];
  onNuevaSesion?: () => void;
  onSeleccionarCita?: (cita: CitaAsesoria) => void;
}

export const VisualCalendarWidget: React.FC<VisualCalendarWidgetProps> = ({
  citas,
  onNuevaSesion,
  onSeleccionarCita
}) => {
  const [semanaOffset, setSemanaOffset] = useState(0);

  // Días de la semana para el calendario visual
  const diasSemana = [
    { dia: 'Lun', fecha: '13 Oct', numero: 13 },
    { dia: 'Mar', fecha: '14 Oct', numero: 14 },
    { dia: 'Mié', fecha: '15 Oct', numero: 15, hoy: true },
    { dia: 'Jue', fecha: '16 Oct', numero: 16 },
    { dia: 'Vie', fecha: '17 Oct', numero: 17 },
    { dia: 'Sáb', fecha: '18 Oct', numero: 18 }
  ];

  // Mapear citas reales de la base de datos a eventos visuales del calendario
  const eventosVisuales = citas.map((cita) => {
    const parts = (cita.fecha || '').split('-').map(Number);
    const diaNumero = parts[2] || 15;
    const esVirtual = cita.modalidad === 'Virtual';
    const esPendiente = cita.estado === 'Pendiente';

    return {
      id: cita.id,
      diaNumero,
      hora: cita.hora,
      titulo: cita.tema,
      alumno: cita.tema,
      modalidad: cita.modalidad,
      tipo: esVirtual ? 'virtual' : 'regular',
      colorBg: esVirtual
        ? 'bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
        : 'bg-[#EE7402]/15 text-[#C45500] dark:text-amber-400 border border-[#EE7402]/30',
      badgeColor: esVirtual ? 'bg-sky-500 text-white' : 'bg-[#EE7402] text-white',
      urgente: esPendiente
    };
  });


  return (
    <div className="bg-white dark:bg-slate-900 rounded-[16px] p-6 shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-slate-200/80 dark:border-slate-800 transition-all">
      {/* Cabecera del Calendario Visual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EE7402]/10 text-[#EE7402] flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="font-heading font-semibold text-lg text-slate-900 dark:white">
              Calendario Visual de Sesiones
            </h2>
          </div>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1">
            Semana activa &bull; Octubre 2026 &bull; Sesiones ordinarias y de atención prioritaria
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Navegación de semana */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setSemanaOffset(prev => prev - 1)}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-200 text-xs">
              {semanaOffset === 0 ? 'Semana Actual' : `Semana ${semanaOffset > 0 ? '+' : ''}${semanaOffset}`}
            </span>
            <button
              onClick={() => setSemanaOffset(prev => prev + 1)}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => descargarArchivoICS(citas, 'calendario_sesiones.ics')}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Exportar a Google Calendar / Descargar .ics"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-[#EE7402]" />
            <span className="hidden sm:inline">Exportar a Cal</span>
          </button>

          {onNuevaSesion && (
            <button
              onClick={onNuevaSesion}
              className="px-3 py-1.5 bg-[#EE7402] hover:bg-[#D96200] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Agendar</span>
            </button>
          )}
        </div>
      </div>

      {/* Grilla visual de días con eventos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5">
        {diasSemana.map((d) => {
          const eventosDelDia = eventosVisuales.filter(e => e.diaNumero === d.numero);

          return (
            <div
              key={d.dia}
              className={`p-3 rounded-2xl border transition-all flex flex-col min-h-[160px] ${
                d.hoy
                  ? 'bg-slate-50/80 dark:bg-slate-800/40 border-[#EE7402] ring-2 ring-[#EE7402]/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
              }`}
            >
              {/* Encabezado del día */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  {d.dia}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-lg ${
                    d.hoy
                      ? 'bg-[#EE7402] text-white'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {d.numero}
                </span>
              </div>

              {/* Lista de eventos con etiquetas redondeadas */}
              <div className="space-y-2 flex-1">
                {eventosDelDia.length > 0 ? (
                  eventosDelDia.map((ev) => (
                    <div
                      key={ev.id}
                      className={`p-2 rounded-xl text-xs transition-all cursor-pointer hover:scale-[1.02] ${ev.colorBg}`}
                      title={`${ev.hora} - ${ev.titulo} (${ev.alumno})`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono font-semibold text-[10px] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {ev.hora}
                        </span>
                        {ev.urgente && (
                          <span className="w-2 h-2 rounded-full bg-[#FF7F50] animate-ping" />
                        )}
                      </div>

                      <p className="font-medium text-[11px] line-clamp-1 leading-tight">
                        {ev.alumno}
                      </p>

                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold tracking-tight truncate max-w-[85px]">
                          {ev.modalidad}
                        </span>
                        {ev.urgente && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#FF7F50] text-white">
                            Urgente
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center py-4">
                    <span className="text-[10px] text-slate-400 italic">Libre</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda visual de eventos */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 flex-wrap text-xs text-[#64748B] dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Etiquetas:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF7F50]" />
          <span>Atención Urgente / Riesgo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EE7402]" />
          <span>Sesión Ordinaria</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>Asesoría Virtual (Meet)</span>
        </div>
      </div>
    </div>
  );
};
