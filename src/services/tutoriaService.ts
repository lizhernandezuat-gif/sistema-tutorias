import {
  AsignacionTutorado,
  AsignarTutoradoPayload,
  ApiResponse,
  EstadoTutorado,
  NotaSeguimiento,
  EstudianteCatalogo,
  CitaAsesoria,
  SolicitarAsesoriaPayload,
  AgendarSesionGrupalPayload,
  Tutor,
  ArchivoSistema,
  SubirArchivoPayload,
  RevisarArchivoPayload,
  ActualizarArchivoPayload,
  EditarArchivoPayload,
  ActividadAsignada,
  CrearActividadPayload,
  EditarActividadPayload,
  EntregarActividadPayload,
  RevisarEntregaPayload,
  EntregaActividad,
  DisponibilidadTutor,
  PropuestaHorario,
  GuardarDisponibilidadPayload,
  CrearPropuestaHorarioPayload,
  ResponderPropuestaHorarioPayload,
  RegistrarAcuerdoSesionPayload,
  NotaPersonalItem,
  CategoriaNotaPersonal,
  TipoSeccionNota,
  EstadisticasPersistencia,
  EstadoPropuestaHorario,
  TipoNotaSeguimiento
} from '../types/tutoria';
import { dbStorage } from './dbStorage';

const STORAGE_KEY = 'sistema_tutorias_asignaciones_v2';
const CITAS_STORAGE_KEY = 'sistema_tutorias_citas_v2';
const ARCHIVOS_STORAGE_KEY = 'sistema_tutorias_archivos_v2';
const ACTIVIDADES_STORAGE_KEY = 'sistema_tutorias_actividades_v3';
const NOTAS_STORAGE_KEY = 'sistema_tutorias_notas_personales_v2';
const DISPONIBILIDAD_STORAGE_KEY = 'sistema_tutorias_disponibilidad_v3';
const PROPUESTAS_STORAGE_KEY = 'sistema_tutorias_propuestas_v3';

// Clave de bandera de purga para garantizar arranque 100% limpio sin registros de prueba previos
const CLEAN_PURGE_FLAG = 'sistema_tutorias_clean_state_v2026_prod';
const CLEAN_IDB_FLAG = 'sistema_tutorias_clean_idb_v2026_prod';

export interface HttpLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  status: number;
  headers: Record<string, string>;
  requestBody?: any;
  responseBody: any;
  durationMs: number;
}

class TutoriaBackendService {
  private asignaciones: AsignacionTutorado[] = [];
  private citas: CitaAsesoria[] = [];
  private archivos: ArchivoSistema[] = [];
  private actividades: ActividadAsignada[] = [];
  private notas: NotaPersonalItem[] = [];
  private disponibilidades: DisponibilidadTutor[] = [];
  private propuestasHorarios: PropuestaHorario[] = [];
  private httpLogs: HttpLogEntry[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.initData();
    this.syncFromIndexedDB();
  }

  private initData() {
    try {
      const purgado = typeof window !== 'undefined' ? localStorage.getItem(CLEAN_PURGE_FLAG) : 'true';
      if (!purgado) {
        // Limpieza profunda de colecciones de prueba anteriores en LocalStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CITAS_STORAGE_KEY);
        localStorage.removeItem(ARCHIVOS_STORAGE_KEY);
        localStorage.removeItem(ACTIVIDADES_STORAGE_KEY);
        localStorage.removeItem(NOTAS_STORAGE_KEY);
        localStorage.removeItem(DISPONIBILIDAD_STORAGE_KEY);
        localStorage.removeItem(PROPUESTAS_STORAGE_KEY);

        localStorage.removeItem('sistema_tutorias_asignaciones_v1');
        localStorage.removeItem('sistema_tutorias_citas_v1');
        localStorage.removeItem('sistema_tutorias_archivos_v1');
        localStorage.removeItem('sistema_tutorias_actividades_v1');
        localStorage.removeItem('sistema_tutorias_actividades_v2');
        localStorage.removeItem('sistema_tutorias_notas_personales_v1');
        localStorage.removeItem('db_asignaciones');
        localStorage.removeItem('db_citas');
        localStorage.removeItem('db_archivos');
        localStorage.removeItem('db_actividades');
        localStorage.removeItem('db_notas');
        localStorage.removeItem('db_disponibilidad');
        localStorage.removeItem('db_propuestas');

        this.asignaciones = [];
        this.citas = [];
        this.archivos = [];
        this.actividades = [];
        this.notas = [];
        this.disponibilidades = [];
        this.propuestasHorarios = [];

        localStorage.setItem(CLEAN_PURGE_FLAG, 'true');
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      this.asignaciones = stored ? JSON.parse(stored) : [];

      const storedCitas = localStorage.getItem(CITAS_STORAGE_KEY);
      this.citas = storedCitas ? JSON.parse(storedCitas) : [];

      const storedArchivos = localStorage.getItem(ARCHIVOS_STORAGE_KEY);
      this.archivos = storedArchivos ? JSON.parse(storedArchivos) : [];

      const storedActividades = localStorage.getItem(ACTIVIDADES_STORAGE_KEY);
      this.actividades = storedActividades ? JSON.parse(storedActividades) : [];

      const storedNotas = localStorage.getItem(NOTAS_STORAGE_KEY);
      this.notas = storedNotas ? JSON.parse(storedNotas) : [];

      const storedDisp = localStorage.getItem(DISPONIBILIDAD_STORAGE_KEY);
      this.disponibilidades = storedDisp ? JSON.parse(storedDisp) : [];

      const storedProp = localStorage.getItem(PROPUESTAS_STORAGE_KEY);
      this.propuestasHorarios = storedProp ? JSON.parse(storedProp) : [];
    } catch {
      this.asignaciones = [];
      this.citas = [];
      this.archivos = [];
      this.actividades = [];
      this.notas = [];
      this.disponibilidades = [];
      this.propuestasHorarios = [];
    }
  }

  /**
   * Sincroniza en segundo plano con la base de datos IndexedDB
   */
  private async syncFromIndexedDB() {
    try {
      if (typeof window !== 'undefined' && !localStorage.getItem(CLEAN_IDB_FLAG)) {
        await dbStorage.clearTransactionalStores();
        localStorage.setItem(CLEAN_IDB_FLAG, 'true');
      }

      const dbAsignaciones = await dbStorage.getAll<AsignacionTutorado>('asignaciones');
      if (dbAsignaciones.length > 0) {
        this.asignaciones = dbAsignaciones;
      } else if (this.asignaciones.length > 0) {
        await dbStorage.putMany('asignaciones', this.asignaciones);
      }

      const dbCitas = await dbStorage.getAll<CitaAsesoria>('citas');
      if (dbCitas.length > 0) {
        this.citas = dbCitas;
      } else if (this.citas.length > 0) {
        await dbStorage.putMany('citas', this.citas);
      }

      const dbArchivos = await dbStorage.getAll<ArchivoSistema>('archivos');
      if (dbArchivos.length > 0) {
        this.archivos = dbArchivos;
      } else if (this.archivos.length > 0) {
        await dbStorage.putMany('archivos', this.archivos);
      }

      const dbActividades = await dbStorage.getAll<ActividadAsignada>('actividades');
      if (dbActividades.length > 0) {
        this.actividades = dbActividades;
      } else if (this.actividades.length > 0) {
        await dbStorage.putMany('actividades', this.actividades);
      }

      const dbNotas = await dbStorage.getAll<NotaPersonalItem>('notas');
      if (dbNotas.length > 0) {
        this.notas = dbNotas;
      }

      const dbDisp = await dbStorage.getAll<DisponibilidadTutor & { id: string }>('disponibilidad');
      if (dbDisp.length > 0) {
        this.disponibilidades = dbDisp;
      } else if (this.disponibilidades.length > 0) {
        await dbStorage.putMany('disponibilidad', this.disponibilidades.map(d => ({ ...d, id: d.tutorId })));
      }

      const dbProp = await dbStorage.getAll<PropuestaHorario>('propuestas');
      if (dbProp.length > 0) {
        this.propuestasHorarios = dbProp;
      } else if (this.propuestasHorarios.length > 0) {
        await dbStorage.putMany('propuestas', this.propuestasHorarios);
      }

      this.notify();
    } catch (err) {
      console.warn('Sincronización IndexedDB:', err);
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.asignaciones));
    } catch {}
    dbStorage.putMany('asignaciones', this.asignaciones).catch(() => {});
    this.notify();
  }

  private saveCitas() {
    try {
      localStorage.setItem(CITAS_STORAGE_KEY, JSON.stringify(this.citas));
    } catch {}
    dbStorage.clear('citas').then(() => {
      if (this.citas.length > 0) {
        dbStorage.putMany('citas', this.citas).catch(() => {});
      }
    }).catch(() => {
      dbStorage.putMany('citas', this.citas).catch(() => {});
    });
    this.notify();
  }

  private async saveArchivosAsync(): Promise<void> {
    try {
      localStorage.setItem(ARCHIVOS_STORAGE_KEY, JSON.stringify(this.archivos));
    } catch {
      try {
        const ligero = this.archivos.map(a => {
          if (a.contenidoDataUrl && a.contenidoDataUrl.length > 25000) {
            return { ...a, contenidoDataUrl: '' };
          }
          return a;
        });
        localStorage.setItem(ARCHIVOS_STORAGE_KEY, JSON.stringify(ligero));
      } catch {}
    }

    try {
      await dbStorage.clear('archivos');
      if (this.archivos.length > 0) {
        await dbStorage.putMany('archivos', this.archivos);
      }
    } catch (e) {
      console.warn('Error al guardar archivos en IndexedDB:', e);
    }

    this.notify();
  }

  private saveArchivos() {
    this.saveArchivosAsync().catch(() => {});
  }

  private saveActividades() {
    try {
      localStorage.setItem(ACTIVIDADES_STORAGE_KEY, JSON.stringify(this.actividades));
    } catch {}
    dbStorage.putMany('actividades', this.actividades).catch(() => {});
    this.notify();
  }

  private saveNotas() {
    try {
      localStorage.setItem(NOTAS_STORAGE_KEY, JSON.stringify(this.notas));
    } catch {}
    dbStorage.putMany('notas', this.notas).catch(() => {});
    this.notify();
  }

  private saveDisponibilidad() {
    try {
      localStorage.setItem(DISPONIBILIDAD_STORAGE_KEY, JSON.stringify(this.disponibilidades));
    } catch {}
    dbStorage.putMany('disponibilidad', this.disponibilidades.map(d => ({ ...d, id: d.tutorId }))).catch(() => {});
    this.notify();
  }

  private savePropuestas() {
    try {
      localStorage.setItem(PROPUESTAS_STORAGE_KEY, JSON.stringify(this.propuestasHorarios));
    } catch {}
    dbStorage.putMany('propuestas', this.propuestasHorarios).catch(() => {});
    this.notify();
  }



  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error en suscriptor de tutoriaService:', err);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('uat-citas-updated'));
      window.dispatchEvent(new CustomEvent('uat-tutoria-sync'));
    }
  }

  public getHttpLogs(): HttpLogEntry[] {
    return [...this.httpLogs].reverse();
  }

  public clearHttpLogs(): void {
    this.httpLogs = [];
    this.notify();
  }

  private logHttp(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    status: number,
    tutorId: string,
    responseBody: any,
    requestBody?: any
  ) {
    const entry: HttpLogEntry = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user_${tutorId}`,
        'Content-Type': 'application/json'
      },
      requestBody,
      responseBody,
      durationMs: Math.floor(Math.random() * 30) + 15
    };
    this.httpLogs.push(entry);
    if (this.httpLogs.length > 50) this.httpLogs.shift();
  }

  /**
   * ENDPOINT: GET /api/tutor/tutorados
   * Requerimiento 2: Listar únicamente a los tutorados que le pertenecen al tutor autenticado
   * Seguridad: Filtra obligatoriamente por tutorId extraído del token JWT (req.user.id)
   */
  public async getMisTutorados(
    tutorId: string,
    filters?: { search?: string; estado?: string; periodo?: string; semestre?: string }
  ): Promise<ApiResponse<AsignacionTutorado[]>> {
    if (!tutorId) {
      const errRes: ApiResponse<AsignacionTutorado[]> = {
        success: false,
        message: 'No autorizado: Token de tutor inválido o ausente.',
        statusCode: 401,
        timestamp: new Date().toISOString()
      };
      this.logHttp('GET', '/api/tutor/tutorados', 401, tutorId, errRes);
      return errRes;
    }

    // Regla de Negocio Crítica: Filtrar SOLO las asignaciones de este tutor
    let resultados = this.asignaciones.filter(a => a.tutorId === tutorId);

    if (filters?.estado && filters.estado !== 'TODOS') {
      resultados = resultados.filter(a => a.estado === filters.estado);
    }

    if (filters?.periodo && filters.periodo !== 'TODOS') {
      resultados = resultados.filter(a => a.periodoEscolar === filters.periodo);
    }

    if (filters?.semestre && filters.semestre !== 'TODOS') {
      const semNum = parseInt(filters.semestre, 10);
      if (!isNaN(semNum)) {
        resultados = resultados.filter(a => a.estudiante.semestre === semNum);
      }
    }

    if (filters?.search?.trim()) {
      const query = filters.search.toLowerCase().trim();
      resultados = resultados.filter(a =>
        a.estudiante.nombre.toLowerCase().includes(query) ||
        a.estudiante.matricula.toLowerCase().includes(query) ||
        a.estudiante.email.toLowerCase().includes(query) ||
        a.estudiante.carrera.toLowerCase().includes(query)
      );
    }

    // Ordenar alfabéticamente por nombre de estudiante
    resultados.sort((a, b) => a.estudiante.nombre.localeCompare(b.estudiante.nombre));

    const response: ApiResponse<AsignacionTutorado[]> = {
      success: true,
      message: `Se recuperaron ${resultados.length} tutorados asignados.`,
      data: resultados,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };

    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.set('search', filters.search);
    if (filters?.estado && filters.estado !== 'TODOS') queryParams.set('estado', filters.estado);
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    this.logHttp('GET', `/api/tutor/tutorados${queryString}`, 200, tutorId, response);
    return response;
  }

  /**
   * ENDPOINT: POST /api/tutor/tutorados
   * Requerimiento 2: Registrar o vincular un nuevo tutorado al tutor en sesión
   */
  public async asignarTutorado(
    tutorId: string,
    payload: AsignarTutoradoPayload
  ): Promise<ApiResponse<AsignacionTutorado>> {
    if (!tutorId) {
      const errRes: ApiResponse<AsignacionTutorado> = {
        success: false,
        message: 'No autorizado: Token de sesión inválido.',
        statusCode: 401,
        timestamp: new Date().toISOString()
      };
      this.logHttp('POST', '/api/tutor/tutorados', 401, tutorId, errRes, payload);
      return errRes;
    }

    const term = payload.estudianteEmailOrMatricula.trim().toLowerCase();
    if (!term) {
      const errRes: ApiResponse<AsignacionTutorado> = {
        success: false,
        message: 'Debe ingresar un correo institucional o matrícula válida.',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
      this.logHttp('POST', '/api/tutor/tutorados', 400, tutorId, errRes, payload);
      return errRes;
    }

    // 1. Buscar al estudiante en el catálogo institucional general persistido
    const catalogo = await this.getCatalogoEstudiantes();
    let estudianteEncontrado = catalogo.find(
      e => e.email.toLowerCase() === term || e.matricula.toLowerCase() === term
    );

    if (!estudianteEncontrado) {
      // Registrar dinámicamente al estudiante en el catálogo si aún no existe
      const esEmail = term.includes('@');
      const nombreAuto = esEmail ? term.split('@')[0].replace(/[._-]/g, ' ') : `Estudiante ${term}`;
      const nombreCapitalizado = nombreAuto.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const matriculaAuto = esEmail ? `2026-UAT-${Math.floor(100 + Math.random() * 900)}` : term.toUpperCase();
      const emailAuto = esEmail ? term : `a${term.toLowerCase().replace(/[^a-z0-9]/g, '')}@alumno.uat.edu.mx`;

      const nuevoEst: EstudianteCatalogo = {
        id: `est-${Date.now().toString(36).slice(-5)}`,
        matricula: matriculaAuto,
        nombre: nombreCapitalizado,
        email: emailAuto,
        carrera: 'Ingeniería en Sistemas Computacionales',
        semestre: 1,
        promedio: 0,
        telefono: '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCapitalizado)}&background=EE7402&color=fff&bold=true`
      };

      try {
        const extraKey = 'sistema_tutorias_estudiantes_extra_v1';
        const raw = localStorage.getItem(extraKey);
        const list: EstudianteCatalogo[] = raw ? JSON.parse(raw) : [];
        list.push(nuevoEst);
        localStorage.setItem(extraKey, JSON.stringify(list));
        await dbStorage.put('estudiantes', nuevoEst);
      } catch {}

      estudianteEncontrado = nuevoEst;
    }

    // 2. Verificar si YA está asignado a ESTE tutor en el mismo periodo
    const yaAsignadoConmigo = this.asignaciones.find(
      a => a.tutorId === tutorId &&
           a.estudianteId === estudianteEncontrado.id &&
           a.periodoEscolar === payload.periodoEscolar
    );

    if (yaAsignadoConmigo) {
      const errRes: ApiResponse<AsignacionTutorado> = {
        success: false,
        message: `El estudiante ${estudianteEncontrado.nombre} ya forma parte de tu lista de tutorados para el periodo ${payload.periodoEscolar}.`,
        error: 'ALREADY_ASSIGNED_TO_CALLER',
        statusCode: 409,
        timestamp: new Date().toISOString()
      };
      this.logHttp('POST', '/api/tutor/tutorados', 409, tutorId, errRes, payload);
      return errRes;
    }

    // 3. Verificar si está asignado a OTRO tutor en el mismo periodo (regla 1:N)
    const asignadoAOtroTutor = this.asignaciones.find(
      a => a.estudianteId === estudianteEncontrado.id &&
           a.periodoEscolar === payload.periodoEscolar &&
           a.tutorId !== tutorId
    );

    if (asignadoAOtroTutor) {
      const tutores = await this.getCatalogoTutores();
      const otroTutor = tutores.find(t => t.id === asignadoAOtroTutor.tutorId);
      const nombreOtroTutor = otroTutor ? otroTutor.nombre : 'otro tutor';
      const errRes: ApiResponse<AsignacionTutorado> = {
        success: false,
        message: `Conflicto de asignación: ${estudianteEncontrado.nombre} ya tiene asignado como tutor a ${nombreOtroTutor} para el ciclo ${payload.periodoEscolar}. Se requiere una reasignación formal.`,
        error: 'STUDENT_HAS_DIFFERENT_TUTOR',
        statusCode: 409,
        timestamp: new Date().toISOString()
      };
      this.logHttp('POST', '/api/tutor/tutorados', 409, tutorId, errRes, payload);
      return errRes;
    }

    // 4. Crear el nuevo registro de asignación (Entidad TutorAsignacion)
    const nuevaAsignacion: AsignacionTutorado = {
      id: `asig-${Date.now().toString(36)}`,
      tutorId: tutorId,
      estudianteId: estudianteEncontrado.id,
      estudiante: estudianteEncontrado,
      fechaAsignacion: new Date().toISOString(),
      periodoEscolar: payload.periodoEscolar || '2026-1',
      estado: payload.estadoInicial || 'ACTIVO',
      observaciones: payload.observaciones?.trim() || 'Asignado por el tutor mediante plataforma.',
      notas: []
    };

    this.asignaciones.push(nuevaAsignacion);
    this.save();

    const okRes: ApiResponse<AsignacionTutorado> = {
      success: true,
      message: `Estudiante ${estudianteEncontrado.nombre} (${estudianteEncontrado.matricula}) asignado exitosamente a su tutela.`,
      data: nuevaAsignacion,
      statusCode: 201,
      timestamp: new Date().toISOString()
    };

    this.logHttp('POST', '/api/tutor/tutorados', 201, tutorId, okRes, payload);
    return okRes;
  }

  /**
   * ENDPOINT: DELETE /api/tutor/tutorados/:id
   * Desvincular un tutorado garantizando que pertenezca al tutor autenticado
   */
  public async desasignarTutorado(
    tutorId: string,
    asignacionId: string
  ): Promise<ApiResponse<{ id: string }>> {
    const idx = this.asignaciones.findIndex(a => a.id === asignacionId);

    if (idx === -1) {
      const errRes: ApiResponse<{ id: string }> = {
        success: false,
        message: 'La asignación de asesoría especificada no existe.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
      this.logHttp('DELETE', `/api/tutor/tutorados/${asignacionId}`, 404, tutorId, errRes);
      return errRes;
    }

    // VALIDACIÓN DE SEGURIDAD IDOR: ¿El registro pertenece al tutor que llama?
    if (this.asignaciones[idx].tutorId !== tutorId) {
      const errRes: ApiResponse<{ id: string }> = {
        success: false,
        message: 'Acceso denegado: No tiene permisos para desvincular un tutorado que pertenece a otro tutor.',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
      this.logHttp('DELETE', `/api/tutor/tutorados/${asignacionId}`, 403, tutorId, errRes);
      return errRes;
    }

    const removido = this.asignaciones.splice(idx, 1)[0];
    this.save();

    const okRes: ApiResponse<{ id: string }> = {
      success: true,
      message: `Tutorado ${removido.estudiante.nombre} desvinculado satisfactoriamente.`,
      data: { id: asignacionId },
      statusCode: 200,
      timestamp: new Date().toISOString()
    };

    this.logHttp('DELETE', `/api/tutor/tutorados/${asignacionId}`, 200, tutorId, okRes);
    return okRes;
  }

  /**
   * ENDPOINT: PATCH /api/tutor/tutorados/:id/estado
   */
  public async actualizarEstado(
    tutorId: string,
    asignacionId: string,
    nuevoEstado: EstadoTutorado,
    observacion?: string
  ): Promise<ApiResponse<AsignacionTutorado>> {
    const asig = this.asignaciones.find(a => a.id === asignacionId);

    if (!asig) {
      const errRes: ApiResponse<AsignacionTutorado> = {
        success: false,
        message: 'Asignación no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
      this.logHttp('PATCH', `/api/tutor/tutorados/${asignacionId}/estado`, 404, tutorId, errRes);
      return errRes;
    }

    if (asig.tutorId !== tutorId) {
      const errRes: ApiResponse<AsignacionTutorado> = {
        success: false,
        message: 'Acceso denegado: El alumno no le pertenece a este tutor.',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
      this.logHttp('PATCH', `/api/tutor/tutorados/${asignacionId}/estado`, 403, tutorId, errRes);
      return errRes;
    }

    asig.estado = nuevoEstado;
    if (observacion) {
      asig.observaciones = observacion;
    }
    this.save();

    const okRes: ApiResponse<AsignacionTutorado> = {
      success: true,
      message: `Estado de asesoría actualizado a ${nuevoEstado}.`,
      data: asig,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };

    this.logHttp('PATCH', `/api/tutor/tutorados/${asignacionId}/estado`, 200, tutorId, okRes, {
      estado: nuevoEstado,
      observacion
    });
    return okRes;
  }

  /**
   * ENDPOINT: POST /api/tutor/tutorados/:id/notas
   * Agregar una nota de seguimiento o sesión
   */
  public async agregarNota(
    tutorId: string,
    asignacionId: string,
    tipo: NotaSeguimiento['tipo'],
    contenido: string
  ): Promise<ApiResponse<NotaSeguimiento>> {
    const asig = this.asignaciones.find(a => a.id === asignacionId);

    if (!asig || asig.tutorId !== tutorId) {
      const errRes: ApiResponse<NotaSeguimiento> = {
        success: false,
        message: 'Asignación no válida o no autorizada.',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
      this.logHttp('POST', `/api/tutor/tutorados/${asignacionId}/notas`, 403, tutorId, errRes);
      return errRes;
    }

    const nuevaNota: NotaSeguimiento = {
      id: 'nota-' + Date.now().toString(36),
      fecha: new Date().toISOString(),
      tipo,
      contenido,
      autorId: tutorId
    };

    asig.notas.unshift(nuevaNota);
    this.save();

    const okRes: ApiResponse<NotaSeguimiento> = {
      success: true,
      message: 'Nota de seguimiento añadida exitosamente a la bitácora.',
      data: nuevaNota,
      statusCode: 201,
      timestamp: new Date().toISOString()
    };

    this.logHttp('POST', `/api/tutor/tutorados/${asignacionId}/notas`, 201, tutorId, okRes, {
      tipo,
      contenido
    });
    return okRes;
  }

  /**
   * Búsqueda en catálogo institucional de estudiantes para autocomplete
   */
  public buscarEnCatalogo(query: string): EstudianteCatalogo[] {
    const q = query.toLowerCase().trim();
    let lista: EstudianteCatalogo[] = [];
    try {
      const extraKey = 'sistema_tutorias_estudiantes_extra_v1';
      const raw = localStorage.getItem(extraKey);
      if (raw) lista = JSON.parse(raw);
    } catch {}
    if (!q) return lista;
    return lista.filter(
      e => e.nombre.toLowerCase().includes(q) ||
           e.email.toLowerCase().includes(q) ||
           e.matricula.toLowerCase().includes(q)
    );
  }

  /**
   * ENDPOINT VISTA ALUMNO: GET /api/alumno/mi-tutoria
   * Recupera el tutor asignado, datos curriculares y próximas citas del estudiante en sesión
   */
  public async getMiTutoriaComoAlumno(estudianteId: string): Promise<ApiResponse<{
    asignacion: AsignacionTutorado | null;
    tutor: Tutor | null;
    citas: CitaAsesoria[];
  }>> {
    const estudiantes = await this.getCatalogoEstudiantes();
    const estudiante = estudiantes.find(e => e.id === estudianteId);
    if (!estudiante) {
      return {
        success: false,
        message: 'Estudiante no encontrado en el sistema institucional.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    // Buscar asignación activa en el ciclo actual (2026-1)
    const asignacion = this.asignaciones.find(
      a => a.estudianteId === estudianteId && a.periodoEscolar === '2026-1'
    ) || this.asignaciones.find(a => a.estudianteId === estudianteId) || null;

    let tutor: Tutor | null = null;
    if (asignacion) {
      const tutores = await this.getCatalogoTutores();
      tutor = tutores.find(t => t.id === asignacion.tutorId) || null;
    }

    const citasEstudiante = this.citas.filter(
      c => c.estudianteId === estudianteId ||
           c.estudianteId === 'TODOS' ||
           c.tipo === 'GRUPAL' ||
           (c.estudiantesIds && c.estudiantesIds.includes(estudianteId))
    );

    const res = {
      success: true,
      message: `Información recuperada para el estudiante ${estudiante.nombre}.`,
      data: {
        asignacion,
        tutor,
        citas: citasEstudiante
      },
      statusCode: 200,
      timestamp: new Date().toISOString()
    };

    this.logHttp('GET', `/api/alumno/mi-tutoria?estudianteId=${estudianteId}`, 200, tutor?.id || 'tutor-001', res);
    return res;
  }

  /**
   * ENDPOINT VISTA TUTOR: GET /api/tutor/citas
   * Recupera todas las sesiones (individuales y grupales) del tutor
   */
  public async getCitasPorTutor(tutorId: string): Promise<ApiResponse<CitaAsesoria[]>> {
    const citasTutor = this.citas.filter(c => c.tutorId === tutorId);
    return {
      success: true,
      message: `Se recuperaron ${citasTutor.length} citas de asesoría.`,
      data: citasTutor,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: POST /api/tutor/sesion-grupal
   * Agendar sesión grupal de un tutor con múltiples tutorados
   */
  public async agendarSesionGrupal(payload: AgendarSesionGrupalPayload): Promise<ApiResponse<CitaAsesoria>> {
    if (!payload.tema.trim() || !payload.fecha || !payload.hora) {
      return {
        success: false,
        message: 'Debe especificar el tema, la fecha y la hora para la sesión grupal.',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    if (!payload.estudiantesIds || payload.estudiantesIds.length === 0) {
      return {
        success: false,
        message: 'Debe seleccionar al menos un estudiante tutorado para la sesión grupal.',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    const confirmaciones: Record<string, 'Confirmada' | 'Pendiente' | 'Rechazada'> = {};
    payload.estudiantesIds.forEach(id => {
      confirmaciones[id] = 'Pendiente';
    });

    const nuevaCita: CitaAsesoria = {
      id: 'cita-grupal-' + Date.now().toString(36),
      estudianteId: 'GRUPAL',
      estudiantesIds: payload.estudiantesIds,
      tutorId: payload.tutorId,
      fecha: payload.fecha,
      hora: payload.hora,
      tema: payload.tema.trim(),
      modalidad: payload.modalidad,
      estado: 'Confirmada',
      lugar: payload.lugar || (payload.modalidad === 'Presencial' ? 'Aula Magna de Asesorías / Cubículo' : undefined),
      enlaceVirtual: payload.enlaceVirtual || (payload.modalidad === 'Virtual' ? 'https://meet.google.com/tutoria-grupal-uat' : undefined),
      motivoDetalle: payload.motivoDetalle?.trim(),
      tipo: 'GRUPAL',
      esGrupal: true,
      confirmaciones
    };

    this.citas.unshift(nuevaCita);
    this.saveCitas();

    return {
      success: true,
      message: `Sesión grupal agendada exitosamente con ${payload.estudiantesIds.length} tutorados participantes.`,
      data: nuevaCita,
      statusCode: 201,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: PATCH /api/tutor/sesion-grupal/:id/participantes
   * Permite al tutor agregar o quitar tutorados de una sesión grupal existente
   */
  public async actualizarParticipantesSesionGrupal(
    citaId: string,
    nuevosEstudiantesIds: string[]
  ): Promise<ApiResponse<CitaAsesoria>> {
    const idx = this.citas.findIndex(c => c.id === citaId);
    if (idx === -1) {
      return {
        success: false,
        message: 'Sesión no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    const cita = this.citas[idx];
    const prevConf = cita.confirmaciones || {};
    const nuevaConf: Record<string, 'Confirmada' | 'Pendiente' | 'Rechazada'> = {};
    nuevosEstudiantesIds.forEach(id => {
      nuevaConf[id] = prevConf[id] || 'Pendiente';
    });

    cita.estudiantesIds = nuevosEstudiantesIds;
    cita.confirmaciones = nuevaConf;
    this.saveCitas();

    return {
      success: true,
      message: `Participantes de la sesión grupal actualizados (${nuevosEstudiantesIds.length} tutorados).`,
      data: cita,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: PATCH /api/alumno/sesion-grupal/:id/respuesta
   * Permite a un tutorado confirmar o rechazar su asistencia a la sesión grupal
   */
  public async responderCitaGrupalComoAlumno(
    citaId: string,
    estudianteId: string,
    respuesta: 'Confirmada' | 'Rechazada'
  ): Promise<ApiResponse<CitaAsesoria>> {
    const idx = this.citas.findIndex(c => c.id === citaId);
    if (idx === -1) {
      return {
        success: false,
        message: 'Sesión no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    const cita = this.citas[idx];
    if (!cita.confirmaciones) {
      cita.confirmaciones = {};
    }
    cita.confirmaciones[estudianteId] = respuesta;
    this.saveCitas();

    return {
      success: true,
      message: respuesta === 'Confirmada'
        ? 'Has confirmado tu asistencia a la sesión grupal de asesoría.'
        : 'Has declinado tu asistencia a la sesión grupal.',
      data: cita,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT VISTA ALUMNO: POST /api/alumno/solicitar-cita
   * Registra una nueva solicitud de asesoría o cita de tutoría (Individual o Grupal)
   */
  public async solicitarCitaComoAlumno(payload: SolicitarAsesoriaPayload): Promise<ApiResponse<CitaAsesoria>> {
    if (!payload.tema.trim() || !payload.fecha || !payload.hora) {
      return {
        success: false,
        message: 'Debe especificar el tema, la fecha y la hora para la cita de asesoría.',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    const esGrupal = payload.tipo === 'GRUPAL' || payload.estudianteId === 'TODOS' || payload.estudianteId === 'GRUPAL';

    const nuevaCita: CitaAsesoria = {
      id: 'cita-' + Date.now().toString(36),
      estudianteId: payload.estudianteId,
      tutorId: payload.tutorId,
      fecha: payload.fecha,
      hora: payload.hora,
      tema: payload.tema.trim(),
      modalidad: payload.modalidad,
      estado: 'Confirmada',
      lugar: payload.modalidad === 'Presencial'
        ? (payload.lugar || (esGrupal ? 'Aula Magna de Asesorías UAT - Edificio B' : 'Cubículo del Tutor (Confirmado)'))
        : undefined,
      enlaceVirtual: payload.modalidad === 'Virtual' ? (payload.enlaceVirtual || 'https://meet.google.com/tutoria-pro-sesion') : undefined,
      motivoDetalle: payload.motivoDetalle?.trim(),
      tipo: esGrupal ? 'GRUPAL' : 'INDIVIDUAL',
      esGrupal: esGrupal,
      estudiantesIds: payload.estudiantesIds && payload.estudiantesIds.length > 0
        ? payload.estudiantesIds
        : (payload.estudianteId && payload.estudianteId !== 'GRUPAL' && payload.estudianteId !== 'TODOS' ? [payload.estudianteId] : []),
      cupoMaximo: payload.cupoMaximo || (esGrupal ? 25 : 1)
    };

    this.citas.unshift(nuevaCita);
    this.saveCitas();

    const okRes: ApiResponse<CitaAsesoria> = {
      success: true,
      message: 'Cita de asesoría agendada con éxito en la agenda institucional.',
      data: nuevaCita,
      statusCode: 201,
      timestamp: new Date().toISOString()
    };

    this.logHttp('POST', '/api/alumno/solicitar-cita', 201, payload.tutorId, okRes, payload);
    return okRes;
  }

  /**
   * Cancelar cita (actualiza estado a 'Cancelada')
   */
  public async cancelarCitaComoAlumno(citaId: string): Promise<ApiResponse<{ id: string }>> {
    const idx = this.citas.findIndex(c => c.id === citaId);
    if (idx !== -1) {
      const citaActual = this.citas[idx];
      this.citas[idx] = {
        ...citaActual,
        estado: 'Cancelada'
      };
      this.citas = [...this.citas];
      this.saveCitas();
      this.logHttp('PATCH', `/api/citas/${citaId}/cancelar`, 200, citaActual.tutorId, { id: citaId, estado: 'Cancelada' });
    }
    return {
      success: true,
      message: 'Cita cancelada correctamente.',
      data: { id: citaId },
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  public async cancelarCitaComoTutor(citaId: string): Promise<ApiResponse<{ id: string }>> {
    return this.cancelarCitaComoAlumno(citaId);
  }

  /**
   * Elimina permanentemente una sesión de la agenda institucional
   */
  public async eliminarCita(citaId: string): Promise<ApiResponse<{ id: string }>> {
    const idx = this.citas.findIndex(c => c.id === citaId);
    if (idx !== -1) {
      const citaEliminada = this.citas[idx];
      this.citas = this.citas.filter(c => c.id !== citaId);
      this.saveCitas();
      this.logHttp('DELETE', `/api/citas/${citaId}`, 200, citaEliminada.tutorId, { id: citaId, deleted: true });
    }
    return {
      success: true,
      message: 'Sesión eliminada de la agenda institucional.',
      data: { id: citaId },
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: GET /api/tutor/citas
   * Recupera todas las citas del tutor (individuales de todos sus alumnos y sesiones grupales)
   */
  public async getCitasTutor(tutorId: string): Promise<ApiResponse<CitaAsesoria[]>> {
    const list = this.citas.filter(c => c.tutorId === tutorId || !c.tutorId);
    return {
      success: true,
      message: `Se recuperaron ${list.length} sesiones del tutor.`,
      data: list,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: GET /api/citas
   * Recupera todas las citas del sistema
   */
  public async getCitas(): Promise<ApiResponse<CitaAsesoria[]>> {
    return {
      success: true,
      message: `Se recuperaron ${this.citas.length} citas registradas.`,
      data: [...this.citas],
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: GET /api/archivos
   * Recupera archivos filtrados por tutorado, tutor o categoría
   */
  public async getArchivos(filtros?: {
    tutoradoId?: string;
    tutorId?: string;
    categoria?: string;
    rol?: string;
  }): Promise<ApiResponse<ArchivoSistema[]>> {
    // Si la memoria está vacía o contiene archivos sin contenidoDataUrl, hidratar desde IndexedDB
    const necesitaHidratar =
      this.archivos.length === 0 ||
      this.archivos.some((a) => !a.contenidoDataUrl || a.contenidoDataUrl === '[ALMACENADO_EN_INDEXEDDB]');

    if (necesitaHidratar) {
      try {
        const dbArchivos = await dbStorage.getAll<ArchivoSistema>('archivos');
        if (dbArchivos && dbArchivos.length > 0) {
          const dbMap = new Map(dbArchivos.map((a) => [String(a.id), a]));
          if (this.archivos.length === 0) {
            this.archivos = dbArchivos;
          } else {
            this.archivos = this.archivos.map((a) => {
              const fromDb = dbMap.get(String(a.id));
              if (fromDb && fromDb.contenidoDataUrl && (!a.contenidoDataUrl || a.contenidoDataUrl.length < fromDb.contenidoDataUrl.length)) {
                return { ...a, contenidoDataUrl: fromDb.contenidoDataUrl };
              }
              return a;
            });
            for (const d of dbArchivos) {
              if (!this.archivos.some((a) => String(a.id) === String(d.id))) {
                this.archivos.push(d);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error al leer archivos de IndexedDB:', e);
      }
    }

    let res = [...this.archivos];

    if (filtros?.tutoradoId && filtros.tutoradoId !== 'TODOS') {
      res = res.filter(
        (a) => a.tutoradoId === filtros.tutoradoId || a.autorId === filtros.tutoradoId || a.categoria === 'Material de Apoyo'
      );
    }

    if (filtros?.tutorId && filtros.tutorId !== 'TODOS') {
      res = res.filter((a) => a.tutorId === filtros.tutorId || !a.tutorId || a.autorId === filtros.tutorId);
    }

    if (filtros?.categoria && filtros.categoria !== 'TODAS') {
      res = res.filter((a) => a.categoria === filtros.categoria);
    }

    if (filtros?.rol && filtros.rol !== 'TODOS') {
      res = res.filter((a) => a.autorRol === filtros.rol);
    }

    // Ordenar de más reciente a más antiguo
    res.sort((a, b) => new Date(b.fechaSubida).getTime() - new Date(a.fechaSubida).getTime());

    return {
      success: true,
      message: `Se recuperaron ${res.length} archivos.`,
      data: res,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: POST /api/archivos/subir
   * Subida persistente de archivos (Evidencias de Tutorado o Material del Tutor)
   */
  public async subirArchivo(
    payload: SubirArchivoPayload,
    autor: { id: string; nombre: string; rol: 'TUTOR' | 'TUTORADO' }
  ): Promise<ApiResponse<ArchivoSistema>> {
    if (!payload.nombre || !payload.contenidoDataUrl) {
      return {
        success: false,
        message: 'Debe proporcionar un archivo válido con nombre y contenido.',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    const formatBytes = (bytes: number): string => {
      if (bytes < 1024) return bytes + ' B';
      const k = 1024;
      const dm = 1;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const nuevoArchivo: ArchivoSistema = {
      id: 'arch-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
      nombre: payload.nombre,
      tipo: payload.tipo || 'application/octet-stream',
      tamano: payload.tamano || 0,
      tamanoFormateado: formatBytes(payload.tamano || 0),
      fechaSubida: new Date().toISOString(),
      autorId: autor.id,
      autorNombre: autor.nombre,
      autorRol: autor.rol,
      tutoradoId: payload.tutoradoId,
      tutorId: payload.tutorId,
      actividadId: payload.actividadId,
      categoria: payload.categoria || (autor.rol === 'TUTOR' ? 'Material de Apoyo' : 'Evidencia'),
      descripcion: payload.descripcion?.trim(),
      contenidoDataUrl: payload.contenidoDataUrl,
      estadoRevision: 'Pendiente'
    };

    this.archivos.unshift(nuevoArchivo);

    // Guardar directamente en IndexedDB de inmediato
    try {
      await dbStorage.put('archivos', nuevoArchivo);
    } catch (e) {
      console.warn('Error al guardar archivo en IndexedDB:', e);
    }

    await this.saveArchivosAsync();

    const okRes: ApiResponse<ArchivoSistema> = {
      success: true,
      message: `Archivo "${nuevoArchivo.nombre}" subido exitosamente y almacenado de forma persistente.`,
      data: nuevoArchivo,
      statusCode: 201,
      timestamp: new Date().toISOString()
    };

    this.logHttp('POST', '/api/archivos/subir', 201, autor.id, okRes, {
      nombre: payload.nombre,
      categoria: payload.categoria
    });

    return okRes;
  }

  /**
   * ENDPOINT: PATCH /api/archivos/:id
   * Permite editar metadatos del archivo (nombre, categoría, descripción)
   */
  public async actualizarArchivo(
    payload: ActualizarArchivoPayload,
    usuarioId: string
  ): Promise<ApiResponse<ArchivoSistema>> {
    const idx = this.archivos.findIndex((a) => String(a.id) === String(payload.archivoId));
    if (idx === -1) {
      return {
        success: false,
        message: 'Archivo no encontrado.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    if (payload.nombre && payload.nombre.trim()) {
      this.archivos[idx].nombre = payload.nombre.trim();
    }
    if (payload.categoria) {
      this.archivos[idx].categoria = payload.categoria;
    }
    if (payload.descripcion !== undefined) {
      this.archivos[idx].descripcion = payload.descripcion.trim();
    }

    try {
      await dbStorage.put('archivos', this.archivos[idx]);
    } catch {}

    await this.saveArchivosAsync();

    const okRes: ApiResponse<ArchivoSistema> = {
      success: true,
      message: 'Documento actualizado correctamente.',
      data: this.archivos[idx],
      statusCode: 200,
      timestamp: new Date().toISOString()
    };

    this.logHttp('PATCH', `/api/archivos/${payload.archivoId}`, 200, usuarioId, okRes, payload);
    return okRes;
  }

  /**
   * ENDPOINT: PATCH /api/archivos/:id/revisar
   * Permite al Tutor marcar como revisado y agregar comentarios / retroalimentación
   */
  public async revisarArchivo(
    payload: RevisarArchivoPayload,
    tutorId: string
  ): Promise<ApiResponse<ArchivoSistema>> {
    const idx = this.archivos.findIndex((a) => a.id === payload.archivoId);
    if (idx === -1) {
      return {
        success: false,
        message: 'Archivo no encontrado.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    this.archivos[idx].estadoRevision = payload.estadoRevision;
    this.archivos[idx].comentarioTutor = payload.comentarioTutor?.trim();
    this.archivos[idx].fechaRevision = new Date().toISOString();

    try {
      await dbStorage.put('archivos', this.archivos[idx]);
    } catch {}

    await this.saveArchivosAsync();

    const okRes: ApiResponse<ArchivoSistema> = {
      success: true,
      message: `Revisión guardada con estado: ${payload.estadoRevision}.`,
      data: this.archivos[idx],
      statusCode: 200,
      timestamp: new Date().toISOString()
    };

    this.logHttp('PATCH', `/api/archivos/${payload.archivoId}/revisar`, 200, tutorId, okRes, payload);
    return okRes;
  }

  /**
   * ENDPOINT: PATCH /api/archivos/:id/editar
   * Permite editar la descripción, nombre, categoría o comentarios de un archivo
   */
  public async editarArchivo(
    payload: EditarArchivoPayload,
    usuario?: { id: string; rol: 'TUTOR' | 'TUTORADO' }
  ): Promise<ApiResponse<ArchivoSistema>> {
    const idx = this.archivos.findIndex(a => a.id === payload.archivoId);
    if (idx === -1) {
      return {
        success: false,
        message: 'Archivo no encontrado.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    const archivo = this.archivos[idx];

    // Permisos: Si es tutorado, sólo puede editar archivos donde él sea el autor
    if (usuario && usuario.rol === 'TUTORADO' && archivo.autorId !== usuario.id) {
      return {
        success: false,
        message: 'Acceso denegado: Sólo puedes editar los archivos que tú mismo has subido.',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
    }

    if (payload.nombre && payload.nombre.trim()) {
      archivo.nombre = payload.nombre.trim();
    }
    if (payload.descripcion !== undefined) {
      archivo.descripcion = payload.descripcion.trim();
    }
    if (payload.categoria) {
      archivo.categoria = payload.categoria;
    }
    if (payload.comentarioTutor !== undefined && (!usuario || usuario.rol === 'TUTOR')) {
      archivo.comentarioTutor = payload.comentarioTutor.trim();
      archivo.fechaRevision = new Date().toISOString();
    }

    this.saveArchivos();

    return {
      success: true,
      message: `Archivo "${archivo.nombre}" actualizado correctamente en el almacenamiento institucional.`,
      data: archivo,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: DELETE /api/archivos/:id
   */
  public async eliminarArchivo(
    archivoId: string,
    usuario?: { id: string; rol: 'TUTOR' | 'TUTORADO' }
  ): Promise<ApiResponse<{ id: string }>> {
    const idx = this.archivos.findIndex((a) => String(a.id) === String(archivoId));
    if (idx === -1) {
      return {
        success: false,
        message: 'Archivo no encontrado.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    const archivo = this.archivos[idx];
    if (usuario && usuario.rol === 'TUTORADO' && archivo.autorId !== usuario.id) {
      return {
        success: false,
        message: 'Acceso denegado: Solo puedes eliminar los archivos que tú mismo has subido.',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
    }

    const archivoEliminado = this.archivos.splice(idx, 1)[0];

    try {
      await dbStorage.delete('archivos', archivoId);
    } catch (e) {
      console.warn('Error al borrar archivo de IndexedDB:', e);
    }

    try {
      localStorage.setItem(ARCHIVOS_STORAGE_KEY, JSON.stringify(this.archivos));
    } catch {
      try {
        const ligero = this.archivos.map((a) => {
          if (a.contenidoDataUrl && a.contenidoDataUrl.length > 25000) {
            return { ...a, contenidoDataUrl: '' };
          }
          return a;
        });
        localStorage.setItem(ARCHIVOS_STORAGE_KEY, JSON.stringify(ligero));
      } catch {}
    }

    this.notify();

    return {
      success: true,
      message: `Documento "${archivoEliminado.nombre}" eliminado permanentemente.`,
      data: { id: archivoId },
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: GET /api/actividades
   * Listar actividades asignadas
   */
  public async getActividades(filtros?: {
    estudianteId?: string;
    tutorId?: string;
  }): Promise<ApiResponse<ActividadAsignada[]>> {
    let res = [...this.actividades];

    if (filtros?.estudianteId && filtros.estudianteId !== 'TODOS') {
      res = res.filter(a => a.estudianteId === 'TODOS' || a.estudianteId === filtros.estudianteId);
    }

    if (filtros?.tutorId && filtros.tutorId !== 'TODOS') {
      res = res.filter(a => a.tutorId === filtros.tutorId);
    }

    res.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

    return {
      success: true,
      message: `Se recuperaron ${res.length} actividades.`,
      data: res,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: POST /api/actividades/crear
   * Permite al Tutor crear y asignar una nueva actividad con archivos adjuntos
   */
  /**
   * ENDPOINT: POST /api/actividades/crear
   * Permite al Tutor crear y asignar una nueva actividad (Estilo Teams) con instrucciones detalladas
   */
  public async crearActividad(
    payload: CrearActividadPayload,
    tutor: { id: string; nombre: string }
  ): Promise<ApiResponse<ActividadAsignada>> {
    if (!payload.titulo.trim() || !payload.fechaLimite) {
      return {
        success: false,
        message: 'Debe ingresar el título de la actividad y la fecha límite de entrega.',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    const nuevaActividad: ActividadAsignada = {
      id: 'act-' + Date.now().toString(36),
      titulo: payload.titulo.trim(),
      descripcion: payload.descripcion.trim(),
      instruccionesDetalladas: payload.instruccionesDetalladas?.trim(),
      fechaLimite: payload.fechaLimite,
      tutorId: tutor.id,
      tutorNombre: tutor.nombre,
      estudianteId: payload.estudianteId || 'TODOS',
      estado: 'Pendiente',
      archivoAdjunto: payload.archivoAdjunto,
      fechaCreacion: new Date().toISOString(),
      entregas: []
    };

    this.actividades.unshift(nuevaActividad);
    this.saveActividades();

    const okRes: ApiResponse<ActividadAsignada> = {
      success: true,
      message: `Actividad "${nuevaActividad.titulo}" creada y asignada exitosamente.`,
      data: nuevaActividad,
      statusCode: 201,
      timestamp: new Date().toISOString()
    };

    this.logHttp('POST', '/api/actividades/crear', 201, tutor.id, okRes, payload);
    return okRes;
  }

  /**
   * ENDPOINT: PUT/PATCH /api/actividades/:id
   * Permite al Tutor editar una actividad existente de forma completa
   */
  public async editarActividad(
    payload: EditarActividadPayload,
    tutorId: string
  ): Promise<ApiResponse<ActividadAsignada>> {
    const idx = this.actividades.findIndex(a => a.id === payload.actividadId);
    if (idx === -1) {
      return {
        success: false,
        message: 'Actividad no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    const act = this.actividades[idx];
    if (act.tutorId !== tutorId) {
      return {
        success: false,
        message: 'No tienes autorización para editar esta actividad.',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
    }

    act.titulo = payload.titulo.trim();
    act.descripcion = payload.descripcion.trim();
    if (payload.instruccionesDetalladas !== undefined) {
      act.instruccionesDetalladas = payload.instruccionesDetalladas.trim();
    }
    act.fechaLimite = payload.fechaLimite;
    if (payload.estudianteId) {
      act.estudianteId = payload.estudianteId;
    }
    if (payload.archivoAdjunto !== undefined) {
      act.archivoAdjunto = payload.archivoAdjunto;
    }
    act.fechaModificacion = new Date().toISOString();

    this.saveActividades();

    return {
      success: true,
      message: `Actividad "${act.titulo}" actualizada exitosamente.`,
      data: act,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: DELETE /api/actividades/:id
   * Elimina una actividad del sistema
   */
  public async eliminarActividad(
    actividadId: string,
    tutorId: string
  ): Promise<ApiResponse<boolean>> {
    const idx = this.actividades.findIndex(a => a.id === actividadId);
    if (idx === -1) {
      return {
        success: false,
        message: 'Actividad no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    const act = this.actividades[idx];
    if (act.tutorId !== tutorId) {
      return {
        success: false,
        message: 'No tienes permisos para eliminar esta actividad.',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
    }

    this.actividades.splice(idx, 1);
    this.saveActividades();
    await dbStorage.delete('actividades', actividadId);

    return {
      success: true,
      message: 'Actividad eliminada correctamente.',
      data: true,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: POST /api/actividades/:id/entregar
   * Permite al alumno tutorado subir su entrega dentro de una actividad específica (Estilo Teams)
   */
  public async entregarActividad(
    payload: EntregarActividadPayload
  ): Promise<ApiResponse<EntregaActividad>> {
    const idx = this.actividades.findIndex(a => a.id === payload.actividadId);
    if (idx === -1) {
      return {
        success: false,
        message: 'Actividad no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    const act = this.actividades[idx];
    if (!act.entregas) {
      act.entregas = [];
    }

    // Verificar si ya entregó previamente
    const entregaIdx = act.entregas.findIndex(e => e.estudianteId === payload.estudianteId);
    let entregaResultado: EntregaActividad;

    if (entregaIdx >= 0) {
      // Actualizar entrega previa
      act.entregas[entregaIdx] = {
        ...act.entregas[entregaIdx],
        archivoAdjunto: payload.archivoAdjunto,
        comentariosEstudiante: payload.comentariosEstudiante?.trim(),
        fechaEntrega: new Date().toISOString(),
        estado: 'Entregada'
      };
      entregaResultado = act.entregas[entregaIdx];
    } else {
      // Crear nueva entrega
      entregaResultado = {
        id: 'ent-' + Date.now().toString(36),
        actividadId: payload.actividadId,
        estudianteId: payload.estudianteId,
        estudianteNombre: payload.estudianteNombre,
        estudianteMatricula: payload.estudianteMatricula,
        fechaEntrega: new Date().toISOString(),
        archivoAdjunto: payload.archivoAdjunto,
        comentariosEstudiante: payload.comentariosEstudiante?.trim(),
        estado: 'Entregada'
      };
      act.entregas.unshift(entregaResultado);
    }

    act.estado = 'Entregada';
    this.saveActividades();

    return {
      success: true,
      message: `Tarea entregada exitosamente para la actividad "${act.titulo}".`,
      data: entregaResultado,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: PATCH /api/actividades/:id/entregas/:entregaId/revisar
   * Permite al Tutor calificar, retroalimentar y cambiar estatus de una entrega
   */
  public async revisarEntregaActividad(
    payload: RevisarEntregaPayload,
    tutorId: string
  ): Promise<ApiResponse<EntregaActividad>> {
    const act = this.actividades.find(a => a.id === payload.actividadId);
    if (!act) {
      return {
        success: false,
        message: 'Actividad no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    if (act.tutorId !== tutorId) {
      return {
        success: false,
        message: 'No autorizado para revisar entregas de esta actividad.',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
    }

    if (!act.entregas) {
      act.entregas = [];
    }

    const entrega = act.entregas.find(e => e.id === payload.entregaId);
    if (!entrega) {
      return {
        success: false,
        message: 'Entrega no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    entrega.retroalimentacionTutor = payload.retroalimentacionTutor.trim();
    if (payload.calificacion !== undefined) {
      entrega.calificacion = payload.calificacion.trim();
    }
    entrega.fechaRevision = new Date().toISOString();

    // Asegurar que si se evalúa la entrega, su estado quede como 'Revisada' (salvo que sea 'Requiere Corrección')
    if (payload.estado === 'Requiere Corrección') {
      entrega.estado = 'Requiere Corrección';
    } else {
      entrega.estado = 'Revisada';
    }

    // Actualizar estado general de la actividad si todas están revisadas
    const pendientes = act.entregas.filter(e => e.estado === 'Entregada' && !e.calificacion && !e.fechaRevision);
    if (pendientes.length === 0 && act.entregas.length > 0) {
      act.estado = 'Revisada';
    }

    this.saveActividades();

    return {
      success: true,
      message: `Revisión guardada para ${entrega.estudianteNombre}. Estado: ${entrega.estado}.`,
      data: entrega,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: PATCH /api/actividades/:id/estado
   */
  public async actualizarEstadoActividad(
    actividadId: string,
    estado: 'Pendiente' | 'Entregada' | 'Revisada'
  ): Promise<ApiResponse<ActividadAsignada>> {
    const idx = this.actividades.findIndex(a => a.id === actividadId);
    if (idx === -1) {
      return {
        success: false,
        message: 'Actividad no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    this.actividades[idx].estado = estado;
    this.saveActividades();

    return {
      success: true,
      message: `Estado de la actividad actualizado a ${estado}.`,
      data: this.actividades[idx],
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  // ========================================================
  // 2. MÓDULO DE NOTAS Y BITÁCORAS DE SEGUIMIENTO (PERSISTENTE)
  // ========================================================

  /**
   * Registra una nota de seguimiento vinculada a un estudiante por su ID
   */
  public async agregarNotaPorEstudianteId(
    tutorId: string,
    estudianteId: string,
    tipo: NotaSeguimiento['tipo'],
    contenido: string,
    citaId?: string
  ): Promise<ApiResponse<NotaSeguimiento>> {
    let asig = this.asignaciones.find(a => a.tutorId === tutorId && a.estudianteId === estudianteId);

    if (!asig) {
      // Si el tutorado aún no tiene asignación formal, creamos una para almacenar la nota
      const estudiantes = await this.getCatalogoEstudiantes();
      const estudiante = estudiantes.find(e => e.id === estudianteId) || {
        id: estudianteId,
        matricula: '2026-UAT-001',
        nombre: 'Estudiante Tutorado',
        email: 'alumno@uat.edu.mx',
        carrera: 'Ingeniería en Sistemas Computacionales',
        semestre: 1,
        promedio: 0,
        telefono: '',
        avatar: ''
      };

      asig = {
        id: 'asig-' + Date.now().toString(36),
        tutorId,
        estudianteId,
        estudiante,
        fechaAsignacion: new Date().toISOString(),
        periodoEscolar: '2026-1',
        estado: 'ACTIVO',
        notas: []
      };
      this.asignaciones.unshift(asig);
    }

    const nuevaNota: NotaSeguimiento = {
      id: 'nota-' + Date.now().toString(36),
      fecha: new Date().toISOString(),
      tipo,
      contenido: citaId ? `[Sesión: ${citaId}] ${contenido}` : contenido,
      autorId: tutorId
    };

    if (!asig.notas) asig.notas = [];
    asig.notas.unshift(nuevaNota);
    this.save();

    return {
      success: true,
      message: 'Nota de seguimiento registrada con éxito en el expediente del tutorado.',
      data: nuevaNota,
      statusCode: 201,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Registra acuerdos u observaciones al concluir una sesión de tutoría
   */
  public async registrarAcuerdoSesion(
    payload: RegistrarAcuerdoSesionPayload
  ): Promise<ApiResponse<NotaSeguimiento>> {
    const textoNota = payload.observaciones?.trim()
      ? `Acuerdos: ${payload.acuerdos.trim()} | Observaciones: ${payload.observaciones.trim()}`
      : payload.acuerdos.trim();

    const resNota = await this.agregarNotaPorEstudianteId(
      payload.tutorId,
      payload.estudianteId,
      payload.tipo,
      textoNota,
      payload.citaId
    );

    // Si viene vinculado a una cita, marcamos la cita como Completada
    if (payload.citaId) {
      const idxCita = this.citas.findIndex(c => c.id === payload.citaId);
      if (idxCita >= 0) {
        this.citas[idxCita].estado = 'Completada';
        this.saveCitas();
      }
    }

    return resNota;
  }

  /**
   * Recupera todas las notas de seguimiento del tutor para vista general
   */
  public async getTodasLasNotasSeguimiento(tutorId: string): Promise<ApiResponse<Array<NotaSeguimiento & {
    asignacionId: string;
    estudianteId: string;
    estudianteNombre: string;
    estudianteMatricula: string;
    estudianteCarrera: string;
    periodoEscolar: string;
  }>>> {
    const misAsignaciones = this.asignaciones.filter(a => a.tutorId === tutorId);
    const todas: Array<NotaSeguimiento & {
      asignacionId: string;
      estudianteId: string;
      estudianteNombre: string;
      estudianteMatricula: string;
      estudianteCarrera: string;
      periodoEscolar: string;
    }> = [];

    misAsignaciones.forEach(asig => {
      if (asig.notas && asig.notas.length > 0) {
        asig.notas.forEach(n => {
          todas.push({
            ...n,
            asignacionId: asig.id,
            estudianteId: asig.estudianteId,
            estudianteNombre: asig.estudiante?.nombre || 'Tutorado',
            estudianteMatricula: asig.estudiante?.matricula || '',
            estudianteCarrera: asig.estudiante?.carrera || '',
            periodoEscolar: asig.periodoEscolar
          });
        });
      }
    });

    todas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return {
      success: true,
      message: `Se recuperaron ${todas.length} notas de seguimiento.`,
      data: todas,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Elimina una nota de seguimiento de la bitácora
   */
  public async eliminarNotaSeguimiento(
    tutorId: string,
    asignacionId: string,
    notaId: string
  ): Promise<ApiResponse<boolean>> {
    const asig = this.asignaciones.find(a => a.id === asignacionId && a.tutorId === tutorId);
    if (!asig || !asig.notas) {
      return {
        success: false,
        message: 'Nota o asignación no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    asig.notas = asig.notas.filter(n => n.id !== notaId);
    this.save();

    return {
      success: true,
      message: 'Nota de seguimiento eliminada permanentemente.',
      data: true,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  // ========================================================
  // 3. DISPONIBILIDAD SEMANAL Y PROPUESTAS DE HORARIO
  // ========================================================

  /**
   * Recupera la disponibilidad semanal configurada por el tutor
   */
  public async getDisponibilidadTutor(tutorId: string): Promise<ApiResponse<DisponibilidadTutor>> {
    let disp = this.disponibilidades.find(d => d.tutorId === tutorId);
    if (!disp) {
      // Default si aún no ha configurado
      disp = {
        tutorId,
        diasLaborales: [1, 2, 3, 4, 5],
        bloques: [
          { diaSemana: 1, horaInicio: '09:00', horaFin: '13:00', modalidad: 'Presencial', activo: true },
          { diaSemana: 2, horaInicio: '10:00', horaFin: '14:00', modalidad: 'Presencial', activo: true },
          { diaSemana: 3, horaInicio: '09:00', horaFin: '13:00', modalidad: 'Ambas', activo: true },
          { diaSemana: 4, horaInicio: '11:00', horaFin: '15:00', modalidad: 'Virtual', activo: true },
          { diaSemana: 5, horaInicio: '09:00', horaFin: '13:00', modalidad: 'Presencial', activo: true }
        ],
        duracionSesionMinutos: 45,
        modalidadPreferida: 'Híbrida',
        lugarHabitual: 'Cubículo 204, Edificio B',
        enlaceMeetHabitual: 'https://meet.google.com/uat-tut-2026',
        ultimaActualizacion: new Date().toISOString()
      };
      this.disponibilidades.push(disp);
      this.saveDisponibilidad();
    }

    return {
      success: true,
      message: 'Disponibilidad semanal del tutor recuperada.',
      data: disp,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Guarda o actualiza la disponibilidad semanal del tutor
   */
  public async guardarDisponibilidadTutor(
    payload: GuardarDisponibilidadPayload
  ): Promise<ApiResponse<DisponibilidadTutor>> {
    const idx = this.disponibilidades.findIndex(d => d.tutorId === payload.tutorId);
    const dispActualizada: DisponibilidadTutor = {
      tutorId: payload.tutorId,
      diasLaborales: payload.diasLaborales,
      bloques: payload.bloques,
      duracionSesionMinutos: payload.duracionSesionMinutos || 45,
      modalidadPreferida: payload.modalidadPreferida || 'Híbrida',
      lugarHabitual: payload.lugarHabitual?.trim(),
      enlaceMeetHabitual: payload.enlaceMeetHabitual?.trim(),
      ultimaActualizacion: new Date().toISOString()
    };

    if (idx >= 0) {
      this.disponibilidades[idx] = dispActualizada;
    } else {
      this.disponibilidades.push(dispActualizada);
    }

    this.saveDisponibilidad();

    return {
      success: true,
      message: 'Tu horario de disponibilidad semanal ha sido guardado y publicado.',
      data: dispActualizada,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Recupera propuestas de horarios alternativos
   */
  public async getPropuestasHorario(filtros?: {
    tutorId?: string;
    estudianteId?: string;
    estado?: EstadoPropuestaHorario;
  }): Promise<ApiResponse<PropuestaHorario[]>> {
    let res = [...this.propuestasHorarios];

    if (filtros?.tutorId) {
      res = res.filter(p => p.tutorId === filtros.tutorId);
    }
    if (filtros?.estudianteId) {
      res = res.filter(p => p.estudianteId === filtros.estudianteId);
    }
    if (filtros?.estado) {
      res = res.filter(p => p.estado === filtros.estado);
    }

    res.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

    return {
      success: true,
      message: `Se recuperaron ${res.length} propuestas de horario.`,
      data: res,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Permite al tutorado (alumno) proponer un horario alternativo
   */
  public async crearPropuestaHorario(
    payload: CrearPropuestaHorarioPayload
  ): Promise<ApiResponse<PropuestaHorario>> {
    if (!payload.fechaPropuesta || !payload.horaPropuesta || !payload.motivoCambio.trim()) {
      return {
        success: false,
        message: 'Debe especificar la fecha, la hora propuesta y el motivo del cambio de horario.',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    const nuevaPropuesta: PropuestaHorario = {
      id: 'prop-' + Date.now().toString(36),
      citaId: payload.citaId,
      estudianteId: payload.estudianteId,
      estudianteNombre: payload.estudianteNombre,
      estudianteMatricula: payload.estudianteMatricula,
      tutorId: payload.tutorId,
      tema: payload.tema,
      modalidad: payload.modalidad,
      fechaPropuesta: payload.fechaPropuesta,
      horaPropuesta: payload.horaPropuesta,
      motivoCambio: payload.motivoCambio.trim(),
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString()
    };

    this.propuestasHorarios.unshift(nuevaPropuesta);
    this.savePropuestas();

    return {
      success: true,
      message: 'Propuesta de horario alternativo enviada al tutor. Recibirás respuesta en tu portal.',
      data: nuevaPropuesta,
      statusCode: 201,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Permite al Tutor aceptar o rechazar una propuesta de horario alternativo
   */
  public async responderPropuestaHorario(
    payload: ResponderPropuestaHorarioPayload
  ): Promise<ApiResponse<{ propuesta: PropuestaHorario; citaActualizada?: CitaAsesoria }>> {
    const idx = this.propuestasHorarios.findIndex(p => p.id === payload.propuestaId);
    if (idx === -1) {
      return {
        success: false,
        message: 'Propuesta de horario no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    const propuesta = this.propuestasHorarios[idx];
    if (propuesta.tutorId !== payload.tutorId) {
      return {
        success: false,
        message: 'No tienes autorización para responder a esta propuesta.',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
    }

    let citaActualizada: CitaAsesoria | undefined;

    if (payload.accion === 'aceptar') {
      propuesta.estado = 'Aceptada';
      propuesta.motivoRespuestaTutor = payload.motivoRespuesta?.trim() || 'Horario alternativo aceptado.';
      propuesta.fechaRespuesta = new Date().toISOString();

      if (propuesta.citaId) {
        // Actualizar la cita existente
        const citaIdx = this.citas.findIndex(c => c.id === propuesta.citaId);
        if (citaIdx >= 0) {
          this.citas[citaIdx].fecha = propuesta.fechaPropuesta;
          this.citas[citaIdx].hora = propuesta.horaPropuesta;
          this.citas[citaIdx].modalidad = propuesta.modalidad;
          this.citas[citaIdx].estado = 'Confirmada';
          this.citas[citaIdx].motivoDetalle = `${this.citas[citaIdx].motivoDetalle || ''} [Reprogramada por acuerdo: ${propuesta.fechaPropuesta} ${propuesta.horaPropuesta}]`.trim();
          citaActualizada = this.citas[citaIdx];
        }
      } else {
        // Crear una nueva cita confirmada
        const nuevaCita: CitaAsesoria = {
          id: 'cita-' + Date.now().toString(36),
          estudianteId: propuesta.estudianteId,
          tutorId: propuesta.tutorId,
          fecha: propuesta.fechaPropuesta,
          hora: propuesta.horaPropuesta,
          tema: propuesta.tema,
          modalidad: propuesta.modalidad,
          estado: 'Confirmada',
          motivoDetalle: `Sesión agendada mediante propuesta de horario alternativo acordada.`,
          tipo: 'INDIVIDUAL',
          lugar: propuesta.modalidad === 'Presencial' ? 'Cubículo de Asesoría' : undefined,
          enlaceVirtual: propuesta.modalidad === 'Virtual' ? 'https://meet.google.com/uat-tut-2026' : undefined
        };
        this.citas.unshift(nuevaCita);
        citaActualizada = nuevaCita;
      }
      this.saveCitas();
    } else {
      propuesta.estado = 'Rechazada';
      propuesta.motivoRespuestaTutor = payload.motivoRespuesta?.trim() || 'El horario solicitado no se encuentra disponible.';
      propuesta.fechaRespuesta = new Date().toISOString();
    }

    this.savePropuestas();

    return {
      success: true,
      message: payload.accion === 'aceptar'
        ? `Propuesta aceptada. La sesión ha sido agendada en el calendario para el ${propuesta.fechaPropuesta} a las ${propuesta.horaPropuesta}.`
        : 'Propuesta de horario rechazada.',
      data: {
        propuesta,
        citaActualizada
      },
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: GET /api/notas-personales
   * Recupera notas personales del usuario (persistidas en IndexedDB y LocalStorage)
   */
  public async getNotasPersonales(filtro?: {
    alumnoId?: string;
    tutorId?: string;
    tipoSeccion?: 'todas' | 'personal' | 'seguimiento';
  } | string): Promise<ApiResponse<NotaPersonalItem[]>> {
    let res = [...this.notas];
    if (typeof filtro === 'string') {
      res = res.filter(n => !n.alumnoId || n.alumnoId === filtro);
    } else if (filtro) {
      if (filtro.alumnoId) {
        res = res.filter(n => !n.alumnoId || n.alumnoId === filtro.alumnoId);
      }
      if (filtro.tipoSeccion && filtro.tipoSeccion !== 'todas') {
        res = res.filter(n => (n.tipoSeccion || 'personal') === filtro.tipoSeccion);
      }
    }
    return {
      success: true,
      message: `Se recuperaron ${res.length} notas personales.`,
      data: res,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: POST /api/notas-personales
   * Guarda o actualiza una nota personal de forma persistente en IndexedDB y LocalStorage
   */
  public async guardarNotaPersonal(
    payload: Partial<NotaPersonalItem> & { texto: string; id?: string | number }
  ): Promise<ApiResponse<NotaPersonalItem>> {
    const ahora = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const ahoraIso = new Date().toISOString();

    let notaGuardada: NotaPersonalItem;
    if (payload.id) {
      const idx = this.notas.findIndex(n => String(n.id) === String(payload.id));
      if (idx >= 0) {
        this.notas[idx] = {
          ...this.notas[idx],
          ...payload,
          id: this.notas[idx].id,
          categoria: (payload.categoria || this.notas[idx].categoria || 'General') as CategoriaNotaPersonal,
          tipoSeccion: payload.tipoSeccion || this.notas[idx].tipoSeccion || (payload.estudianteId ? 'seguimiento' : 'personal'),
          updatedAt: ahoraIso
        };
        notaGuardada = this.notas[idx];
      } else {
        notaGuardada = {
          id: payload.id,
          titulo: payload.titulo?.trim() || '',
          texto: payload.texto.trim(),
          categoria: (payload.categoria || 'General') as CategoriaNotaPersonal,
          tipoSeccion: payload.tipoSeccion || (payload.estudianteId ? 'seguimiento' : 'personal'),
          alumnoId: payload.alumnoId,
          tutorId: payload.tutorId,
          autorId: payload.autorId,
          autorRol: payload.autorRol,
          estudianteId: payload.estudianteId,
          estudianteNombre: payload.estudianteNombre,
          estudianteMatricula: payload.estudianteMatricula,
          fijada: payload.fijada ?? false,
          fecha: ahora,
          updatedAt: ahoraIso
        };
        this.notas.unshift(notaGuardada);
      }
    } else {
      notaGuardada = {
        id: `nota-${Date.now()}`,
        titulo: payload.titulo?.trim() || '',
        texto: payload.texto.trim(),
        categoria: (payload.categoria || 'General') as CategoriaNotaPersonal,
        tipoSeccion: payload.tipoSeccion || (payload.estudianteId ? 'seguimiento' : 'personal'),
        alumnoId: payload.alumnoId,
        tutorId: payload.tutorId,
        autorId: payload.autorId,
        autorRol: payload.autorRol,
        estudianteId: payload.estudianteId,
        estudianteNombre: payload.estudianteNombre,
        estudianteMatricula: payload.estudianteMatricula,
        fijada: payload.fijada ?? false,
        fecha: ahora,
        updatedAt: ahoraIso
      };
      this.notas.unshift(notaGuardada);
    }

    this.saveNotas();

    return {
      success: true,
      message: 'Nota guardada exitosamente.',
      data: notaGuardada,
      statusCode: 201,
      timestamp: ahoraIso
    };
  }

  /**
   * Fija o desfija una nota en el bloc de notas
   */
  public async toggleFijarNota(id: string | number): Promise<ApiResponse<NotaPersonalItem>> {
    const idx = this.notas.findIndex(n => String(n.id) === String(id));
    if (idx === -1) {
      return {
        success: false,
        message: 'Nota no encontrada.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }
    this.notas[idx].fijada = !this.notas[idx].fijada;
    this.saveNotas();
    return {
      success: true,
      message: this.notas[idx].fijada ? 'Nota fijada al inicio.' : 'Nota desfijada.',
      data: this.notas[idx],
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: DELETE /api/notas-personales/:id
   */
  public async eliminarNotaPersonal(id: string | number): Promise<ApiResponse<boolean>> {
    this.notas = this.notas.filter(n => String(n.id) !== String(id));
    this.saveNotas();
    try {
      await dbStorage.delete('notas', id);
    } catch {}

    return {
      success: true,
      message: 'Nota eliminada correctamente.',
      data: true,
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Retorna el catálogo dinámico de estudiantes persistido
   */
  public async getCatalogoEstudiantes(): Promise<EstudianteCatalogo[]> {
    const extraKey = 'sistema_tutorias_estudiantes_extra_v1';
    let extra: EstudianteCatalogo[] = [];
    try {
      const raw = localStorage.getItem(extraKey);
      if (raw) extra = JSON.parse(raw);
    } catch {}

    const dbEstudiantes = await dbStorage.getAll<EstudianteCatalogo>('estudiantes');
    dbEstudiantes.forEach(e => {
      if (!extra.some(c => c.id === e.id || c.email.toLowerCase() === e.email.toLowerCase())) {
        extra.push(e);
      }
    });

    // Asegurar siempre el perfil institucional oficial de la estudiante con su promedio
    if (!extra.some(e => e.id === 'est-activo' || e.email.toLowerCase() === 'ana.morales@alumno.uat.edu.mx')) {
      const estOficial: EstudianteCatalogo = {
        id: 'est-activo',
        matricula: '2026-ISC-101',
        nombre: 'Ana Lucía Morales Rivera',
        email: 'ana.morales@alumno.uat.edu.mx',
        carrera: 'Ingeniería en Sistemas Computacionales',
        semestre: 4,
        promedio: 9.4,
        telefono: '+52 834 112 3344',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80'
      };
      extra.push(estOficial);
      try {
        localStorage.setItem(extraKey, JSON.stringify(extra));
        dbStorage.put('estudiantes', estOficial).catch(() => {});
      } catch {}
    } else {
      // Garantizar que si existe, tenga el promedio asignado
      const ana = extra.find(e => e.id === 'est-activo' || e.email.toLowerCase() === 'ana.morales@alumno.uat.edu.mx');
      if (ana && (ana.promedio === undefined || ana.promedio === 0)) {
        ana.promedio = 9.4;
      }
    }

    return extra;
  }

  /**
   * Retorna el catálogo dinámico de tutores persistido con personalizaciones aplicadas
   */
  public async getCatalogoTutores(): Promise<Tutor[]> {
    const extraKey = 'sistema_tutorias_tutores_extra_v1';
    let extra: Tutor[] = [];
    try {
      const raw = localStorage.getItem(extraKey);
      if (raw) extra = JSON.parse(raw);
    } catch {}

    const dbTutores = await dbStorage.getAll<Tutor>('tutores');
    dbTutores.forEach((t) => {
      if (!extra.some((c) => c.id === t.id || c.email.toLowerCase() === t.email.toLowerCase())) {
        extra.push(t);
      }
    });

    // Asegurar siempre el perfil institucional oficial del docente tutor
    if (!extra.some(t => t.id === 'tutor-activo' || t.email.toLowerCase() === 'roberto.mendoza@uat.edu.mx')) {
      const tutorOficial: Tutor = {
        id: 'tutor-activo',
        nombre: 'Dr. Roberto Mendoza Salinas',
        email: 'roberto.mendoza@uat.edu.mx',
        departamento: 'Facultad de Ingeniería y Ciencias',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
        rol: 'tutor',
        cubículo: 'Edificio Central, Cubículo 101'
      };
      extra.push(tutorOficial);
      try {
        localStorage.setItem(extraKey, JSON.stringify(extra));
        dbStorage.put('tutores', tutorOficial).catch(() => {});
      } catch {}
    }

    return extra;
  }

  /**
   * Actualiza los datos del tutor (nombre, avatar, cubículo, etc.) de forma persistente y reactiva
   */
  public async actualizarTutor(
    tutorId: string,
    cambios: Partial<Omit<Tutor, 'id' | 'rol'>>
  ): Promise<Tutor> {
    const extraKey = 'sistema_tutorias_tutores_extra_v1';
    let extra: Tutor[] = [];
    try {
      const raw = localStorage.getItem(extraKey);
      if (raw) extra = JSON.parse(raw);
    } catch {}

    const idx = extra.findIndex((t) => t.id === tutorId);
    const tutorActualizado: Tutor = {
      ...(idx >= 0
        ? extra[idx]
        : {
            id: tutorId,
            nombre: cambios.nombre || 'Docente Tutor',
            email: cambios.email || 'docente@uat.edu.mx',
            departamento: cambios.departamento || 'Facultad de Ingeniería y Ciencias',
            avatar: cambios.avatar || '',
            rol: 'tutor' as const,
            cubículo: cambios.cubículo || 'Cubículo 101'
          }),
      ...cambios
    };

    if (idx >= 0) {
      extra[idx] = tutorActualizado;
    } else {
      extra.push(tutorActualizado);
    }

    try {
      localStorage.setItem(extraKey, JSON.stringify(extra));
      await dbStorage.put('tutores', tutorActualizado);
    } catch {}

    this.notify();
    return tutorActualizado;
  }

  /**
   * Actualiza los datos de un estudiante/tutorado de forma persistente y reactiva
   */
  public async actualizarEstudiante(
    estudianteId: string,
    cambios: Partial<Omit<EstudianteCatalogo, 'id'>>
  ): Promise<EstudianteCatalogo> {
    const extraKey = 'sistema_tutorias_estudiantes_extra_v1';
    let extra: EstudianteCatalogo[] = [];
    try {
      const raw = localStorage.getItem(extraKey);
      if (raw) extra = JSON.parse(raw);
    } catch {}

    const idx = extra.findIndex((e) => e.id === estudianteId);
    const estActualizado: EstudianteCatalogo = {
      ...(idx >= 0
        ? extra[idx]
        : {
            id: estudianteId,
            nombre: cambios.nombre || 'Estudiante',
            email: cambios.email || 'alumno@uat.edu.mx',
            carrera: cambios.carrera || 'Ingeniería en Sistemas Computacionales',
            matricula: cambios.matricula || '2026-UAT-001',
            semestre: cambios.semestre || 1,
            promedio: 0,
            avatar: cambios.avatar || '',
            telefono: cambios.telefono || ''
          }),
      ...cambios
    };

    if (idx >= 0) {
      extra[idx] = estActualizado;
    } else {
      extra.push(estActualizado);
    }

    try {
      localStorage.setItem(extraKey, JSON.stringify(extra));
      await dbStorage.put('estudiantes', estActualizado);
    } catch {}

    // Sincronizar en cascada con asignaciones activas del estudiante
    let modificadoAsignacion = false;
    this.asignaciones.forEach((a) => {
      if (a.estudianteId === estudianteId) {
        a.estudiante = { ...a.estudiante, ...estActualizado };
        modificadoAsignacion = true;
      }
    });
    if (modificadoAsignacion) {
      this.save();
    }

    this.notify();
    return estActualizado;
  }

  /**
   * Obtiene métricas en vivo del motor de persistencia (IndexedDB + LocalStorage)
   */
  public async getEstadisticasPersistencia(): Promise<EstadisticasPersistencia> {
    const usuarios = await dbStorage.getAll('usuarios');
    const tutores = await this.getCatalogoTutores();
    const estudiantes = await this.getCatalogoEstudiantes();

    return {
      totalUsuarios: usuarios.length,
      totalTutores: tutores.length,
      totalEstudiantes: estudiantes.length,
      totalAsignaciones: this.asignaciones.length,
      totalCitas: this.citas.length,
      totalArchivos: this.archivos.length,
      totalActividades: this.actividades.length,
      totalNotas: this.notas.length,
      motor: 'IndexedDB (W3C) + LocalStorage',
      estado: 'Sincronizado y Persistente'
    };
  }

  /**
   * Exporta toda la base de datos a un archivo JSON para respaldo o entrega
   */
  public async exportarBaseDeDatosJSON(): Promise<string> {
    const data = await dbStorage.exportAllData();
    // Asegurar que las colecciones en memoria actuales estén incluidas
    data.asignaciones = this.asignaciones;
    data.citas = this.citas;
    data.archivos = this.archivos;
    data.actividades = this.actividades;
    data.notas = this.notas;
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importa y reemplaza la base de datos completa desde un respaldo JSON
   */
  public async importarBaseDeDatosJSON(jsonStr: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonStr);
      await dbStorage.importAllData(parsed);

      if (Array.isArray(parsed.asignaciones)) this.asignaciones = parsed.asignaciones;
      if (Array.isArray(parsed.citas)) this.citas = parsed.citas;
      if (Array.isArray(parsed.archivos)) this.archivos = parsed.archivos;
      if (Array.isArray(parsed.actividades)) this.actividades = parsed.actividades;
      if (Array.isArray(parsed.notas)) this.notas = parsed.notas;

      this.save();
      this.saveCitas();
      this.saveArchivos();
      this.saveActividades();
      this.saveNotas();

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resetear a valores de fábrica para pruebas
   */
  public async resetToDefault() {
    this.asignaciones = [];
    this.citas = [];
    this.archivos = [];
    this.actividades = [];
    this.notas = [];

    this.save();
    this.saveCitas();
    this.saveArchivos();
    this.saveActividades();
    this.saveNotas();
  }

  /**
   * Eliminar todos los datos mock / de prueba hardcodeados (dejar base de datos limpia)
   */
  public async vaciarDatosMock() {
    this.asignaciones = [];
    this.citas = [];
    this.archivos = [];
    this.actividades = [];
    this.notas = [];

    this.save();
    this.saveCitas();
    this.saveArchivos();
    this.saveActividades();
    this.saveNotas();

    await dbStorage.clear('asignaciones');
    await dbStorage.clear('citas');
    await dbStorage.clear('archivos');
    await dbStorage.clear('actividades');
    await dbStorage.clear('notas');
  }
}

export const tutoriaService = new TutoriaBackendService();

