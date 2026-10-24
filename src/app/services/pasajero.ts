
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PasajeroModel {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  fechaRegistro?: string;
}

export type PasajeroRequest = Omit<
  PasajeroModel,
  'id' | 'fechaRegistro'
>;

@Injectable({
  providedIn: 'root'
})
export class Pasajero {

  private http = inject(HttpClient);

  // Conexión mediante el proxy de Angular
  private apiUrl = '/api/pasajeros';

  // Listar pasajeros
  listar(): Observable<PasajeroModel[]> {
    return this.http.get<PasajeroModel[]>(this.apiUrl);
  }

  // Buscar pasajero por ID
  buscarPorId(id: number): Observable<PasajeroModel> {
    return this.http.get<PasajeroModel>(
      `${this.apiUrl}/${id}`
    );
  }

  // Registrar nuevo pasajero
  registrar(datos: PasajeroRequest): Observable<PasajeroModel> {
    return this.http.post<PasajeroModel>(
      this.apiUrl,
      datos
    );
  }

  // Actualizar pasajero
  actualizar(
    id: number,
    datos: PasajeroRequest
  ): Observable<PasajeroModel> {
    return this.http.put<PasajeroModel>(
      `${this.apiUrl}/${id}`,
      datos
    );
  }

  // Eliminar pasajero
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
