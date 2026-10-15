export type RolSimulado = 'TUTOR' | 'ALUMNO';
export type RolUsuario = 'TUTOR' | 'TUTORADO';

export interface UsuarioSistema {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  avatar: string;
  activo: boolean;
  fechaRegistro: string;
  ultimoAcceso?: string;
  // Vínculo con las entidades del dominio escolar
  tutorProfileId?: string;
  estudianteProfileId?: string;
  // Campos de perfil para Tutor
  departamento?: string;
  cubículo?: string;
  // Campos de perfil para Tutorado (Alumno)
  matricula?: string;
  carrera?: string;
  semestre?: number;
  promedio?: number;
  telefono?: string;
}

export interface JwtPayload {
  sub: string; // ID del usuario en la base de usuarios
  email: string;
  nombre: string;
  rol: RolUsuario;
  profileId: string; // ID de Tutor (tutor-xxx) o Estudiante (est-xxx)
  iat: number; // Issued at (timestamp segundos)
  exp: number; // Expiration (timestamp segundos)
}

export interface SesionAutenticada {
  token: string;
  payload: JwtPayload;
  usuario: Omit<UsuarioSistema, 'passwordHash'>;
}

export interface LoginPayload {
  email: string;
  password: string;
  recordarme?: boolean;
}

export interface RegistroUsuarioPayload {
  nombre: string;
  email: string;
  password: string;
  confirmarPassword?: string;
  rol: RolUsuario;
  // Campos opcionales según rol
  departamento?: string;
  cubículo?: string;
  matricula?: string;
  carrera?: string;
  semestre?: number;
  promedio?: number;
  telefono?: string;
}

export interface ActualizarPerfilPayload {
  nombre?: string;
  avatar?: string;
  telefono?: string;
  departamento?: string;
  cubículo?: string;
  matricula?: string;
  carrera?: string;
  semestre?: number;
  promedio?: number;
  passwordActual?: string;
  passwordNueva?: string;
}


export interface Tutor {
  id: string;
  nombre: string;
  email: string;
  departamento: string;
  avatar: string;
  rol: 'tutor';
  cubículo: string;
}

export interface EstudianteCatalogo {
  id: string;
  matricula: string;
  nombre: string;
  email: string;
  carrera: string;
  semestre: number;
  promedio: number;
  telefono: string;
  avatar: string;
}

export type EstadoTutorado = 'ACTIVO' | 'EN_RIESGO' | 'CONDICIONADO' | 'CONCLUIDO';

export type TipoNotaSeguimiento =
  | 'Sesión Ordinaria'
  | 'Alerta Académica'
  | 'Canalización Psicológica'
  | 'Orientación Vocacional'
  | 'Seguimiento Académico'
  | 'Acuerdo / Compromiso'
  | 'Canalización';

export interface NotaSeguimiento {
  id: string;
  fecha: string;
  tipo: TipoNotaSeguimiento;
  contenido: string;
  autorId: string;
}

export interface AsignacionTutorado {
  id: string; // ID de la asignación (relación)
  tutorId: string; // FK a Tutor
  estudianteId: string; // FK a Estudiante
  estudiante: EstudianteCatalogo; // Datos denormalizados o populados del estudiante
  fechaAsignacion: string; // ISO Date
  periodoEscolar: string; // Ej: "2026-1"
  estado: EstadoTutorado;
  observaciones?: string;
  notas: NotaSeguimiento[];
}

export interface AsignarTutoradoPayload {
  estudianteEmailOrMatricula: string;
  periodoEscolar: string;
  observaciones?: string;
  estadoInicial?: EstadoTutorado;
}

export interface CitaAsesoria {
  id: string;
  estudianteId: string; // ID del estudiante principal o 'GRUPAL'
  estudiantesIds?: string[]; // Para sesiones grupales: lista de IDs de estudiantes participantes
  tutorId: string;
  fecha: string;
  hora: string;
  tema: string;
  modalidad: 'Presencial' | 'Virtual';
  estado: 'Confirmada' | 'Pendiente' | 'Completada' | 'Cancelada';
  lugar?: string;
  enlaceVirtual?: string;
  motivoDetalle?: string;
  tipo?: 'INDIVIDUAL' | 'GRUPAL';
  esGrupal?: boolean;
  cupoMaximo?: number;
  confirmaciones?: Record<string, 'Confirmada' | 'Pendiente' | 'Rechazada'>; // Confirmación individual por alumno
}

export interface AgendarSesionGrupalPayload {
  tutorId: string;
  estudiantesIds: string[];
  tema: string;
  fecha: string;
  hora: string;
  modalidad: 'Presencial' | 'Virtual';
  lugar?: string;
  enlaceVirtual?: string;
  motivoDetalle?: string;
}

export interface SolicitarAsesoriaPayload {
  estudianteId: string;
  tutorId: string;
  tema: string;
  fecha: string;
  hora: string;
  modalidad: 'Presencial' | 'Virtual';
  motivoDetalle: string;
  tipo?: 'INDIVIDUAL' | 'GRUPAL';
  lugar?: string;
  enlaceVirtual?: string;
  estudiantesIds?: string[];
  cupoMaximo?: number;
}

export interface ActualizarArchivoPayload {
  archivoId: string;
  nombre?: string;
  categoria?: CategoriaArchivo;
  descripcion?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
  timestamp: string;
}

export type EstadoRevisionArchivo = 'Pendiente' | 'Aprobado' | 'En Revisión' | 'Requiere Corrección';
export type CategoriaArchivo = 'Evidencia' | 'Material de Apoyo' | 'Tarea / Actividad' | 'Documento Institucional';

export interface ArchivoSistema {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  tamanoFormateado: string;
  fechaSubida: string;
  autorId: string;
  autorNombre: string;
  autorRol: 'TUTOR' | 'TUTORADO';
  tutoradoId?: string; // Estudiante al que corresponde
  tutorId?: string;    // Tutor al que corresponde
  actividadId?: string;// Tarea asociada opcional
  categoria: CategoriaArchivo;
  descripcion?: string;
  contenidoDataUrl: string; // Base64 Data URL para persistencia y descarga
  estadoRevision: EstadoRevisionArchivo;
  comentarioTutor?: string;
  fechaRevision?: string;
}

export interface SubirArchivoPayload {
  nombre: string;
  tipo: string;
  tamano: number;
  contenidoDataUrl: string;
  categoria: CategoriaArchivo;
  descripcion?: string;
  tutoradoId?: string;
  tutorId?: string;
  actividadId?: string;
}

export interface RevisarArchivoPayload {
  archivoId: string;
  estadoRevision: EstadoRevisionArchivo;
  comentarioTutor: string;
}

export interface EditarArchivoPayload {
  archivoId: string;
  nombre?: string;
  descripcion?: string;
  categoria?: CategoriaArchivo;
  comentarioTutor?: string;
}

export type EstadoEntregaActividad = 'Pendiente' | 'Entregada' | 'Revisada' | 'Requiere Corrección';

export interface EntregaActividad {
  id: string;
  actividadId: string;
  estudianteId: string;
  estudianteNombre: string;
  estudianteMatricula?: string;
  fechaEntrega: string; // ISO string
  archivoAdjunto: {
    nombre: string;
    dataUrl: string;
    tamano: string;
    tipo?: string;
  };
  comentariosEstudiante?: string;
  estado: EstadoEntregaActividad;
  calificacion?: string; // Ej: "100/100" o "Aprobado"
  retroalimentacionTutor?: string;
  fechaRevision?: string;
}

export interface ActividadAsignada {
  id: string;
  titulo: string;
  descripcion: string;
  instruccionesDetalladas?: string; // Instrucciones estilo Microsoft Teams
  fechaLimite: string;
  tutorId: string;
  tutorNombre: string;
  estudianteId?: string; // 'TODOS' o id del estudiante específico
  estado?: 'Pendiente' | 'Entregada' | 'Revisada';
  archivoAdjunto?: {
    nombre: string;
    dataUrl: string;
    tamano: string;
  };
  fechaCreacion: string;
  fechaModificacion?: string;
  entregas?: EntregaActividad[]; // Entregas individuales de los tutorados
}

export interface CrearActividadPayload {
  titulo: string;
  descripcion: string;
  instruccionesDetalladas?: string;
  fechaLimite: string;
  estudianteId?: string;
  archivoAdjunto?: {
    nombre: string;
    dataUrl: string;
    tamano: string;
  };
}

export interface EditarActividadPayload {
  actividadId: string;
  titulo: string;
  descripcion: string;
  instruccionesDetalladas?: string;
  fechaLimite: string;
  estudianteId?: string;
  archivoAdjunto?: {
    nombre: string;
    dataUrl: string;
    tamano: string;
  };
}

export interface EntregarActividadPayload {
  actividadId: string;
  estudianteId: string;
  estudianteNombre: string;
  estudianteMatricula?: string;
  comentariosEstudiante?: string;
  archivoAdjunto: {
    nombre: string;
    dataUrl: string;
    tamano: string;
    tipo?: string;
  };
}

export interface RevisarEntregaPayload {
  actividadId: string;
  entregaId: string;
  estado: EstadoEntregaActividad;
  retroalimentacionTutor: string;
  calificacion?: string;
}

// ========================================================
// SISTEMA DE DISPONIBILIDAD SEMANAL Y PROPUESTAS DE HORARIO
// ========================================================

export interface BloqueDisponibilidad {
  diaSemana: number; // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  horaInicio: string; // "09:00"
  horaFin: string;    // "13:00"
  modalidad: 'Presencial' | 'Virtual' | 'Ambas';
  activo: boolean;
}

export interface DisponibilidadTutor {
  tutorId: string;
  diasLaborales: number[]; // [1, 2, 3, 4, 5]
  bloques: BloqueDisponibilidad[];
  duracionSesionMinutos: number; // Ej: 30, 45, 60
  duracionMinutos?: number;      // Alias compatible
  modalidadPreferida: 'Presencial' | 'Virtual' | 'Híbrida';
  lugarHabitual?: string;
  enlaceMeetHabitual?: string;
  ultimaActualizacion: string;
}

export type EstadoPropuestaHorario = 'Pendiente' | 'Aceptada' | 'Rechazada';

export interface PropuestaHorario {
  id: string;
  citaId?: string; // Si se originó por no poder asistir a una cita previa
  estudianteId: string;
  estudianteNombre: string;
  estudianteMatricula?: string;
  tutorId: string;
  tema: string;
  modalidad: 'Presencial' | 'Virtual';
  fechaPropuesta: string; // YYYY-MM-DD
  horaPropuesta: string;  // "10:00 AM"
  motivoCambio: string;   // Justificación del estudiante
  estado: EstadoPropuestaHorario;
  motivoRespuestaTutor?: string; // Observación si el tutor rechaza o acepta
  comentariosTutor?: string;     // Alias compatible
  fechaCreacion: string;
  fechaRespuesta?: string;
}

export interface GuardarDisponibilidadPayload {
  tutorId: string;
  diasLaborales: number[];
  bloques: BloqueDisponibilidad[];
  duracionSesionMinutos?: number;
  modalidadPreferida?: 'Presencial' | 'Virtual' | 'Híbrida';
  lugarHabitual?: string;
  enlaceMeetHabitual?: string;
}

export interface CrearPropuestaHorarioPayload {
  citaId?: string;
  estudianteId: string;
  estudianteNombre: string;
  estudianteMatricula?: string;
  tutorId: string;
  tema: string;
  modalidad: 'Presencial' | 'Virtual';
  fechaPropuesta: string;
  horaPropuesta: string;
  motivoCambio: string;
}

export interface ResponderPropuestaHorarioPayload {
  propuestaId: string;
  tutorId: string;
  accion: 'aceptar' | 'rechazar';
  motivoRespuesta?: string;
}

export interface RegistrarAcuerdoSesionPayload {
  tutorId: string;
  estudianteId: string;
  citaId?: string;
  tipo: NotaSeguimiento['tipo'];
  acuerdos: string;
  observaciones?: string;
}

export interface BackendGuardSpec {
  endpoint: string;
  metodo: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  rolRequerido: 'TUTOR' | 'ALUMNO';
  reglaAislamiento: string;
  codigoErrorSiFalla: 401 | 403 | 404;
}

export type CategoriaNotaPersonal =
  | 'Recordatorio'
  | 'Duda de Asesoría'
  | 'Trámite / Beca'
  | 'Sesión Ordinaria'
  | 'Seguimiento Académico'
  | 'Acuerdo / Compromiso'
  | 'General';

export type TipoSeccionNota = 'todas' | 'personal' | 'seguimiento';

export interface NotaPersonalItem {
  id: string | number;
  titulo?: string;
  texto: string;
  categoria: CategoriaNotaPersonal;
  tipoSeccion?: 'personal' | 'seguimiento';
  fecha: string;
  updatedAt?: string;
  alumnoId?: string;
  tutorId?: string;
  autorId?: string;
  autorRol?: 'TUTOR' | 'ALUMNO';
  estudianteId?: string;
  estudianteNombre?: string;
  estudianteMatricula?: string;
  fijada?: boolean;
}

export interface EstadisticasPersistencia {
  totalUsuarios: number;
  totalTutores: number;
  totalEstudiantes: number;
  totalAsignaciones: number;
  totalCitas: number;
  totalArchivos: number;
  totalActividades: number;
  totalNotas: number;
  motor: 'IndexedDB (W3C) + LocalStorage';
  estado: 'Sincronizado y Persistente';
}


