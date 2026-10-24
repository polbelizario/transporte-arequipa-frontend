
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ViajeModel {
  id: number;
  origen: string;
  destino: string;
  fechaSalida: string;
  precio: number;
  capacidad: number;
  estado: string;
}

export type ViajeRequest = Omit<ViajeModel, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class Viaje {

  private http = inject(HttpClient);
  private apiUrl = '/api/viajes';

  listar(): Observable<ViajeModel[]> {
    return this.http.get<ViajeModel[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<ViajeModel> {
    return this.http.get<ViajeModel>(
      `${this.apiUrl}/${id}`
    );
  }

  registrar(datos: ViajeRequest): Observable<ViajeModel> {
    return this.http.post<ViajeModel>(
      this.apiUrl,
      datos
    );
  }

  actualizar(
    id: number,
    datos: ViajeRequest
  ): Observable<ViajeModel> {
    return this.http.put<ViajeModel>(
      `${this.apiUrl}/${id}`,
      datos
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
