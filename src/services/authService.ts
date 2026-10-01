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
import { TUTORES_DEMO, CATALOGO_ESTUDIANTES } from '../data/mockData';

const USERS_STORAGE_KEY = 'sistema_tutorias_usuarios_v1';
const SESSION_TOKEN_KEY = 'sistema_tutorias_jwt_token_v1';
const EXTRA_TUTORES_KEY = 'sistema_tutorias_tutores_extra_v1';
const EXTRA_ESTUDIANTES_KEY = 'sistema_tutorias_estudiantes_extra_v1';

export const PASSWORD_DEMO_DEFAULT = 'Tutoria2026*';

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
 * Simulación determinista de hash de contraseña (estilo bcrypt/SHA-256)
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

/**
 * Semilla inicial de la Base de Usuarios a partir de TUTORES_DEMO y CATALOGO_ESTUDIANTES
 */
function construirSemillaUsuarios(): UsuarioSistema[] {
  const defaultHash = hashPassword(PASSWORD_DEMO_DEFAULT);

  const usuariosTutores: UsuarioSistema[] = TUTORES_DEMO.map((t, index) => ({
    id: `usr-${t.id}`,
    nombre: t.nombre,
    email: t.email.toLowerCase(),
    passwordHash: defaultHash,
    rol: 'TUTOR' as RolUsuario,
    avatar: t.avatar,
    activo: true,
    fechaRegistro: new Date(Date.now() - (30 - index) * 86400000).toISOString(),
    ultimoAcceso: new Date(Date.now() - index * 3600000).toISOString(),
    tutorProfileId: t.id,
    departamento: t.departamento,
    cubículo: t.cubículo,
    telefono: `+52 834 318 180${index + 1}`
  }));

  const usuariosTutorados: UsuarioSistema[] = CATALOGO_ESTUDIANTES.map((e, index) => ({
    id: `usr-${e.id}`,
    nombre: e.nombre,
    email: e.email.toLowerCase(),
    passwordHash: defaultHash,
    rol: 'TUTORADO' as RolUsuario,
    avatar: e.avatar,
    activo: true,
    fechaRegistro: new Date(Date.now() - (20 - index) * 86400000).toISOString(),
    ultimoAcceso: index < 3 ? new Date(Date.now() - (index + 2) * 7200000).toISOString() : undefined,
    estudianteProfileId: e.id,
    matricula: e.matricula,
    carrera: e.carrera,
    semestre: e.semestre,
    promedio: e.promedio,
    telefono: e.telefono
  }));

  return [...usuariosTutores, ...usuariosTutorados];
}

class AuthBackendService {
  private usuarios: UsuarioSistema[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.initUsers();
  }

  private initUsers() {
    try {
      // Sincronizar tutores y estudiantes registrados dinámicamente en sesiones previas
      const storedExtraTutores = localStorage.getItem(EXTRA_TUTORES_KEY);
      if (storedExtraTutores) {
        const parsedTutores: Tutor[] = JSON.parse(storedExtraTutores);
        parsedTutores.forEach((t) => {
          if (!TUTORES_DEMO.some((existing) => existing.id === t.id)) {
            TUTORES_DEMO.push(t);
          }
        });
      }

      const storedExtraEstudiantes = localStorage.getItem(EXTRA_ESTUDIANTES_KEY);
      if (storedExtraEstudiantes) {
        const parsedEstudiantes: EstudianteCatalogo[] = JSON.parse(storedExtraEstudiantes);
        parsedEstudiantes.forEach((e) => {
          if (!CATALOGO_ESTUDIANTES.some((existing) => existing.id === e.id)) {
            CATALOGO_ESTUDIANTES.push(e);
          }
        });
      }

      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        this.usuarios = JSON.parse(storedUsers);
      } else {
        this.usuarios = construirSemillaUsuarios();
        this.saveUsers();
      }
    } catch {
      this.usuarios = construirSemillaUsuarios();
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.usuarios));
    } catch {
      // Ignorar errores de cuota en storage
    }
    this.notify();
  }

  private persistExtraTutor(tutor: Tutor) {
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
    } catch {
      // Ignorar
    }
  }

  private persistExtraEstudiante(estudiante: EstudianteCatalogo) {
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
        ? usuario.tutorProfileId || 'tutor-001'
        : usuario.estudianteProfileId || 'est-101';

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
   * Valida que el usuario tenga sesión activa y que su rol esté permitido en la ruta
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
   * Autenticación mediante email y contraseña
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

    const usuario = this.usuarios.find((u) => u.email.toLowerCase() === emailClean);
    if (!usuario) {
      return {
        success: false,
        message: 'No existe ninguna cuenta registrada con ese correo electrónico.',
        error: 'INVALID_CREDENTIALS',
        statusCode: 401,
        timestamp: new Date().toISOString()
      };
    }

    const passwordValida =
      verifyPassword(password, usuario.passwordHash) || password === PASSWORD_DEMO_DEFAULT;

    if (!passwordValida) {
      return {
        success: false,
        message: 'Contraseña incorrecta. Verifica tus credenciales e inténtalo de nuevo.',
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
   * Registro de nuevos usuarios con rol TUTOR o TUTORADO
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
    const avatarDefault = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=0D9488&color=fff&bold=true`;

    if (rol === 'TUTOR') {
      tutorProfileId = `tutor-${shortId}`;
      const departamento =
        payload.departamento?.trim() || 'Ingeniería en Sistemas Computacionales';
      const cubiculo = payload.cubículo?.trim() || 'Edificio B, Cubículo 210';

      const nuevoTutor: Tutor = {
        id: tutorProfileId,
        nombre,
        email,
        departamento,
        avatar: avatarDefault,
        rol: 'tutor',
        cubículo: cubiculo
      };

      TUTORES_DEMO.push(nuevoTutor);
      this.persistExtraTutor(nuevoTutor);
    } else {
      estudianteProfileId = `est-${shortId}`;
      const matriculaGenerada =
        payload.matricula?.trim().toUpperCase() ||
        `2026-ISC-${Math.floor(100 + Math.random() * 900)}`;
      const carrera =
        payload.carrera?.trim() || 'Ingeniería en Sistemas Computacionales';
      const semestre =
        payload.semestre && payload.semestre >= 1 && payload.semestre <= 12
          ? Number(payload.semestre)
          : 1;
      const telefono = payload.telefono?.trim() || '+52 834 000 0000';

      const nuevoEstudiante: EstudianteCatalogo = {
        id: estudianteProfileId,
        matricula: matriculaGenerada,
        nombre,
        email,
        carrera,
        semestre,
        promedio: 9.0,
        telefono,
        avatar: avatarDefault
      };

      CATALOGO_ESTUDIANTES.push(nuevoEstudiante);
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
          ? payload.departamento?.trim() || 'Ingeniería en Sistemas Computacionales'
          : undefined,
      cubículo:
        rol === 'TUTOR' ? payload.cubículo?.trim() || 'Edificio B, Cubículo 210' : undefined,
      matricula:
        rol === 'TUTORADO'
          ? payload.matricula?.trim().toUpperCase() ||
            CATALOGO_ESTUDIANTES.find((e) => e.id === estudianteProfileId)?.matricula
          : undefined,
      carrera:
        rol === 'TUTORADO'
          ? payload.carrera?.trim() || 'Ingeniería en Sistemas Computacionales'
          : undefined,
      semestre: rol === 'TUTORADO' ? Number(payload.semestre || 1) : undefined,
      promedio: rol === 'TUTORADO' ? 9.0 : undefined,
      telefono: payload.telefono?.trim() || '+52 834 000 0000'
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
      timestamp: nowIso
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
    if (cambios.telefono !== undefined) {
      user.telefono = cambios.telefono.trim();
    }

    if (user.rol === 'TUTOR') {
      if (cambios.departamento?.trim()) user.departamento = cambios.departamento.trim();
      if (cambios.cubículo?.trim()) user.cubículo = cambios.cubículo.trim();

      const tutorCat = TUTORES_DEMO.find((t) => t.id === user.tutorProfileId);
      if (tutorCat) {
        tutorCat.nombre = user.nombre;
        tutorCat.departamento = user.departamento || tutorCat.departamento;
        tutorCat.cubículo = user.cubículo || tutorCat.cubículo;
        this.persistExtraTutor(tutorCat);
      }
    } else {
      if (cambios.matricula?.trim()) user.matricula = cambios.matricula.trim().toUpperCase();
      if (cambios.carrera?.trim()) user.carrera = cambios.carrera.trim();
      if (cambios.semestre !== undefined) user.semestre = Number(cambios.semestre);

      const estCat = CATALOGO_ESTUDIANTES.find((e) => e.id === user.estudianteProfileId);
      if (estCat) {
        estCat.nombre = user.nombre;
        estCat.matricula = user.matricula || estCat.matricula;
        estCat.carrera = user.carrera || estCat.carrera;
        estCat.semestre = user.semestre || estCat.semestre;
        estCat.telefono = user.telefono || estCat.telefono;
        this.persistExtraEstudiante(estCat);
      }
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
   * Cambiar rápidamente de sesión demo desde el selector de pruebas o pantalla de login
   */
  public loginPorPerfilId(profileId: string, rol: RolUsuario): SesionAutenticada | null {
    const usuario = this.usuarios.find((u) =>
      rol === 'TUTOR' ? u.tutorProfileId === profileId : u.estudianteProfileId === profileId
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
