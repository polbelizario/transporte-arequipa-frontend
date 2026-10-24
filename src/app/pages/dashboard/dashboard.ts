
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Pasajero } from '../../services/pasajero';
import { Viaje } from '../../services/viaje';
import { Reserva } from '../../services/reserva';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private pasajeroService = inject(Pasajero);
  private viajeService = inject(Viaje);
  private reservaService = inject(Reserva);

  totalPasajeros = 0;
  totalViajes = 0;
  totalReservas = 0;

  cargando = true;
  error = '';

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {

    this.cargando = true;
    this.error = '';

    forkJoin({
      pasajeros: this.pasajeroService.listar(),
      viajes: this.viajeService.listar(),
      reservas: this.reservaService.listar()
    }).subscribe({
      next: (datos) => {
        this.totalPasajeros = datos.pasajeros.length;
        this.totalViajes = datos.viajes.length;
        this.totalReservas = datos.reservas.length;

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);

        this.error = 'No se pudo conectar con los microservicios.';
        this.cargando = false;
      }
    });
  }
}
