import { CitaAsesoria } from '../types/tutoria';

/**
 * Convierte una fecha 'YYYY-MM-DD' y hora como '11:00 AM' o '04:30 PM' en Date objeto
 */
export function parsearFechaHora(fechaStr: string, horaStr: string): { inicio: Date; fin: Date } {
  try {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    let horas = 10;
    let minutos = 0;

    const match = horaStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      horas = parseInt(match[1], 10);
      minutos = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();

      if (ampm === 'PM' && horas < 12) horas += 12;
      if (ampm === 'AM' && horas === 12) horas = 0;
    }

    date.setHours(horas, minutos, 0, 0);

    const inicio = new Date(date);
    const fin = new Date(date.getTime() + 60 * 60 * 1000); // Duración estándar de 1 hora

    return { inicio, fin };
  } catch {
    const ahora = new Date();
    return { inicio: ahora, fin: new Date(ahora.getTime() + 60 * 60 * 1000) };
  }
}

/**
 * Formato ISO UTC para Google Calendar: YYYYMMDDTHHmmSSZ
 */
function formatoFechaGoogle(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Genera la URL oficial de Google Calendar para agregar una sesión en un clic
 */
export function generarUrlGoogleCalendar(
  cita: CitaAsesoria,
  alumnoNombre?: string,
  tutorNombre?: string
): string {
  const { inicio, fin } = parsearFechaHora(cita.fecha, cita.hora);
  const fechas = `${formatoFechaGoogle(inicio)}/${formatoFechaGoogle(fin)}`;

  const titulo = `Asesoría: ${cita.tema}`;
  const detalles = [
    `Sesión de Asesoría Académica - Sistema Institucional Asesoría Pro`,
    `Tema: ${cita.tema}`,
    `Modalidad: ${cita.modalidad}`,
    tutorNombre ? `Tutor Académico: ${tutorNombre}` : null,
    alumnoNombre ? `Estudiante Tutorado: ${alumnoNombre}` : null,
    cita.motivoDetalle ? `Observaciones / Motivo: ${cita.motivoDetalle}` : null,
    cita.enlaceVirtual ? `Enlace de Videollamada: ${cita.enlaceVirtual}` : null
  ]
    .filter(Boolean)
    .join('\n\n');

  const ubicacion =
    cita.modalidad === 'Virtual'
      ? cita.enlaceVirtual || 'Reunión Virtual (Google Meet)'
      : cita.lugar || 'Cubículo del Tutor / Instalaciones Universitarias';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: fechas,
    details: detalles,
    location: ubicacion
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Abre Google Calendar en una pestaña nueva con el evento prellenado
 */
export function abrirGoogleCalendar(cita: CitaAsesoria, alumnoNombre?: string, tutorNombre?: string): void {
  const url = generarUrlGoogleCalendar(cita, alumnoNombre, tutorNombre);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Genera el contenido en formato estándar RFC 5545 iCalendar (.ics)
 * Compatible con Google Calendar, Apple Calendar, Outlook y Thunderbird
 */
export function generarContenidoICS(citas: CitaAsesoria[], nombreTutor?: string): string {
  const now = formatoFechaGoogle(new Date());

  const eventos = citas
    .filter((c) => c.estado !== 'Cancelada')
    .map((cita) => {
      const { inicio, fin } = parsearFechaHora(cita.fecha, cita.hora);
      const dtStart = formatoFechaGoogle(inicio);
      const dtEnd = formatoFechaGoogle(fin);
      const uid = `${cita.id}-${Date.now()}@tutoriapro.universidad.edu.mx`;
      const summary = `Asesoría: ${cita.tema.replace(/\n/g, ' ')}`;
      const location = (
        cita.modalidad === 'Virtual'
          ? cita.enlaceVirtual || 'Reunión Virtual'
          : cita.lugar || 'Cubículo Institucional'
      ).replace(/,/g, '\\,');

      const description = [
        `Sesión de Asesoría: ${cita.tema}`,
        `Modalidad: ${cita.modalidad}`,
        cita.motivoDetalle ? `Detalle: ${cita.motivoDetalle}` : '',
        nombreTutor ? `Tutor: ${nombreTutor}` : '',
        cita.enlaceVirtual ? `Link: ${cita.enlaceVirtual}` : ''
      ]
        .filter(Boolean)
        .join('\\n')
        .replace(/,/g, '\\,');

      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Recordatorio de Sesión de Asesoría (en 15 minutos)',
        'END:VALARM',
        'END:VEVENT'
      ].join('\r\n');
    })
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Asesoria Pro//Sistema de Asesorias//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Sesiones de Asesoría Pro',
    'X-WR-TIMEZONE:UTC',
    eventos,
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Descarga el archivo .ics en el navegador
 */
export function descargarArchivoICS(
  citas: CitaAsesoria[],
  nombreArchivo = 'agenda_sesiones_asesoria.ics',
  nombreTutor?: string
): void {
  const contenido = generarContenidoICS(citas, nombreTutor);
  const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.setAttribute('download', nombreArchivo);
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
