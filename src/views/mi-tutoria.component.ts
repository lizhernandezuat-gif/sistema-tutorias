import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NotaPersonal {
  id: number;
  texto: string;
  fecha: string;
}

export interface Cita {
  id: string;
  tema: string;
  fecha: string;
  hora: string;
  modalidad: 'Presencial' | 'Virtual';
  estado: string;
  lugar?: string;
  motivoDetalle?: string;
}

export interface NotaBitacora {
  id: string;
  tipo: string;
  fecha: string;
  contenido: string;
}

@Component({
  selector: 'app-mi-tutoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-tutoria.component.html',
  styleUrls: ['./mi-tutoria.component.css']
})
export class MiTutoriaComponent implements OnInit {

  // Perfil del estudiante activo (Ana Lucía Morales Rivera)
  estudianteActivo = {
    id: 'est-1',
    nombre: 'Ana Lucía Morales Rivera',
    matricula: '2023-ISC-0412',
    carrera: 'Ing. en Sistemas Computacionales',
    semestre: 3,
    promedio: 8.8,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    estado: 'ACTIVO'
  };

  // Docente tutor asignado
  tutor = {
    id: 'tut-1',
    nombre: 'Dr. Roberto Mendoza Salinas',
    email: 'roberto.mendoza@universidad.edu.mx',
    departamento: 'División de Tecnologías de Información',
    cubículo: 'Edificio B, Cubículo 104',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  // Próximas sesiones agendadas
  citas: Cita[] = [
    {
      id: 'cita-1',
      tema: 'Plan de Regularización en Cálculo Diferencial',
      fecha: '2026-10-15',
      hora: '11:00 AM',
      modalidad: 'Presencial',
      estado: 'Confirmada',
      lugar: 'Edificio B, Cubículo 104',
      motivoDetalle: 'Revisión de ejercicios de límites y acuerdos para el segundo examen parcial.'
    },
    {
      id: 'cita-2',
      tema: 'Asesoría para Solicitud de Beca de Excelencia',
      fecha: '2026-10-22',
      hora: '12:30 PM',
      modalidad: 'Virtual',
      estado: 'Pendiente',
      lugar: 'Google Meet',
      motivoDetalle: 'Validación de promedio acumulado y carta de recomendación docente.'
    }
  ];

  // Bitácora y acuerdos con el tutor
  asignacion = {
    notas: [
      {
        id: 'nb-1',
        tipo: 'Sesión Ordinaria',
        fecha: '2026-09-24',
        contenido: 'Se acordó asistir al taller de asesorías de los martes de 14:00 a 16:00 horas.'
      },
      {
        id: 'nb-2',
        tipo: 'Compromiso Académico',
        fecha: '2026-09-10',
        contenido: 'Entrega de avance del proyecto de programación antes del primer corte oficial.'
      }
    ]
  };

  // ========================================================================
  // 1. LÓGICA DE NOTAS PERSONALES (INTERACTIVA)
  // ========================================================================

  // Arreglo de notas inicial simulado con 2 notas de ejemplo
  notas: NotaPersonal[] = [
    {
      id: 1,
      texto: 'Preguntar al Dr. Mendoza sobre los requisitos de titulación por promedio y seminario.',
      fecha: '14 Octubre, 2026'
    },
    {
      id: 2,
      texto: 'Repasar apuntes de la unidad 2 antes de la sesión presencial de este jueves a las 11:00 AM.',
      fecha: '12 Octubre, 2026'
    }
  ];

  // Variable enlazada con [(ngModel)] en la vista
  nuevaNota: string = '';

  // Estado del modal de solicitud de cita
  modalSolicitarAbierto = false;

  ngOnInit(): void {}

  /**
   * Agrega una nueva nota al inicio del arreglo si no está vacía
   */
  agregarNota(): void {
    const textoLimpio = this.nuevaNota ? this.nuevaNota.trim() : '';
    if (!textoLimpio) {
      return;
    }

    // Formatear la fecha actual en español
    const opcionesFecha: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const fechaActual = new Date().toLocaleDateString('es-ES', opcionesFecha);

    const nuevaNotaObj: NotaPersonal = {
      id: Date.now(),
      texto: textoLimpio,
      fecha: fechaActual
    };

    // Agregar al principio del arreglo
    this.notas.unshift(nuevaNotaObj);

    // Limpiar el campo de texto
    this.nuevaNota = '';
  }

  /**
   * Elimina una nota personal seleccionada por su ID
   */
  eliminarNota(id: number): void {
    this.notas = this.notas.filter(nota => nota.id !== id);
  }

  abrirModalSolicitar(): void {
    this.modalSolicitarAbierto = true;
  }

  cerrarModalSolicitar(): void {
    this.modalSolicitarAbierto = false;
  }

  cancelarCita(id: string): void {
    this.citas = this.citas.filter(c => c.id !== id);
  }
}
