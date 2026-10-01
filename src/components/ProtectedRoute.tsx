import React from 'react';
import { useAuth } from '../context/AuthContext';
import { RolUsuario } from '../types/tutoria';
import { AuthView } from './AuthView';
import { ShieldAlert, ArrowRight, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: RolUsuario[];
  onLoginRedirect?: (rol: RolUsuario) => void;
  onIrInicioAutorizado?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  onLoginRedirect,
  onIrInicioAutorizado
}) => {
  const { verificarRuta, sesion, logout } = useAuth();
  const validacion = verificarRuta(allowedRoles);

  // 401 Unauthorized: Sin sesión o token JWT caducado -> Mostrar Pantalla de Login
  if (validacion.statusCode === 401 || !sesion) {
    return <AuthView onLoginSuccess={onLoginRedirect} />;
  }

  // 403 Forbidden: Sesión válida pero rol no autorizado para esta ruta
  if (!validacion.autorizado && validacion.statusCode === 403) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-6 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
            Ruta Protegida por Rol (HTTP 403)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {validacion.mensaje}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          {onIrInicioAutorizado && (
            <button
              onClick={onIrInicioAutorizado}
              className="px-4 py-2 rounded-xl bg-[#20B2AA] hover:bg-[#1CA099] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ir a mi panel autorizado</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cambiar de cuenta</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
