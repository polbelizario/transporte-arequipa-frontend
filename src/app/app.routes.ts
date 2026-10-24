
import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { Pasajeros } from './pages/pasajeros/pasajeros';
import { Viajes } from './pages/viajes/viajes';
import { Reservas } from './pages/reservas/reservas';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: Dashboard
  },
  {
    path: 'pasajeros',
    component: Pasajeros
  },
  {
    path: 'viajes',
    component: Viajes
  },
  {
    path: 'reservas',
    component: Reservas
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
