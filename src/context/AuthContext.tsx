import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SesionAutenticada,
  LoginPayload,
  RegistroUsuarioPayload,
  ActualizarPerfilPayload,
  RolUsuario,
  UsuarioSistema,
  ApiResponse
} from '../types/tutoria';
import { authService } from '../services/authService';

interface AuthContextType {
  sesion: SesionAutenticada | null;
  isAuthenticated: boolean;
  isLoggedIn: boolean;
  rolUsuario: 'tutor' | 'alumno' | null;
  usuariosRegistrados: Array<Omit<UsuarioSistema, 'passwordHash'>>;
  autenticar: (email: string, password: string) => Promise<{
    success: boolean;
    message?: string;
    rol?: 'tutor' | 'alumno';
  }>;
  iniciarSesionDirecta: (rol: 'tutor' | 'alumno') => void;
  login: (payload: LoginPayload) => Promise<ApiResponse<SesionAutenticada>>;
  registrar: (payload: RegistroUsuarioPayload) => Promise<ApiResponse<SesionAutenticada>>;
  actualizarPerfil: (payload: ActualizarPerfilPayload) => Promise<ApiResponse<SesionAutenticada>>;
  cambiarPerfilDemo: (profileId: string, rol: RolUsuario) => void;
  logout: () => void;
  verificarRuta: (rolesPermitidos?: RolUsuario[]) => {
    autorizado: boolean;
    statusCode: 200 | 401 | 403;
    mensaje: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sesion, setSesion] = useState<SesionAutenticada | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [rolUsuario, setRolUsuario] = useState<'tutor' | 'alumno' | null>(null);

  const [usuariosRegistrados, setUsuariosRegistrados] = useState<
    Array<Omit<UsuarioSistema, 'passwordHash'>>
  >(() => authService.getUsuariosRegistrados());

  // Restaurar sesión activa de JWT en el arranque
  useEffect(() => {
    const sesionActiva = authService.obtenerSesionActiva();
    if (sesionActiva) {
      setSesion(sesionActiva);
      setIsAuthenticated(true);
      setRolUsuario(sesionActiva.usuario.rol === 'TUTOR' ? 'tutor' : 'alumno');
    }

    const syncState = () => {
      setUsuariosRegistrados(authService.getUsuariosRegistrados());
    };
    const unsubscribe = authService.subscribe(syncState);
    return () => unsubscribe();
  }, []);

  const autenticar = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    if (res.success && res.data) {
      setSesion(res.data);
      setIsAuthenticated(true);
      const rol = res.data.usuario.rol === 'TUTOR' ? ('tutor' as const) : ('alumno' as const);
      setRolUsuario(rol);
      setUsuariosRegistrados(authService.getUsuariosRegistrados());
      return { success: true, rol };
    }
    return {
      success: false,
      message: res.message || 'Correo o contraseña incorrectos. Verifica tus credenciales e inténtalo de nuevo.'
    };
  };

  const iniciarSesionDirecta = (rol: 'tutor' | 'alumno') => {
    const targetRol: RolUsuario = rol === 'tutor' ? 'TUTOR' : 'TUTORADO';
    const usuarios = authService.getUsuariosRegistrados();
    const usuarioMatch = usuarios.find((u) => u.rol === targetRol);
    if (usuarioMatch) {
      const nuevaSesion = authService.loginPorPerfilId(usuarioMatch.id, targetRol);
      if (nuevaSesion) {
        setSesion(nuevaSesion);
        setIsAuthenticated(true);
        setRolUsuario(rol);
      }
    }
  };

  const login = async (payload: LoginPayload): Promise<ApiResponse<SesionAutenticada>> => {
    const res = await authService.login(payload);
    if (res.success && res.data) {
      setSesion(res.data);
      setIsAuthenticated(true);
      setRolUsuario(res.data.usuario.rol === 'TUTOR' ? 'tutor' : 'alumno');
      setUsuariosRegistrados(authService.getUsuariosRegistrados());
    }
    return res;
  };

  const registrar = async (payload: RegistroUsuarioPayload): Promise<ApiResponse<SesionAutenticada>> => {
    const res = await authService.registrarUsuario(payload);
    if (res.success && res.data) {
      setSesion(res.data);
      setIsAuthenticated(true);
      setRolUsuario(res.data.usuario.rol === 'TUTOR' ? 'tutor' : 'alumno');
      setUsuariosRegistrados(authService.getUsuariosRegistrados());
    }
    return res;
  };

  const actualizarPerfil = async (payload: ActualizarPerfilPayload) => {
    const res = await authService.actualizarPerfil(sesion?.token || null, payload);
    if (res.success && res.data) {
      setSesion(res.data);
      setUsuariosRegistrados(authService.getUsuariosRegistrados());
    }
    return res;
  };

  const cambiarPerfilDemo = (profileId: string, rol: RolUsuario) => {
    const nuevaSesion = authService.loginPorPerfilId(profileId, rol);
    if (nuevaSesion) {
      setSesion(nuevaSesion);
      setIsAuthenticated(true);
      setRolUsuario(rol === 'TUTOR' ? 'tutor' : 'alumno');
      setUsuariosRegistrados(authService.getUsuariosRegistrados());
    }
  };

  const logout = () => {
    authService.logout();
    setSesion(null);
    setIsAuthenticated(false);
    setRolUsuario(null);
  };

  const verificarRuta = (rolesPermitidos?: RolUsuario[]) => {
    if (!isAuthenticated || !sesion) {
      return {
        autorizado: false,
        statusCode: 401 as const,
        mensaje: 'Debe iniciar sesión para acceder al sistema institucional.'
      };
    }
    const check = authService.middlewareAutorizacion(sesion.token, rolesPermitidos);
    return {
      autorizado: check.autorizado,
      statusCode: check.statusCode,
      mensaje: check.mensaje
    };
  };

  return (
    <AuthContext.Provider
      value={{
        sesion,
        isAuthenticated,
        isLoggedIn: isAuthenticated,
        rolUsuario,
        usuariosRegistrados,
        autenticar,
        iniciarSesionDirecta,
        login,
        registrar,
        actualizarPerfil,
        cambiarPerfilDemo,
        logout,
        verificarRuta
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return ctx;
};
