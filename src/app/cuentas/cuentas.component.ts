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

type Plataforma =
  | 'disney'
  | 'netflix'
  | 'prime'
  | 'chatgpt'
  | 'crunchyroll'
  | string;

export type CuentaItem = {
  id: number;
  emailAlias: string;
  plataforma: string;
  clave: string;
  createdAt: string; // ISO
  passwordChangeAt: string; // ISO (fecha programada)
  updatedAt?: string;
  active?: boolean;
};

type NuevaCuenta = {
  emailAlias: string;
  clave: string;
  plataforma: Plataforma | '';
  passwordChangeAt: string; // YYYY-MM-DD (input date)
};

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './cuentas.component.html',
})
export class CuentasComponent implements OnInit {
  // Catálogo
  plataformas: Plataforma[] = [
    'disney',
    'netflix',
    'prime',
    'chatgpt',
    'crunchyroll',
  ];

  // Data
  cuentas: CuentaItem[] = [];
  cuentasAll: CuentaItem[] = [];

  // UI state
  cargando = false;
  rowLoading = new Set<number>();

  errorMessage = '';
  successMessage = '';

  // Search / Filters
  filtro = '';
  filtroPlataforma = ''; // '' = todas
  soloHoy = false;
  countHoy = 0;

  // Create form
  nuevaCuenta: NuevaCuenta = {
    emailAlias: '',
    clave: '',
    plataforma: '',
    passwordChangeAt: '',
  };

  // Confirm delete modal
  confirmOpen = false;
  confirmTarget: CuentaItem | null = null;

  // Edit modal
  editOpen = false;
  editTarget: CuentaItem | null = null;
  savingEdit = false;
  editForm: { clave: string; passwordChangeAt: string } = {
    clave: '',
    passwordChangeAt: '',
  };

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    const role = (this.auth.getRole() || '').toUpperCase();
    if (role !== 'USER' && role !== 'ADMIN') {
      this.errorMessage = 'Acceso restringido.';
      return;
    }

    // default: 30 días desde hoy
    this.nuevaCuenta.passwordChangeAt = this.toDateInputValue(
      this.addDays(new Date(), 30)
    );

    this.cargarCuentas();
  }

  // =========================
  // Fetch
  // =========================
  cargarCuentas(): void {
    this.cargando = true;
    this.errorMessage = '';
    // No limpies success siempre, pero puedes si quieres:
    // this.successMessage = '';

    this.http
      // Si tu backend todavía tiene /cuentas/keys, cambia a:
      // .get<CuentaItem[]>(`${environment.apiUrl}/cuentas/keys`, ...)
      .get<CuentaItem[]>(`${environment.apiUrl}/cuentas`, {
        headers: this.authHeaders(),
      })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          this.cuentasAll = Array.isArray(res) ? res : [];
          this.aplicarFiltros();
        },
        error: (err) => this.handleHttpError(err, 'al cargar cuentas'),
      });
  }

  // =========================
  // Search / Filter
  // =========================
  aplicarFiltros(): void {
    const q = (this.filtro || '').trim().toLowerCase();
    const pf = (this.filtroPlataforma || '').trim().toLowerCase();

    const todayKey = this.dateKeyLocal(new Date());

    // contador HOY sobre TODO el dataset (usando fecha-only)
    this.countHoy = this.cuentasAll.filter((c) => {
      const d = this.parseDateOnlyLocal(c.passwordChangeAt);
      return d ? this.dateKeyLocal(d) === todayKey : false;
    }).length;

    this.cuentas = this.cuentasAll.filter((c) => {
      const email = (c.emailAlias || '').toLowerCase();
      const plat = (c.plataforma || '').toLowerCase();
      const id = String(c.id);

      const matchQ =
        !q || email.includes(q) || plat.includes(q) || id.includes(q);

      const matchP = !pf || plat === pf;

      const matchHoy = !this.soloHoy
        ? true
        : (() => {
            const d = this.parseDateOnlyLocal(c.passwordChangeAt);
            return d ? this.dateKeyLocal(d) === todayKey : false;
          })();

      return matchQ && matchP && matchHoy;
    });
  }

  /** Convierte "YYYY-MM-DD" o ISO a Date en medianoche local (sin desfase por TZ) */
  private parseDateOnlyLocal(value: string): Date | null {
    if (!value) return null;

    const dateOnly = value.includes('T') ? value.split('T')[0] : value; // YYYY-MM-DD
    const [y, m, d] = dateOnly.split('-').map(Number);
    if (!y || !m || !d) return null;

    const dt = new Date(y, m - 1, d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  toggleSoloHoy(): void {
    this.soloHoy = !this.soloHoy;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.filtro = '';
    this.filtroPlataforma = '';
    this.soloHoy = false;
    this.aplicarFiltros();
  }

  // =========================
  // Create
  // =========================
  registrarCuenta(): void {
    if (this.cargando) return;

    this.errorMessage = '';
    this.successMessage = '';

    const emailAlias = (this.nuevaCuenta.emailAlias || '').trim().toLowerCase();
    const clave = (this.nuevaCuenta.clave || '').trim();
    const plataforma = (this.nuevaCuenta.plataforma || '').trim().toLowerCase();
    const passwordChangeAt = (this.nuevaCuenta.passwordChangeAt || '').trim(); // YYYY-MM-DD

    if (!emailAlias || !clave || !plataforma) {
      this.errorMessage = 'Completa correo, clave y plataforma.';
      return;
    }

    if (!passwordChangeAt) {
      this.errorMessage = 'Selecciona la fecha programada de cambio de clave.';
      return;
    }

    this.cargando = true;

    this.http
      // Si tu backend todavía tiene /cuentas/keys, cambia a:
      // .post(`${environment.apiUrl}/cuentas/keys`, {...})
      .post(
        `${environment.apiUrl}/cuentas`,
        { emailAlias, clave, plataforma, passwordChangeAt },
        { headers: this.authHeaders() }
      )
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Cuenta agregada correctamente.';
          this.nuevaCuenta.clave = '';
          this.nuevaCuenta.passwordChangeAt = this.toDateInputValue(
            this.addDays(new Date(), 30)
          );
          this.cargarCuentas();
        },
        error: (err) => this.handleHttpError(err, 'al agregar cuenta'),
      });
  }

  // =========================
  // Edit (MODAL)
  // =========================
  abrirEditar(c: CuentaItem): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.editTarget = c;
    this.editOpen = true;

    // Pre-cargar form (ojo: no pongas "***" si quieres editar real)
    this.editForm = {
      clave: c.clave || '',
      passwordChangeAt: this.toDateInputValue(new Date(c.passwordChangeAt)),
    };
  }

  cerrarEditar(): void {
    if (this.savingEdit) return;
    this.editOpen = false;
    this.editTarget = null;
    this.editForm = { clave: '', passwordChangeAt: '' };
  }

  guardarEditar(): void {
    if (!this.editTarget) return;
    if (this.savingEdit) return;

    this.errorMessage = '';
    this.successMessage = '';

    const id = this.editTarget.id;
    const clave = (this.editForm.clave || '').trim();
    const passwordChangeAt = (this.editForm.passwordChangeAt || '').trim(); // YYYY-MM-DD

    if (!clave) {
      this.errorMessage = 'La clave no puede estar vacía.';
      return;
    }
    if (!passwordChangeAt) {
      this.errorMessage = 'Selecciona la fecha programada de cambio de clave.';
      return;
    }

    this.savingEdit = true;
    this.rowLoading.add(id);

    this.http
      // Si tu backend usa PATCH /cuentas/keys/:email/:plataforma,
      // entonces aquí se arma con editTarget.emailAlias + editTarget.plataforma.
      .patch(
        `${environment.apiUrl}/cuentas/${id}`,
        { clave, passwordChangeAt },
        { headers: this.authHeaders() }
      )
      .pipe(
        finalize(() => {
          this.savingEdit = false;
          this.rowLoading.delete(id);
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Cuenta actualizada.';
          this.cerrarEditar();
          this.cargarCuentas();
        },
        error: (err) => this.handleHttpError(err, 'al actualizar cuenta'),
      });
  }

  // =========================
  // Delete (confirm modal)
  // =========================
  abrirConfirmEliminar(c: CuentaItem): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.confirmTarget = c;
    this.confirmOpen = true;
  }

  cancelarEliminar(): void {
    this.confirmOpen = false;
    this.confirmTarget = null;
  }

  confirmarEliminar(): void {
    if (!this.confirmTarget) return;

    const id = this.confirmTarget.id;
    if (this.rowLoading.has(id)) return;

    this.rowLoading.add(id);

    this.http
      .delete(`${environment.apiUrl}/cuentas/${id}`, {
        headers: this.authHeaders(),
      })
      .pipe(finalize(() => this.rowLoading.delete(id)))
      .subscribe({
        next: () => {
          this.successMessage =
            'Cuenta eliminada. Tus clientes no podrán ver los códigos de este email.';
          this.cuentasAll = this.cuentasAll.filter((x) => x.id !== id);
          this.aplicarFiltros();
          this.confirmOpen = false;
          this.confirmTarget = null;
        },
        error: (err) => this.handleHttpError(err, 'al eliminar cuenta'),
      });
  }

  // =========================
  // Days helpers (para UI)
  // =========================
  diasRestantes(value: string): number {
    if (!value) return 0;

    // Cortamos a YYYY-MM-DD si viene ISO
    const dateOnly = value.includes('T') ? value.split('T')[0] : value;
    const [y, m, d] = dateOnly.split('-').map(Number);
    if (!y || !m || !d) return 0;

    // Medianoche LOCAL
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diff = target.getTime() - now.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  // =========================
  // Filter helpers
  // =========================
  private dateKeyLocal(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // =========================
  // Misc helpers
  // =========================
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
      this.errorMessage = 'No autorizado.';
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

  private addDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }

  /** Convierte Date a "YYYY-MM-DD" para input[type=date] */
  private toDateInputValue(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
