import React from 'react';
import { BitacoraNotasView } from './BitacoraNotasView';
import { TUTORES_DEMO, CATALOGO_ESTUDIANTES } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export const NotasPersonalesView: React.FC = () => {
  const { sesion } = useAuth();
  const estudianteId = sesion?.usuario.estudianteProfileId || 'est-101';
  const estudianteActivo =
    CATALOGO_ESTUDIANTES.find((e) => e.id === estudianteId) || CATALOGO_ESTUDIANTES[0];
  const tutorActivo = TUTORES_DEMO[0];

  return (
    <BitacoraNotasView
      rolActivo="ALUMNO"
      tutorActivo={tutorActivo}
      estudianteActivo={estudianteActivo}
      catalogoEstudiantes={CATALOGO_ESTUDIANTES}
    />
  );
};
