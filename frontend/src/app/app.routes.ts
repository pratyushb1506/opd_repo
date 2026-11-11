import { Routes } from '@angular/router';
import { RegisterComponent } from './pages/register/register.component';
import { QueueComponent } from './pages/queue/queue.component';

export const routes: Routes = [
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'queue', component: QueueComponent },
  { path: '**', redirectTo: 'register' }
];
