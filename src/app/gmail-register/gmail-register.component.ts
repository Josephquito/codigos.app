import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../guards/auth.service';
import { environment } from '../../environments/environment';

type GmailAccount = {
  id: number;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

@Component({
  selector: 'app-gmail-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './gmail-register.component.html',
})
export class GmailRegisterComponent implements OnInit {
  email = '';

  loading = false; // carga tabla
  connecting = false; // botón conectar arriba
  rowLoading = new Set<number>(); // eliminar/renovar por fila

  accounts: GmailAccount[] = [];

  errorMessage = '';
  successMessage = '';

  private platformId = inject(PLATFORM_ID);

  // =========================
  // ✅ Modal confirmación delete
  // =========================
  showDeleteModal = false;
  pendingDelete: GmailAccount | null = null;
  deleting = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Mensaje al volver del callback
    const connected = this.route.snapshot.queryParamMap.get('connected');
    if (connected === '1') {
      this.successMessage = '✅ Cuenta autorizada correctamente';
      // limpiar query param para que no se repita al refresh
      this.router.navigate([], {
        queryParams: { connected: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    this.fetchAccounts();
  }

  fetchAccounts(): void {
    this.loading = true;
    this.errorMessage = '';
    // no borramos success siempre; a veces quieres ver "✅ ..." + tabla
    this.http
      .get<GmailAccount[]>(`${environment.apiUrl}/gmail/accounts`, {
        headers: this.authHeaders(),
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.accounts = Array.isArray(res) ? res : [];
        },
        error: (err) =>
          this.handleHttpError(err, 'al cargar tus cuentas Gmail'),
      });
  }

  connect(): void {
    if (this.connecting) return;

    const email = this.email.trim().toLowerCase();

    this.errorMessage = '';
    this.successMessage = '';

    if (!email) {
      this.errorMessage = 'Ingresa un correo Gmail.';
      return;
    }
    if (!this.isGmail(email)) {
      this.errorMessage = 'Solo se permite correo @gmail.com';
      return;
    }

    this.connecting = true;

    // 1) Intentar login-url (nuevo registro)
    this.http
      .get<{ url: string }>(
        `${environment.apiUrl}/gmail/login-url/${encodeURIComponent(email)}`,
        { headers: this.authHeaders() }
      )
      .pipe(finalize(() => (this.connecting = false)))
      .subscribe({
        next: (res) => {
          if (!res?.url) {
            this.errorMessage = 'El servidor no devolvió URL de autorización.';
            return;
          }
          this.redirect(res.url);
        },
        error: (err) => {
          // Si ya existe, el backend devuelve 400 (BadRequest)
          // entonces hacemos fallback automático a renew-url.
          if (err?.status === 400) {
            this.renewByEmail(email);
            return;
          }
          this.handleHttpError(err, 'al iniciar autorización');
        },
      });
  }

  renewRow(a: GmailAccount): void {
    if (this.rowLoading.has(a.id)) return;
    this.errorMessage = '';
    this.successMessage = '';

    this.rowLoading.add(a.id);
    this.http
      .get<{ url: string }>(
        `${environment.apiUrl}/gmail/renew-url/${encodeURIComponent(a.email)}`,
        { headers: this.authHeaders() }
      )
      .pipe(finalize(() => this.rowLoading.delete(a.id)))
      .subscribe({
        next: (res) => {
          if (!res?.url) {
            this.errorMessage = 'El servidor no devolvió URL de autorización.';
            return;
          }
          this.redirect(res.url);
        },
        error: (err) => this.handleHttpError(err, 'al renovar autorización'),
      });
  }

  // =========================
  // ✅ Confirmación de eliminación (solo front)
  // =========================

  askDelete(a: GmailAccount): void {
    if (this.rowLoading.has(a.id)) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.pendingDelete = a;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    // Si ya está eliminando, no permitimos cerrar para evitar estados inconsistentes
    if (this.deleting) return;

    this.showDeleteModal = false;
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;

    // Evita doble click
    if (this.deleting) return;

    this.deleteRow(this.pendingDelete);
  }

  // =========================
  // ✅ Eliminación real (backend)
  // =========================
  deleteRow(a: GmailAccount): void {
    if (this.rowLoading.has(a.id)) return;

    this.errorMessage = '';
    this.successMessage = '';

    // Bloquear modal mientras elimina
    this.deleting = true;

    // También bloquea la fila
    this.rowLoading.add(a.id);

    this.http
      .delete<{ deleted: boolean; email: string }>(
        `${environment.apiUrl}/gmail/accounts/${encodeURIComponent(a.email)}`,
        { headers: this.authHeaders() }
      )
      .pipe(
        finalize(() => {
          this.rowLoading.delete(a.id);
          this.deleting = false;
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

  // ================
  // Helpers
  // ================

  private renewByEmail(email: string): void {
    this.successMessage =
      'Cuenta ya registrada. Redirigiendo para renovar permisos...';

    this.http
      .get<{ url: string }>(
        `${environment.apiUrl}/gmail/renew-url/${encodeURIComponent(email)}`,
        { headers: this.authHeaders() }
      )
      .subscribe({
        next: (res) => {
          if (!res?.url) {
            this.errorMessage = 'El servidor no devolvió URL de autorización.';
            this.successMessage = '';
            return;
          }
          this.redirect(res.url);
        },
        error: (err) => {
          this.successMessage = '';
          this.handleHttpError(err, 'al renovar autorización');
        },
      });
  }

  private redirect(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.location.href = url;
  }

  private isGmail(email: string): boolean {
    return /@gmail\.com$/i.test(email);
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

  q = '';
  get filteredAccounts(): GmailAccount[] {
    const query = this.q.trim().toLowerCase();
    if (!query) return this.accounts;

    return this.accounts.filter((a) => a.email.toLowerCase().includes(query));
  }
}
