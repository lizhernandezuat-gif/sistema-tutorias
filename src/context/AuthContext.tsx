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
  usuariosRegistrados: Array<Omit<UsuarioSistema, 'passwordHash'>>;
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
  const [sesion, setSesion] = useState<SesionAutenticada | null>(() =>
    authService.obtenerSesionActiva()
  );
  const [usuariosRegistrados, setUsuariosRegistrados] = useState<
    Array<Omit<UsuarioSistema, 'passwordHash'>>
  >(() => authService.getUsuariosRegistrados());

  useEffect(() => {
    const syncState = () => {
      setSesion(authService.obtenerSesionActiva());
      setUsuariosRegistrados(authService.getUsuariosRegistrados());
    };
    const unsubscribe = authService.subscribe(syncState);
    return () => unsubscribe();
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    if (res.success && res.data) {
      setSesion(res.data);
      setUsuariosRegistrados(authService.getUsuariosRegistrados());
    }
    return res;
  };

  const registrar = async (payload: RegistroUsuarioPayload) => {
    const res = await authService.registrarUsuario(payload);
    if (res.success && res.data) {
      setSesion(res.data);
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
      setUsuariosRegistrados(authService.getUsuariosRegistrados());
    }
  };

  const logout = () => {
    authService.logout();
    setSesion(null);
  };

  const verificarRuta = (rolesPermitidos?: RolUsuario[]) => {
    const check = authService.middlewareAutorizacion(sesion?.token || null, rolesPermitidos);
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
        isAuthenticated: Boolean(sesion),
        usuariosRegistrados,
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
