// users.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { AuthService } from '../guards/auth.service';
import { environment } from '../../environments/environment';

type UserRole = 'ADMIN' | 'USER' | string;
type CreateUserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name?: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: CreateUserRole;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = false;

  rowLoading = new Set<number>();

  errorMessage = '';
  successMessage = '';

  q = '';

  private myUserId: number | null = null;

  // ✅ Crear usuario (modal + form)
  showCreateModal = false;
  creating = false;

  createForm: CreateUserForm = {
    name: '',
    email: '',
    password: '',
    role: 'USER',
  };

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    if (!this.auth.isAdmin()) {
      this.errorMessage = 'Acceso restringido: solo administradores.';
      return;
    }

    this.myUserId = this.getUserIdFromToken(this.auth.getToken());
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http
      .get<User[]>(`${environment.apiUrl}/users`, {
        headers: this.authHeaders(),
      })
      .subscribe({
        next: (res) => {
          this.users = Array.isArray(res) ? res : [];
        },
        error: (err) => {
          this.handleHttpError(err, 'al cargar usuarios');
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  // ✅ Abrir/Cerrar modal crear
  openCreate(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.showCreateModal = true;
    this.createForm = { name: '', email: '', password: '', role: 'USER' };
  }

  closeCreate(): void {
    if (this.creating) return;
    this.showCreateModal = false;
  }

  // ✅ Crear usuario (POST /users)
  createUser(): void {
    if (this.creating) return;

    this.errorMessage = '';
    this.successMessage = '';

    const name = this.createForm.name.trim();
    const email = this.createForm.email.trim().toLowerCase();
    const password = this.createForm.password;

    if (!name || !email || !password) {
      this.errorMessage = 'Completa nombre, email y contraseña.';
      return;
    }

    if (password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.creating = true;

    const payload = {
      name,
      email,
      password,
      role: this.createForm.role,
    };

    this.http
      .post<User>(`${environment.apiUrl}/users`, payload, {
        headers: this.authHeaders(),
      })
      .subscribe({
        next: (newUser) => {
          this.successMessage = `Usuario creado: ${newUser.email}`;
          this.showCreateModal = false;

          // Refresca lista para asegurar consistencia
          this.fetchUsers();
        },
        error: (err) => {
          this.handleHttpError(err, 'al crear usuario');
        },
        complete: () => {
          this.creating = false;
        },
      });
  }

  toggleActive(u: User): void {
    // No permitir acción sobre ti mismo desde la UI
    if (this.isMe(u)) {
      this.errorMessage = 'No puedes desactivarte a ti mismo.';
      return;
    }

    if (this.rowLoading.has(u.id)) return;

    this.errorMessage = '';
    this.successMessage = '';

    const prevState = u.isActive;
    const nextState = !u.isActive;

    // Optimistic UI
    u.isActive = nextState;
    this.rowLoading.add(u.id);

    this.http
      .patch<User>(
        `${environment.apiUrl}/users/${u.id}/active`,
        { isActive: nextState },
        { headers: this.authHeaders() }
      )
      .subscribe({
        next: () => {
          this.successMessage = nextState
            ? `Usuario activado: ${u.email}`
            : `Usuario desactivado: ${u.email}`;
        },
        error: (err) => {
          u.isActive = prevState;
          this.handleHttpError(err, 'al actualizar el usuario');
        },
        complete: () => {
          this.rowLoading.delete(u.id);
        },
      });
  }

  isMe(u: User): boolean {
    return this.myUserId !== null && u.id === this.myUserId;
  }

  get filteredUsers(): User[] {
    const query = this.q.trim().toLowerCase();
    if (!query) return this.users;

    return this.users.filter((u) => {
      return (
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query) ||
        String(u.id).includes(query) ||
        (u.name ? u.name.toLowerCase().includes(query) : false)
      );
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    });
  }

  private handleHttpError(err: any, ctx: string): void {
    if (err?.status === 401) {
      this.errorMessage = 'Sesión no válida. Vuelve a iniciar sesión.';
      this.auth.forceSessionExpired();
      return;
    }

    if (err?.status === 403) {
      this.errorMessage = 'No tienes permisos de administrador.';
      return;
    }

    this.errorMessage =
      err?.error?.message || `Error ${err?.status || ''} ${ctx}.`;
  }

  private getUserIdFromToken(token: string | null): number | null {
    if (!token) return null;

    try {
      const part = token.split('.')[1];
      if (!part) return null;

      // base64url -> base64 + padding
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        '='
      );

      const payload = JSON.parse(atob(padded)) as { sub?: unknown };

      // sub puede venir number o string
      if (typeof payload.sub === 'number') return payload.sub;
      if (typeof payload.sub === 'string' && /^\d+$/.test(payload.sub)) {
        return Number(payload.sub);
      }

      return null;
    } catch {
      return null;
    }
  }
}
