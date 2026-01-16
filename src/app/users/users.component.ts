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
type EditUserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name?: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: CreateUserRole;
}

interface EditUserForm {
  name: string;
  email: string;
  role: EditUserRole;
  isActive: boolean;
  password?: string; // opcional
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

  // ✅ Crear usuario
  showCreateModal = false;
  creating = false;

  createForm: CreateUserForm = {
    name: '',
    email: '',
    password: '',
    role: 'USER',
  };

  // ✅ Editar usuario
  showEditModal = false;
  editing = false;
  editUserId: number | null = null;

  editForm: EditUserForm = {
    name: '',
    email: '',
    role: 'USER',
    isActive: true,
    password: '',
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

  // ============================
  // ✅ Crear usuario (modal)
  // ============================
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

  // ============================
  // ✅ Activar / Desactivar
  // ============================
  toggleActive(u: User): void {
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

  // ============================
  // ✅ Editar usuario (modal)
  // ============================
  openEdit(u: User): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.showEditModal = true;

    this.editUserId = u.id;
    this.editForm = {
      name: (u.name || '').trim(),
      email: (u.email || '').trim(),
      role: u.role === 'ADMIN' ? 'ADMIN' : 'USER',
      isActive: !!u.isActive,
      password: '',
    };
  }

  closeEdit(): void {
    if (this.editing) return;
    this.showEditModal = false;
    this.editUserId = null;
  }

  saveEdit(): void {
    if (this.editing) return;
    if (this.editUserId === null) return;

    this.errorMessage = '';
    this.successMessage = '';

    const id = this.editUserId;

    const name = this.editForm.name.trim();
    const email = this.editForm.email.trim().toLowerCase();
    const role = this.editForm.role;
    const isActive = this.editForm.isActive;
    const password = (this.editForm.password || '').trim();

    if (!name) {
      this.errorMessage = 'Nombre inválido.';
      return;
    }
    if (!email) {
      this.errorMessage = 'Email inválido.';
      return;
    }

    // No permitir auto-desactivación (mejor UX, el back también lo bloquea)
    if (this.isMeId(id) && isActive === false) {
      this.errorMessage = 'No puedes desactivarte a ti mismo.';
      return;
    }

    if (password && password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    const payload: any = { name, email, role, isActive };
    if (password) payload.password = password;

    this.editing = true;

    this.http
      .patch<User>(`${environment.apiUrl}/users/${id}`, payload, {
        headers: this.authHeaders(),
      })
      .subscribe({
        next: (updated) => {
          this.successMessage = `Usuario actualizado: ${updated.email}`;
          this.showEditModal = false;

          // Update local list sin refetch
          const idx = this.users.findIndex((x) => x.id === id);
          if (idx >= 0) this.users[idx] = { ...this.users[idx], ...updated };

          this.editUserId = null;
        },
        error: (err) => {
          this.handleHttpError(err, 'al editar usuario');
        },
        complete: () => {
          this.editing = false;
        },
      });
  }

  // ============================
  // ✅ Utils UI
  // ============================
  isMe(u: User): boolean {
    return this.myUserId !== null && u.id === this.myUserId;
  }

  isMeId(id: number | null): boolean {
    return id !== null && this.myUserId !== null && id === this.myUserId;
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
