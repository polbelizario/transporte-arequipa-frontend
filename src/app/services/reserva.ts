
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReservaModel {
  id: number;
  pasajeroId: number;
  viajeId: number;
  cantidadAsientos: number;
  estado: string;
  fechaReserva: string;
}

export interface ReservaRequest {
  pasajeroId: number;
  viajeId: number;
  cantidadAsientos: number;
}

@Injectable({
  providedIn: 'root'
})
export class Reserva {

  private http = inject(HttpClient);
  private apiUrl = '/api/reservas';

  listar(): Observable<ReservaModel[]> {
    return this.http.get<ReservaModel[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<ReservaModel> {
    return this.http.get<ReservaModel>(
      `${this.apiUrl}/${id}`
    );
  }

  registrar(datos: ReservaRequest): Observable<ReservaModel> {
    return this.http.post<ReservaModel>(
      this.apiUrl,
      datos
    );
  }

  cancelar(id: number): Observable<ReservaModel> {
    return this.http.patch<ReservaModel>(
      `${this.apiUrl}/${id}/cancelar`,
      {}
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
