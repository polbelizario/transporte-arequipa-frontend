
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  Pasajero,
  PasajeroModel,
  PasajeroRequest
} from '../../services/pasajero';

@Component({
  selector: 'app-pasajeros',
  imports: [CommonModule, FormsModule],
  templateUrl: './pasajeros.html',
  styleUrl: './pasajeros.css'
})
export class Pasajeros implements OnInit {

  private pasajeroService = inject(Pasajero);

  pasajeros: PasajeroModel[] = [];
  busqueda = '';

  cargando = false;
  guardando = false;
  eliminandoId: number | null = null;
  mostrarFormulario = false;

  editandoId: number | null = null;

  mensaje = '';
  error = '';

  formulario: PasajeroRequest = this.formularioVacio();

  ngOnInit(): void {
    this.listar();
  }

  formularioVacio(): PasajeroRequest {
    return {
      dni: '',
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: ''
    };
  }

  get pasajerosFiltrados(): PasajeroModel[] {
    const texto = this.busqueda.toLowerCase().trim();

    return this.pasajeros.filter(p =>
      p.dni.includes(texto) ||
      p.nombres.toLowerCase().includes(texto) ||
      p.apellidos.toLowerCase().includes(texto)
    );
  }

  listar(): void {
    this.cargando = true;
    this.error = '';

    this.pasajeroService.listar()
      .pipe(finalize(() => this.cargando = false))
      .subscribe({
        next: (datos) => {
          this.pasajeros = datos;
        },
        error: (err) => {
          console.error('Error al listar pasajeros:', err);
          this.error = 'No se pudieron cargar los pasajeros.';
        }
      });
  }

  nuevo(): void {
    if (this.guardando) return;

    this.formulario = this.formularioVacio();
    this.editandoId = null;
    this.mensaje = '';
    this.error = '';
    this.mostrarFormulario = true;
  }

  editar(pasajero: PasajeroModel): void {
    if (this.guardando) return;

    this.formulario = {
      dni: pasajero.dni,
      nombres: pasajero.nombres,
      apellidos: pasajero.apellidos,
      correo: pasajero.correo,
      telefono: pasajero.telefono
    };

    this.editandoId = pasajero.id;
    this.mensaje = '';
    this.error = '';
    this.mostrarFormulario = true;
  }

  cancelar(): void {
    // No cerrar mientras el servidor procesa el guardado
    if (this.guardando) return;

    this.mostrarFormulario = false;
    this.editandoId = null;
    this.formulario = this.formularioVacio();
  }

  guardar(): void {
    if (this.guardando) return;

    const datos: PasajeroRequest = {
      dni: this.formulario.dni.trim(),
      nombres: this.formulario.nombres.trim(),
      apellidos: this.formulario.apellidos.trim(),
      correo: this.formulario.correo.trim(),
      telefono: this.formulario.telefono.trim()
    };

    if (
      !datos.dni ||
      !datos.nombres ||
      !datos.apellidos ||
      !datos.correo ||
      !datos.telefono
    ) {
      this.error = 'Completa todos los campos obligatorios.';
      return;
    }

    const idEdicion = this.editandoId;
    const esEdicion = idEdicion !== null;

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    const inicio = performance.now();

    const peticion = esEdicion
      ? this.pasajeroService.actualizar(idEdicion, datos)
      : this.pasajeroService.registrar(datos);

    peticion
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: (pasajeroGuardado) => {

          if (esEdicion) {
            this.pasajeros = this.pasajeros.map(p =>
              p.id === pasajeroGuardado.id
                ? pasajeroGuardado
                : p
            );

            this.mensaje = 'Pasajero actualizado correctamente.';
          } else {
            this.pasajeros = [
              ...this.pasajeros,
              pasajeroGuardado
            ];

            this.mensaje = 'Pasajero registrado correctamente.';
          }

          // Cerrar el formulario tras la confirmación
          this.mostrarFormulario = false;
          this.editandoId = null;
          this.formulario = this.formularioVacio();

          const tiempo = Math.round(performance.now() - inicio);
          console.log(`Guardado de pasajero: ${tiempo} ms`);
        },

        error: (err) => {
          console.error('Error al guardar pasajero:', err);

          this.error = err.status === 0
            ? 'No hay conexión con el servidor.'
            : 'No se pudo guardar el pasajero. Verifica los datos.';
        }
      });
  }

  eliminar(pasajero: PasajeroModel): void {
    if (this.eliminandoId !== null || this.guardando) return;

    const confirmado = confirm(
      `¿Deseas eliminar a ${pasajero.nombres} ${pasajero.apellidos}?`
    );

    if (!confirmado) return;

    this.error = '';
    this.mensaje = '';
    this.eliminandoId = pasajero.id;

    this.pasajeroService.eliminar(pasajero.id)
      .pipe(finalize(() => this.eliminandoId = null))
      .subscribe({
        next: () => {
          this.pasajeros = this.pasajeros.filter(
            p => p.id !== pasajero.id
          );

          this.mensaje = 'Pasajero eliminado correctamente.';
        },

        error: (err) => {
          console.error('Error al eliminar pasajero:', err);
          this.error = 'No se pudo eliminar el pasajero.';
        }
      });
  }
}
