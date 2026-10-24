
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Viaje,
  ViajeModel,
  ViajeRequest
} from '../../services/viaje';

@Component({
  selector: 'app-viajes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './viajes.html',
  styleUrl: './viajes.css'
})
export class Viajes implements OnInit {

  private viajeService = inject(Viaje);

  viajes: ViajeModel[] = [];
  busqueda = '';

  cargando = false;
  guardando = false;
  eliminandoId: number | null = null;
  mostrarFormulario = false;

  error = '';
  mensaje = '';

  editandoId: number | null = null;

  formulario: ViajeRequest = this.nuevoFormulario();

  ngOnInit(): void {
    this.cargarViajes();
  }

  nuevoFormulario(): ViajeRequest {
    return {
      origen: '',
      destino: '',
      fechaSalida: '',
      precio: 0,
      capacidad: 1,
      estado: 'PROGRAMADO'
    };
  }

  cargarViajes(): void {
    this.cargando = true;
    this.error = '';

    this.viajeService.listar().subscribe({
      next: (datos) => {
        this.viajes = datos;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar viajes:', err);
        this.error = 'No se pudieron cargar los viajes.';
        this.cargando = false;
      }
    });
  }

  get viajesFiltrados(): ViajeModel[] {
    const texto = this.busqueda.toLowerCase().trim();

    return this.viajes.filter(v =>
      v.origen.toLowerCase().includes(texto) ||
      v.destino.toLowerCase().includes(texto) ||
      v.estado.toLowerCase().includes(texto)
    );
  }

  abrirNuevo(): void {
    if (this.guardando) return;

    this.formulario = this.nuevoFormulario();
    this.editandoId = null;
    this.mensaje = '';
    this.error = '';
    this.mostrarFormulario = true;
  }

  editar(viaje: ViajeModel): void {
    if (this.guardando) return;

    this.editandoId = viaje.id;

    this.formulario = {
      origen: viaje.origen,
      destino: viaje.destino,
      fechaSalida: viaje.fechaSalida.slice(0, 16),
      precio: viaje.precio,
      capacidad: viaje.capacidad,
      estado: viaje.estado
    };

    this.mostrarFormulario = true;
    this.error = '';
    this.mensaje = '';
  }

  cancelar(): void {
    if (this.guardando) return;

    this.mostrarFormulario = false;
    this.editandoId = null;
    this.formulario = this.nuevoFormulario();
  }

  guardar(): void {
    if (this.guardando) return;

    this.error = '';
    this.mensaje = '';

    const datos: ViajeRequest = {
      origen: this.formulario.origen.trim(),
      destino: this.formulario.destino.trim(),
      fechaSalida: this.formulario.fechaSalida,
      precio: Number(this.formulario.precio),
      capacidad: Number(this.formulario.capacidad),
      estado: this.formulario.estado
    };

    if (
      !datos.origen ||
      !datos.destino ||
      !datos.fechaSalida ||
      !Number.isFinite(datos.precio) ||
      datos.precio <= 0 ||
      !Number.isInteger(datos.capacidad) ||
      datos.capacidad < 1
    ) {
      this.error = 'Completa correctamente todos los campos.';
      return;
    }

    const fecha = new Date(datos.fechaSalida);

    if (Number.isNaN(fecha.getTime())) {
      this.error = 'La fecha de salida no es válida.';
      return;
    }

    if (fecha <= new Date()) {
      this.error = 'La fecha de salida debe ser futura.';
      return;
    }

    this.guardando = true;

    const idActual = this.editandoId;

    const operacion = idActual === null
      ? this.viajeService.registrar(datos)
      : this.viajeService.actualizar(idActual, datos);

    operacion.subscribe({
      next: (viajeGuardado: ViajeModel) => {

        if (idActual === null) {
          this.viajes = [...this.viajes, viajeGuardado];
          this.mensaje = 'Viaje registrado correctamente.';
        } else {
          this.viajes = this.viajes.map(v =>
            v.id === idActual ? viajeGuardado : v
          );

          this.mensaje = 'Viaje actualizado correctamente.';
        }

        this.guardando = false;
        this.cancelar();
      },
      error: (err) => {
        console.error('Error al guardar viaje:', err);

        this.error =
          err.error?.detail ||
          err.error?.message ||
          'No se pudo guardar el viaje.';

        this.guardando = false;
      }
    });
  }

  eliminar(viaje: ViajeModel): void {
    if (this.eliminandoId !== null || this.guardando) return;

    const confirmado = confirm(
      `¿Eliminar el viaje ${viaje.origen} - ${viaje.destino}?`
    );

    if (!confirmado) return;

    this.error = '';
    this.mensaje = '';
    this.eliminandoId = viaje.id;

    this.viajeService.eliminar(viaje.id).subscribe({
      next: () => {
        this.viajes = this.viajes.filter(
          v => v.id !== viaje.id
        );

        this.mensaje = 'Viaje eliminado correctamente.';
        this.eliminandoId = null;
      },
      error: (err) => {
        console.error('Error al eliminar viaje:', err);

        this.error =
          err.error?.detail ||
          'No se pudo eliminar el viaje.';

        this.eliminandoId = null;
      }
    });
  }
}
