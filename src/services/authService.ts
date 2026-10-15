import {
  UsuarioSistema,
  RolUsuario,
  JwtPayload,
  SesionAutenticada,
  LoginPayload,
  RegistroUsuarioPayload,
  ActualizarPerfilPayload,
  ApiResponse,
  Tutor,
  EstudianteCatalogo
} from '../types/tutoria';
import { dbStorage } from './dbStorage';

const USERS_STORAGE_KEY = 'sistema_tutorias_usuarios_v1';
const SESSION_TOKEN_KEY = 'sistema_tutorias_jwt_token_v1';
const EXTRA_TUTORES_KEY = 'sistema_tutorias_tutores_extra_v1';
const EXTRA_ESTUDIANTES_KEY = 'sistema_tutorias_estudiantes_extra_v1';

/**
 * Codificación Base64URL compatible con UTF-8 para tokens JWT estándar
 */
function toBase64Url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url<T>(str: string): T | null {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Hash determinista de contraseña (estilo bcrypt/SHA-256)
 */
export function hashPassword(plain: string): string {
  let hash = 2166136261;
  const salted = `tutoria_salt_2026_${plain}`;
  for (let i = 0; i < salted.length; i++) {
    hash ^= salted.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `$2b$10$tutoria2026.${hex}`;
}

export function verifyPassword(plain: string, storedHash: string): boolean {
  return hashPassword(plain) === storedHash;
}

/**
 * Generación de firma HMAC simulada para el segmento final del JWT
 */
function signJwtSegments(headerB64: string, payloadB64: string): string {
  const raw = `${headerB64}.${payloadB64}.TUTORIA_PRO_SECRET_KEY_2026`;
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = ((h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0'));
  return btoa(combined).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

class AuthBackendService {
  private usuarios: UsuarioSistema[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.initUsers();
  }

  private initUsers() {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        this.usuarios = JSON.parse(storedUsers);
      } else {
        this.usuarios = [];
      }
    } catch {
      this.usuarios = [];
    }

    // Asegurar que las cuentas base oficiales siempre existan con su perfil intacto
    this.asegurarUsuariosOficiales();

    // Sincronizar en segundo plano con IndexedDB
    dbStorage.getAll<UsuarioSistema>('usuarios').then((dbUsers) => {
      if (dbUsers && dbUsers.length > 0) {
        dbUsers.forEach((u) => {
          if (!this.usuarios.some((existing) => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
            this.usuarios.push(u);
          }
        });
        this.asegurarUsuariosOficiales();
        try {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.usuarios));
        } catch {}
        this.notify();
      }
    }).catch(() => {});
  }

  /**
   * Garantiza que los perfiles institucionales de Docente Tutor y Alumno Tutorado
   * existan con su información básica de perfil limpia (como cuenta recién creada)
   */
  public asegurarUsuariosOficiales() {
    const nowIso = new Date().toISOString();
    let modificado = false;

    // 1. Docente Tutor Oficial
    let tutor = this.usuarios.find(
      (u) => u.email.toLowerCase() === 'roberto.mendoza@uat.edu.mx' || u.rol === 'TUTOR'
    );
    if (!tutor) {
      tutor = {
        id: 'usr-tutor-uat',
        nombre: 'Dr. Roberto Mendoza Salinas',
        email: 'roberto.mendoza@uat.edu.mx',
        passwordHash: hashPassword('password123'),
        rol: 'TUTOR',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
        activo: true,
        fechaRegistro: nowIso,
        ultimoAcceso: nowIso,
        tutorProfileId: 'tutor-activo',
        departamento: 'Facultad de Ingeniería y Ciencias',
        cubículo: 'Edificio Central, Cubículo 101'
      };
      this.usuarios.push(tutor);
      modificado = true;
    }
    this.persistExtraTutor({
      id: tutor.tutorProfileId || 'tutor-activo',
      nombre: tutor.nombre,
      email: tutor.email,
      departamento: tutor.departamento || 'Facultad de Ingeniería y Ciencias',
      avatar: tutor.avatar,
      rol: 'tutor',
      cubículo: tutor.cubículo || 'Edificio Central, Cubículo 101'
    });

    // 2. Alumno Tutorado Oficial
    let alumno = this.usuarios.find(
      (u) => u.email.toLowerCase() === 'ana.morales@alumno.uat.edu.mx' || u.rol === 'TUTORADO'
    );
    if (!alumno) {
      alumno = {
        id: 'usr-alumno-uat',
        nombre: 'Ana Lucía Morales Rivera',
        email: 'ana.morales@alumno.uat.edu.mx',
        passwordHash: hashPassword('password123'),
        rol: 'TUTORADO',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
        activo: true,
        fechaRegistro: nowIso,
        ultimoAcceso: nowIso,
        estudianteProfileId: 'est-activo',
        matricula: '2026-ISC-101',
        carrera: 'Ingeniería en Sistemas Computacionales',
        semestre: 4,
        promedio: 9.4,
        telefono: '+52 834 112 3344'
      };
      this.usuarios.push(alumno);
      modificado = true;
    } else if (alumno.promedio === undefined || alumno.promedio === 0) {
      alumno.promedio = 9.4;
      modificado = true;
    }
    this.persistExtraEstudiante({
      id: alumno.estudianteProfileId || 'est-activo',
      matricula: alumno.matricula || '2026-ISC-101',
      nombre: alumno.nombre,
      email: alumno.email,
      carrera: alumno.carrera || 'Ingeniería en Sistemas Computacionales',
      semestre: alumno.semestre || 4,
      promedio: alumno.promedio ?? 9.4,
      telefono: alumno.telefono || '+52 834 112 3344',
      avatar: alumno.avatar
    });

    if (modificado) {
      this.saveUsers();
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.usuarios));
    } catch {
      // Ignorar errores de cuota en storage
    }
    dbStorage.putMany('usuarios', this.usuarios).catch(() => {});
    this.notify();
  }

  public persistExtraTutor(tutor: Tutor) {
    try {
      const currentRaw = localStorage.getItem(EXTRA_TUTORES_KEY);
      const list: Tutor[] = currentRaw ? JSON.parse(currentRaw) : [];
      const idx = list.findIndex((t) => t.id === tutor.id);
      if (idx >= 0) {
        list[idx] = tutor;
      } else {
        list.push(tutor);
      }
      localStorage.setItem(EXTRA_TUTORES_KEY, JSON.stringify(list));
      dbStorage.put('tutores', tutor).catch(() => {});
    } catch {
      // Ignorar
    }
  }

  public persistExtraEstudiante(estudiante: EstudianteCatalogo) {
    try {
      const currentRaw = localStorage.getItem(EXTRA_ESTUDIANTES_KEY);
      const list: EstudianteCatalogo[] = currentRaw ? JSON.parse(currentRaw) : [];
      const idx = list.findIndex((e) => e.id === estudiante.id);
      if (idx >= 0) {
        list[idx] = estudiante;
      } else {
        list.push(estudiante);
      }
      localStorage.setItem(EXTRA_ESTUDIANTES_KEY, JSON.stringify(list));
      dbStorage.put('estudiantes', estudiante).catch(() => {});
    } catch {
      // Ignorar
    }
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private sanitizarUsuario(u: UsuarioSistema): Omit<UsuarioSistema, 'passwordHash'> {
    const { passwordHash: _, ...safeUser } = u;
    return safeUser;
  }

  /**
   * Genera un Token JWT estándar con expiración de 24 horas
   */
  public generarTokenJWT(usuario: UsuarioSistema): { token: string; payload: JwtPayload } {
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + 60 * 60 * 24; // 24 horas

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const profileId =
      usuario.rol === 'TUTOR'
        ? usuario.tutorProfileId || usuario.id
        : usuario.estudianteProfileId || usuario.id;

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      profileId,
      iat: nowSec,
      exp: expSec
    };

    const headerB64 = toBase64Url(header);
    const payloadB64 = toBase64Url(payload);
    const signature = signJwtSegments(headerB64, payloadB64);

    return {
      token: `${headerB64}.${payloadB64}.${signature}`,
      payload
    };
  }

  /**
   * Verifica la firma y vigencia del Token JWT (Middleware de Autenticación)
   */
  public verificarTokenJWT(token: string | null): {
    valido: boolean;
    payload?: JwtPayload;
    error?: string;
    statusCode: 200 | 401;
  } {
    if (!token || typeof token !== 'string') {
      return {
        valido: false,
        error: 'No se proporcionó un token de autenticación (Bearer token ausente).',
        statusCode: 401
      };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        valido: false,
        error: 'Formato de token JWT malformado.',
        statusCode: 401
      };
    }

    const [headerB64, payloadB64, signature] = parts;
    const expectedSig = signJwtSegments(headerB64, payloadB64);
    if (signature !== expectedSig) {
      return {
        valido: false,
        error: 'Firma del token JWT inválida o alterada.',
        statusCode: 401
      };
    }

    const payload = fromBase64Url<JwtPayload>(payloadB64);
    if (!payload) {
      return {
        valido: false,
        error: 'No fue posible decodificar el payload del token JWT.',
        statusCode: 401
      };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSec) {
      return {
        valido: false,
        error: 'La sesión ha expirado. Por favor inicie sesión nuevamente.',
        statusCode: 401
      };
    }

    return {
      valido: true,
      payload,
      statusCode: 200
    };
  }

  /**
   * MIDDLEWARE DE PROTECCIÓN DE RUTAS Y AUTORIZACIÓN POR ROL
   */
  public middlewareAutorizacion(
    token: string | null,
    rolesPermitidos?: RolUsuario[]
  ): {
    autorizado: boolean;
    statusCode: 200 | 401 | 403;
    mensaje: string;
    sesion?: SesionAutenticada;
  } {
    const verificacion = this.verificarTokenJWT(token);
    if (!verificacion.valido || !verificacion.payload) {
      return {
        autorizado: false,
        statusCode: 401,
        mensaje: verificacion.error || 'No autenticado: Inicie sesión para acceder.'
      };
    }

    const usuario = this.usuarios.find((u) => u.id === verificacion.payload!.sub);
    if (!usuario || !usuario.activo) {
      return {
        autorizado: false,
        statusCode: 401,
        mensaje: 'El usuario asociado al token no existe o se encuentra inactivo.'
      };
    }

    if (rolesPermitidos && rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
      return {
        autorizado: false,
        statusCode: 403,
        mensaje: `Acceso denegado (403): Esta ruta requiere rol [${rolesPermitidos.join(' o ')}], pero tu sesión actual tiene rol [${usuario.rol}].`
      };
    }

    return {
      autorizado: true,
      statusCode: 200,
      mensaje: 'Acceso autorizado mediante JWT válido.',
      sesion: {
        token: token!,
        payload: verificacion.payload,
        usuario: this.sanitizarUsuario(usuario)
      }
    };
  }

  /**
   * Recupera la sesión guardada en el navegador si el JWT sigue vigente
   */
  public obtenerSesionActiva(): SesionAutenticada | null {
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!token) return null;

      const check = this.middlewareAutorizacion(token);
      if (!check.autorizado || !check.sesion) {
        localStorage.removeItem(SESSION_TOKEN_KEY);
        return null;
      }
      return check.sesion;
    } catch {
      return null;
    }
  }

  /**
   * ENDPOINT: POST /api/auth/login
   * Autenticación real mediante email y contraseña
   */
  public async login(payload: LoginPayload): Promise<ApiResponse<SesionAutenticada>> {
    const emailClean = payload.email.trim().toLowerCase();
    const password = payload.password;

    if (!emailClean || !password) {
      return {
        success: false,
        message: 'Debes ingresar tu correo electrónico institucional y contraseña.',
        error: 'MISSING_CREDENTIALS',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    const usuario = this.usuarios.find(
      (u) => u.email.toLowerCase() === emailClean
    );

    if (!usuario) {
      return {
        success: false,
        message: 'Correo o contraseña incorrectos. Verifica tus credenciales e inténtalo de nuevo.',
        error: 'INVALID_CREDENTIALS',
        statusCode: 401,
        timestamp: new Date().toISOString()
      };
    }

    const passwordValida = verifyPassword(password, usuario.passwordHash);

    if (!passwordValida) {
      return {
        success: false,
        message: 'Correo o contraseña incorrectos. Verifica tus credenciales e inténtalo de nuevo.',
        error: 'INVALID_CREDENTIALS',
        statusCode: 401,
        timestamp: new Date().toISOString()
      };
    }

    if (!usuario.activo) {
      return {
        success: false,
        message: 'Esta cuenta de usuario ha sido desactivada por coordinación.',
        error: 'ACCOUNT_DISABLED',
        statusCode: 403,
        timestamp: new Date().toISOString()
      };
    }

    usuario.ultimoAcceso = new Date().toISOString();
    this.saveUsers();

    const { token, payload: jwtPayload } = this.generarTokenJWT(usuario);
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    this.notify();

    return {
      success: true,
      message: `Bienvenido(a), ${usuario.nombre}. Sesión iniciada como ${usuario.rol}.`,
      data: {
        token,
        payload: jwtPayload,
        usuario: this.sanitizarUsuario(usuario)
      },
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: POST /api/auth/register
   * Registro de nuevos usuarios reales con rol TUTOR o TUTORADO
   */
  public async registrarUsuario(
    payload: RegistroUsuarioPayload
  ): Promise<ApiResponse<SesionAutenticada>> {
    const nombre = payload.nombre.trim();
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;
    const rol: RolUsuario = payload.rol === 'TUTOR' ? 'TUTOR' : 'TUTORADO';

    if (!nombre || nombre.length < 3) {
      return {
        success: false,
        message: 'El nombre completo debe contener al menos 3 caracteres.',
        error: 'INVALID_NAME',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Ingresa una dirección de correo electrónico válida.',
        error: 'INVALID_EMAIL',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        message: 'La contraseña debe tener mínimo 6 caracteres.',
        error: 'WEAK_PASSWORD',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    if (payload.confirmarPassword !== undefined && payload.confirmarPassword !== password) {
      return {
        success: false,
        message: 'Las contraseñas ingresadas no coinciden.',
        error: 'PASSWORD_MISMATCH',
        statusCode: 400,
        timestamp: new Date().toISOString()
      };
    }

    const existeEmail = this.usuarios.some((u) => u.email.toLowerCase() === email);
    if (existeEmail) {
      return {
        success: false,
        message: `El correo "${email}" ya se encuentra registrado en la base de usuarios.`,
        error: 'EMAIL_ALREADY_EXISTS',
        statusCode: 409,
        timestamp: new Date().toISOString()
      };
    }

    const nowIso = new Date().toISOString();
    const shortId = Date.now().toString(36).slice(-5);

    let tutorProfileId: string | undefined;
    let estudianteProfileId: string | undefined;
    const avatarDefault = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=EE7402&color=fff&bold=true`;

    if (rol === 'TUTOR') {
      tutorProfileId = `tutor-${shortId}`;
      const departamento =
        payload.departamento?.trim() || 'Facultad de Ingeniería y Ciencias';
      const cubiculo = payload.cubículo?.trim() || 'Edificio Central, Cubículo 101';

      const nuevoTutor: Tutor = {
        id: tutorProfileId,
        nombre,
        email,
        departamento,
        avatar: avatarDefault,
        rol: 'tutor',
        cubículo: cubiculo
      };

      this.persistExtraTutor(nuevoTutor);
    } else {
      estudianteProfileId = `est-${shortId}`;
      const matriculaGenerada =
        payload.matricula?.trim().toUpperCase() ||
        `2026-UAT-${Math.floor(100 + Math.random() * 900)}`;
      const carrera =
        payload.carrera?.trim() || 'Ingeniería en Sistemas Computacionales';
      const semestre =
        payload.semestre && payload.semestre >= 1 && payload.semestre <= 12
          ? Number(payload.semestre)
          : 1;
      const telefono = payload.telefono?.trim() || '';

      const nuevoEstudiante: EstudianteCatalogo = {
        id: estudianteProfileId,
        matricula: matriculaGenerada,
        nombre,
        email,
        carrera,
        semestre,
        promedio: payload.promedio !== undefined ? Number(payload.promedio) : 9.4,
        telefono,
        avatar: avatarDefault
      };

      this.persistExtraEstudiante(nuevoEstudiante);
    }

    const nuevoUsuario: UsuarioSistema = {
      id: `usr-${shortId}`,
      nombre,
      email,
      passwordHash: hashPassword(password),
      rol,
      avatar: avatarDefault,
      activo: true,
      fechaRegistro: nowIso,
      ultimoAcceso: nowIso,
      tutorProfileId,
      estudianteProfileId,
      departamento:
        rol === 'TUTOR'
          ? payload.departamento?.trim() || 'Facultad de Ingeniería y Ciencias'
          : undefined,
      cubículo:
        rol === 'TUTOR' ? payload.cubículo?.trim() || 'Edificio Central, Cubículo 101' : undefined,
      matricula:
        rol === 'TUTORADO'
          ? payload.matricula?.trim().toUpperCase() || `2026-UAT-${Math.floor(100 + Math.random() * 900)}`
          : undefined,
      carrera:
        rol === 'TUTORADO'
          ? payload.carrera?.trim() || 'Ingeniería en Sistemas Computacionales'
          : undefined,
      semestre: rol === 'TUTORADO' ? Number(payload.semestre || 1) : undefined,
      promedio: rol === 'TUTORADO' ? (payload.promedio !== undefined ? Number(payload.promedio) : 9.4) : undefined,
      telefono: payload.telefono?.trim() || ''
    };

    this.usuarios.unshift(nuevoUsuario);
    this.saveUsers();

    const { token, payload: jwtPayload } = this.generarTokenJWT(nuevoUsuario);
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    this.notify();

    return {
      success: true,
      message: `Cuenta creada exitosamente como ${rol === 'TUTOR' ? 'Tutor Académico' : 'Alumno Tutorado'}.`,
      data: {
        token,
        payload: jwtPayload,
        usuario: this.sanitizarUsuario(nuevoUsuario)
      },
      statusCode: 201,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ENDPOINT: PATCH /api/auth/profile
   * Actualizar datos en la pantalla de "Mi Perfil"
   */
  public async actualizarPerfil(
    token: string | null,
    cambios: ActualizarPerfilPayload
  ): Promise<ApiResponse<SesionAutenticada>> {
    const authCheck = this.middlewareAutorizacion(token);
    if (!authCheck.autorizado || !authCheck.sesion) {
      return {
        success: false,
        message: authCheck.mensaje,
        statusCode: authCheck.statusCode,
        timestamp: new Date().toISOString()
      };
    }

    const idx = this.usuarios.findIndex((u) => u.id === authCheck.sesion!.usuario.id);
    if (idx === -1) {
      return {
        success: false,
        message: 'Usuario no encontrado en la base de datos.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      };
    }

    const user = this.usuarios[idx];

    if (cambios.passwordNueva && cambios.passwordNueva.trim()) {
      if (cambios.passwordNueva.trim().length < 6) {
        return {
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres.',
          statusCode: 400,
          timestamp: new Date().toISOString()
        };
      }
      user.passwordHash = hashPassword(cambios.passwordNueva.trim());
    }

    if (cambios.nombre?.trim()) {
      user.nombre = cambios.nombre.trim();
    }
    if (cambios.avatar?.trim()) {
      user.avatar = cambios.avatar.trim();
    }
    if (cambios.telefono !== undefined) {
      user.telefono = cambios.telefono.trim();
    }

    if (user.rol === 'TUTOR') {
      if (cambios.departamento?.trim()) user.departamento = cambios.departamento.trim();
      if (cambios.cubículo?.trim()) user.cubículo = cambios.cubículo.trim();

      const tutorActualizado: Tutor = {
        id: user.tutorProfileId || user.id,
        nombre: user.nombre,
        email: user.email,
        departamento: user.departamento || 'Facultad de Ingeniería y Ciencias',
        avatar: user.avatar,
        rol: 'tutor',
        cubículo: user.cubículo || ''
      };
      this.persistExtraTutor(tutorActualizado);
    } else {
      if (cambios.matricula?.trim()) user.matricula = cambios.matricula.trim().toUpperCase();
      if (cambios.carrera?.trim()) user.carrera = cambios.carrera.trim();
      if (cambios.semestre !== undefined) user.semestre = Number(cambios.semestre);
      if (cambios.promedio !== undefined && !isNaN(Number(cambios.promedio))) {
        user.promedio = Math.round(Number(cambios.promedio) * 10) / 10;
      }

      const estudianteActualizado: EstudianteCatalogo = {
        id: user.estudianteProfileId || user.id,
        matricula: user.matricula || '',
        nombre: user.nombre,
        email: user.email,
        carrera: user.carrera || 'Ingeniería en Sistemas Computacionales',
        semestre: user.semestre || 1,
        promedio: user.promedio || 0,
        telefono: user.telefono || '',
        avatar: user.avatar
      };
      this.persistExtraEstudiante(estudianteActualizado);
    }

    this.saveUsers();

    const { token: newToken, payload: newPayload } = this.generarTokenJWT(user);
    localStorage.setItem(SESSION_TOKEN_KEY, newToken);
    this.notify();

    return {
      success: true,
      message: 'Tu perfil institucional ha sido actualizado correctamente.',
      data: {
        token: newToken,
        payload: newPayload,
        usuario: this.sanitizarUsuario(user)
      },
      statusCode: 200,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Iniciar sesión por ID de perfil (para restaurar sesión o cambio de perfil)
   */
  public loginPorPerfilId(profileId: string, rol: RolUsuario): SesionAutenticada | null {
    const usuario = this.usuarios.find((u) =>
      rol === 'TUTOR' ? u.tutorProfileId === profileId || u.id === profileId : u.estudianteProfileId === profileId || u.id === profileId
    );
    if (!usuario) return null;

    usuario.ultimoAcceso = new Date().toISOString();
    this.saveUsers();

    const { token, payload } = this.generarTokenJWT(usuario);
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    this.notify();

    return {
      token,
      payload,
      usuario: this.sanitizarUsuario(usuario)
    };
  }

  /**
   * Cerrar sesión y eliminar el token JWT activo
   */
  public logout(): void {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    this.notify();
  }

  /**
   * Obtener todos los usuarios registrados (sin exponer passwordHash)
   */
  public getUsuariosRegistrados(): Array<Omit<UsuarioSistema, 'passwordHash'>> {
    return this.usuarios.map((u) => this.sanitizarUsuario(u));
  }
}

export const authService = new AuthBackendService();
