
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';

import {
  Reserva,
  ReservaModel,
  ReservaRequest
} from '../../services/reserva';

import {
  Pasajero,
  PasajeroModel
} from '../../services/pasajero';

import {
  Viaje,
  ViajeModel
} from '../../services/viaje';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservas.html',
  styleUrl: './reservas.css'
})
export class Reservas implements OnInit {

  private reservaService = inject(Reserva);
  private pasajeroService = inject(Pasajero);
  private viajeService = inject(Viaje);

  reservas: ReservaModel[] = [];
  pasajeros: PasajeroModel[] = [];
  viajes: ViajeModel[] = [];

  busqueda = '';

  cargando = false;
  guardando = false;
  procesandoId: number | null = null;
  mostrarFormulario = false;

  error = '';
  mensaje = '';

  formulario: ReservaRequest = this.nuevoFormulario();

  ngOnInit(): void {
    this.cargarDatos();
  }

  nuevoFormulario(): ReservaRequest {
    return {
      pasajeroId: 0,
      viajeId: 0,
      cantidadAsientos: 1
    };
  }

  // CARGAR INFORMACIÓN INICIAL
  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      reservas: this.reservaService.listar(),
      pasajeros: this.pasajeroService.listar(),
      viajes: this.viajeService.listar()
    })
    .pipe(finalize(() => this.cargando = false))
    .subscribe({
      next: (datos) => {
        this.reservas = datos.reservas;
        this.pasajeros = datos.pasajeros;
        this.viajes = datos.viajes;
      },
      error: (err) => {
        console.error('Error al cargar reservas:', err);

        this.error =
          'No se pudieron cargar los datos. Verifica los microservicios.';
      }
    });
  }

  // BUSCAR RESERVAS
  get reservasFiltradas(): ReservaModel[] {
    const texto = this.busqueda.toLowerCase().trim();

    return this.reservas.filter(reserva => {
      const pasajero = this.nombrePasajero(reserva.pasajeroId);
      const viaje = this.nombreViaje(reserva.viajeId);

      return (
        pasajero.toLowerCase().includes(texto) ||
        viaje.toLowerCase().includes(texto) ||
        reserva.estado.toLowerCase().includes(texto) ||
        String(reserva.id).includes(texto)
      );
    });
  }

  // MOSTRAR VIAJES PROGRAMADOS Y FUTUROS
  get viajesDisponibles(): ViajeModel[] {
    return this.viajes.filter(v =>
      v.estado === 'PROGRAMADO' &&
      new Date(v.fechaSalida) > new Date()
    );
  }

  // OBTENER NOMBRE DEL PASAJERO
  nombrePasajero(id: number): string {
    const pasajero = this.pasajeros.find(p => p.id === id);

    return pasajero
      ? `${pasajero.nombres} ${pasajero.apellidos}`
      : `Pasajero #${id}`;
  }

  // OBTENER RUTA DEL VIAJE
  nombreViaje(id: number): string {
    const viaje = this.viajes.find(v => v.id === id);

    return viaje
      ? `${viaje.origen} → ${viaje.destino}`
      : `Viaje #${id}`;
  }

  // ABRIR FORMULARIO
  abrirNuevo(): void {
    if (this.guardando || this.procesandoId !== null) return;

    this.formulario = this.nuevoFormulario();
    this.error = '';
    this.mensaje = '';
    this.mostrarFormulario = true;
  }

  // CERRAR FORMULARIO
  cerrarFormulario(): void {
    if (this.guardando) return;

    this.mostrarFormulario = false;
    this.formulario = this.nuevoFormulario();
  }

  // REGISTRAR RESERVA
  guardar(): void {
    if (this.guardando || this.procesandoId !== null) return;

    this.error = '';
    this.mensaje = '';

    const datos: ReservaRequest = {
      pasajeroId: Number(this.formulario.pasajeroId),
      viajeId: Number(this.formulario.viajeId),
      cantidadAsientos: Number(this.formulario.cantidadAsientos)
    };

    if (
      !Number.isInteger(datos.pasajeroId) ||
      datos.pasajeroId <= 0 ||
      !Number.isInteger(datos.viajeId) ||
      datos.viajeId <= 0 ||
      !Number.isInteger(datos.cantidadAsientos) ||
      datos.cantidadAsientos < 1
    ) {
      this.error =
        'Completa correctamente los datos de la reserva.';
      return;
    }

    const pasajeroExiste = this.pasajeros.some(
      p => p.id === datos.pasajeroId
    );

    const viajeDisponible = this.viajesDisponibles.some(
      v => v.id === datos.viajeId
    );

    if (!pasajeroExiste || !viajeDisponible) {
      this.error =
        'Selecciona un pasajero y un viaje disponible.';
      return;
    }

    this.guardando = true;

    const inicio = performance.now();

    this.reservaService.registrar(datos)
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: (reservaGuardada: ReservaModel) => {

          // Actualizar tabla sin consultar nuevamente
          this.reservas = [
            ...this.reservas,
            reservaGuardada
          ];

          this.mensaje = 'Reserva registrada correctamente.';

          this.mostrarFormulario = false;
          this.formulario = this.nuevoFormulario();

          const tiempo = Math.round(
            performance.now() - inicio
          );

          console.log(
            `Registro de reserva: ${tiempo} ms`
          );
        },

        error: (err) => {
          console.error('Error al registrar reserva:', err);

          this.error =
            err.error?.detail ||
            err.error?.message ||
            'No se pudo registrar la reserva.';
        }
      });
  }

  // CANCELAR RESERVA
  cancelarReserva(reserva: ReservaModel): void {
    if (
      this.guardando ||
      this.procesandoId !== null ||
      reserva.estado === 'CANCELADA'
    ) {
      return;
    }

    const confirmado = confirm(
      `¿Deseas cancelar la reserva N.º ${reserva.id}?`
    );

    if (!confirmado) return;

    this.error = '';
    this.mensaje = '';
    this.procesandoId = reserva.id;

    this.reservaService.cancelar(reserva.id)
      .pipe(finalize(() => this.procesandoId = null))
      .subscribe({
        next: (reservaActualizada: ReservaModel) => {

          this.reservas = this.reservas.map(r =>
            r.id === reserva.id
              ? reservaActualizada
              : r
          );

          this.mensaje = 'Reserva cancelada correctamente.';
        },

        error: (err) => {
          console.error('Error al cancelar reserva:', err);

          this.error =
            err.error?.detail ||
            'No se pudo cancelar la reserva.';
        }
      });
  }

  // ELIMINAR RESERVA
  eliminar(reserva: ReservaModel): void {
    if (this.guardando || this.procesandoId !== null) {
      return;
    }

    const confirmado = confirm(
      `¿Eliminar definitivamente la reserva N.º ${reserva.id}?`
    );

    if (!confirmado) return;

    this.error = '';
    this.mensaje = '';
    this.procesandoId = reserva.id;

    this.reservaService.eliminar(reserva.id)
      .pipe(finalize(() => this.procesandoId = null))
      .subscribe({
        next: () => {

          // Eliminar fila sin consultar nuevamente
          this.reservas = this.reservas.filter(
            r => r.id !== reserva.id
          );

          this.mensaje = 'Reserva eliminada correctamente.';
        },

        error: (err) => {
          console.error('Error al eliminar reserva:', err);

          this.error =
            err.error?.detail ||
            'No se pudo eliminar la reserva.';
        }
      });
  }
}
