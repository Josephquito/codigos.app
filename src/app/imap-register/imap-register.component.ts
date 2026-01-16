import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../guards/auth.service';
import { environment } from '../../environments/environment';

export interface ImapAccount {
  id: number;
  email: string;
  imapHost: string;
  imapPort?: number | null;
  useTls?: boolean | null;
  active: boolean;
  isCatchAll: boolean;
  createdAt?: string;
}

type EditForm = {
  id: number | null;
  email: string;
  password: string; // opcional (solo si el usuario escribe)
  imapHost: string;
  imapPort: number | null;
  useTls: boolean;
  isCatchAll: boolean;
  active: boolean;
};

@Component({
  selector: 'app-imap-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './imap-register.component.html',
})
export class ImapRegisterComponent implements OnInit {
  // =========================
  // Form crear
  // =========================
  email = '';
  password = '';
  imapHost = '';
  imapPort: number | null = 993;
  useTls = true;
  isCatchAll = false;
  creating = false;

  // =========================
  // List + table
  // =========================
  accounts: ImapAccount[] = [];
  loading = false;
  rowLoading = new Set<number>();

  // =========================
  // UI messages
  // =========================
  errorMessage = '';
  successMessage = '';

  // =========================
  // Search
  // =========================
  q = '';

  // =========================
  // Delete modal
  // =========================
  showDeleteModal = false;
  pendingDelete: ImapAccount | null = null;
  deleting = false;

  // =========================
  // Edit modal
  // =========================
  showEditModal = false;
  editing = false;
  editForm: EditForm = this.emptyEditForm();

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    this.fetchAccounts();
  }

  // =========================
  // API: Listar
  // =========================
  fetchAccounts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http
      .get<ImapAccount[]>(`${environment.apiUrl}/imap/accounts`, {
        headers: this.authHeaders(),
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.accounts = Array.isArray(res) ? res : [];
        },
        error: (err) => this.handleHttpError(err, 'al cargar tus cuentas IMAP'),
      });
  }

  // =========================
  // API: Crear
  // =========================
  createAccount(): void {
    if (this.creating) return;

    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();
    const imapHost = this.imapHost.trim();
    const imapPort = this.imapPort;

    if (!email || !password || !imapHost) {
      this.errorMessage = 'Completa email, contraseña e IMAP host.';
      return;
    }

    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';

    const body: any = {
      email,
      password,
      imapHost,
      useTls: this.useTls,
      isCatchAll: this.isCatchAll,
    };

    if (
      imapPort !== null &&
      imapPort !== undefined &&
      String(imapPort).length
    ) {
      body.imapPort = Number(imapPort);
    }

    this.http
      .post<any>(`${environment.apiUrl}/imap/accounts`, body, {
        headers: this.authHeaders(),
      })
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        next: () => {
          this.successMessage = `Cuenta agregada: ${email}`;
          // limpiar campos sensibles
          this.password = '';
          // refrescar lista
          this.fetchAccounts();
        },
        error: (err) =>
          this.handleHttpError(err, 'al registrar la cuenta IMAP'),
      });
  }

  // =========================
  // API: Active
  // =========================
  toggleActive(a: ImapAccount): void {
    if (this.rowLoading.has(a.id)) return;

    this.errorMessage = '';
    this.successMessage = '';

    const prev = a.active;
    const next = !a.active;

    // Optimistic UI
    a.active = next;
    this.rowLoading.add(a.id);

    this.http
      .patch(
        `${environment.apiUrl}/imap/accounts/${a.id}/active`,
        { active: next },
        { headers: this.authHeaders() }
      )
      .pipe(finalize(() => this.rowLoading.delete(a.id)))
      .subscribe({
        next: () => {
          this.successMessage = next
            ? `Cuenta activada: ${a.email}`
            : `Cuenta desactivada: ${a.email}`;

          // Importante: si desactivas, backend puede apagar isCatchAll
          this.fetchAccounts();
        },
        error: (err) => {
          a.active = prev;
          this.handleHttpError(err, 'al actualizar el estado de la cuenta');
        },
      });
  }

  // =========================
  // API: Catch-all
  // =========================
  toggleCatchAll(a: ImapAccount): void {
    if (this.rowLoading.has(a.id)) return;

    this.errorMessage = '';
    this.successMessage = '';

    const prev = a.isCatchAll;
    const next = !a.isCatchAll;

    // Optimistic UI
    a.isCatchAll = next;
    this.rowLoading.add(a.id);

    this.http
      .patch(
        `${environment.apiUrl}/imap/accounts/${a.id}/catchall`,
        { isCatchAll: next },
        { headers: this.authHeaders() }
      )
      .pipe(finalize(() => this.rowLoading.delete(a.id)))
      .subscribe({
        next: () => {
          this.successMessage = next
            ? `Catch-all activado: ${a.email}`
            : `Catch-all desactivado: ${a.email}`;

          // opcional: mantener consistencia si cambian reglas
          this.fetchAccounts();
        },
        error: (err) => {
          a.isCatchAll = prev;
          this.handleHttpError(err, 'al actualizar catch-all');
        },
      });
  }

  // =========================
  // Edit: Modal
  // =========================
  openEdit(a: ImapAccount): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.editForm = {
      id: a.id,
      email: a.email,
      password: '',
      imapHost: a.imapHost,
      imapPort: (a.imapPort ?? 993) as number,
      useTls: !!a.useTls,
      isCatchAll: !!a.isCatchAll,
      active: !!a.active,
    };

    this.showEditModal = true;
  }

  closeEdit(): void {
    if (this.editing) return;
    this.showEditModal = false;
    this.editForm = this.emptyEditForm();
  }

  saveEdit(): void {
    if (this.editing) return;
    if (!this.editForm.id) return;

    this.errorMessage = '';
    this.successMessage = '';

    const id = this.editForm.id;
    const email = this.editForm.email.trim().toLowerCase();
    const host = this.editForm.imapHost.trim();
    const port = Number(this.editForm.imapPort ?? 993);

    if (!email) return void (this.errorMessage = 'Email inválido.');
    if (!host) return void (this.errorMessage = 'Host IMAP inválido.');
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      return void (this.errorMessage = 'Puerto inválido.');
    }

    // Enviar solo lo necesario; password solo si el usuario escribió
    const payload: any = {
      email,
      imapHost: host,
      imapPort: port,
      useTls: !!this.editForm.useTls,
      isCatchAll: !!this.editForm.isCatchAll,
      active: !!this.editForm.active,
    };

    const pass = this.editForm.password.trim();
    if (pass) payload.password = pass;

    this.editing = true;
    this.rowLoading.add(id);

    this.http
      .patch(`${environment.apiUrl}/imap/accounts/${id}`, payload, {
        headers: this.authHeaders(),
      })
      .pipe(
        finalize(() => {
          this.editing = false;
          this.rowLoading.delete(id);
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Cuenta actualizada correctamente.';
          this.showEditModal = false;
          this.editForm = this.emptyEditForm();
          this.fetchAccounts();
        },
        error: (err) => this.handleHttpError(err, 'al actualizar la cuenta'),
      });
  }

  // =========================
  // Delete: Confirm modal
  // =========================
  askDelete(a: ImapAccount): void {
    if (this.rowLoading.has(a.id)) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.pendingDelete = a;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.showDeleteModal = false;
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    if (this.deleting) return;

    const a = this.pendingDelete;

    this.deleting = true;
    this.rowLoading.add(a.id);

    this.http
      .delete(`${environment.apiUrl}/imap/accounts/${a.id}`, {
        headers: this.authHeaders(),
      })
      .pipe(
        finalize(() => {
          this.deleting = false;
          this.rowLoading.delete(a.id);
          this.showDeleteModal = false;
          this.pendingDelete = null;
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = `Cuenta eliminada: ${a.email}`;
          this.accounts = this.accounts.filter((x) => x.id !== a.id);
        },
        error: (err) => this.handleHttpError(err, 'al eliminar la cuenta'),
      });
  }

  // =========================
  // Search
  // =========================
  get filteredAccounts(): ImapAccount[] {
    const query = this.q.trim().toLowerCase();
    if (!query) return this.accounts;

    return this.accounts.filter((a) => {
      const email = (a.email || '').toLowerCase();
      const host = (a.imapHost || '').toLowerCase();
      return (
        email.includes(query) ||
        host.includes(query) ||
        String(a.id).includes(query)
      );
    });
  }

  // =========================
  // Helpers
  // =========================
  private emptyEditForm(): EditForm {
    return {
      id: null,
      email: '',
      password: '',
      imapHost: '',
      imapPort: 993,
      useTls: true,
      isCatchAll: false,
      active: true,
    };
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

    const msg =
      (typeof err?.error === 'string' ? err.error : err?.error?.message) ??
      err?.message ??
      null;

    this.errorMessage = msg
      ? String(msg)
      : `Error ${err?.status || ''} ${ctx}.`;
  }
}
