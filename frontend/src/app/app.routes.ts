import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AuthComponent } from './components/auth/auth.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { NoteListComponent } from './components/note-list/note-list.component';

export const routes: Routes = [
  { 
    path: 'auth', 
    component: AuthComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ] 
  },
  { 
    path: 'notes', 
    component: NoteListComponent,
    canActivate: [AuthGuard] 
  },
  { path: '', redirectTo: '/notes', pathMatch: 'full' },
  { path: '**', redirectTo: '/notes' }
];
