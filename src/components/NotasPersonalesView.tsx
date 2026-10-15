import React from 'react';
import { BitacoraNotasView } from './BitacoraNotasView';
import { useAuth } from '../context/AuthContext';
import { EstudianteCatalogo, Tutor } from '../types/tutoria';

export const NotasPersonalesView: React.FC = () => {
  const { sesion } = useAuth();
  const usuario = sesion?.usuario;

  const estudianteActivo: EstudianteCatalogo = {
    id: usuario?.estudianteProfileId || usuario?.id || 'est-activo',
    nombre: usuario?.nombre || 'Estudiante',
    email: usuario?.email || '',
    matricula: usuario?.matricula || '',
    carrera: usuario?.carrera || 'Ingeniería en Sistemas Computacionales',
    semestre: usuario?.semestre || 1,
    promedio: usuario?.promedio || 0,
    telefono: usuario?.telefono || '',
    avatar: usuario?.avatar || ''
  };

  const tutorActivo: Tutor = {
    id: usuario?.tutorProfileId || 'tutor-001',
    nombre: usuario?.rol === 'TUTOR' ? usuario.nombre : 'Docente Tutor',
    email: usuario?.rol === 'TUTOR' ? usuario.email : '',
    departamento: usuario?.departamento || 'Facultad de Ingeniería',
    avatar: usuario?.avatar || '',
    rol: 'tutor',
    cubículo: usuario?.cubículo || ''
  };

  return (
    <BitacoraNotasView
      rolActivo={usuario?.rol === 'TUTOR' ? 'TUTOR' : 'ALUMNO'}
      tutorActivo={tutorActivo}
      estudianteActivo={estudianteActivo}
      catalogoEstudiantes={[]}
    />
  );
};
