import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StreamingSalesService } from '../../../services/streaming-sales.service';
import {
  CustomersService,
  CustomerDTO,
} from '../../../services/customers.service';
import {
  StreamingAccountDTO,
  AccountProfileDTO,
} from '../../../services/streaming-accounts.service';

type PeriodMonths = 1 | 3 | 6 | 12 | null;

@Component({
  selector: 'app-create-sale-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-sale.modal.html',
})
export class CreateSaleModal {
  api = inject(StreamingSalesService);
  customersApi = inject(CustomersService);

  @Input() open = false;
  @Input() account: StreamingAccountDTO | null = null;
  @Input() profile: AccountProfileDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  // =========================
  // Clientes (typeahead + crear)
  // =========================
  customers: CustomerDTO[] = [];
  customersLoading = false;

  customerId: number | null = null;

  customerQuery = '';
  customerDropdownOpen = false;
  customerMatches: CustomerDTO[] = [];
  creatingCustomer = false;

  // =========================
  // Venta
  // =========================
  salePrice = '';
  saleDate = '';

  // periodo
  periodMonths: PeriodMonths = null;
  periodDays: number | null = 30;

  // lo que enviamos al backend
  daysAssigned = 30;
  cutoffDate = '';

  notes = '';

  async ngOnChanges() {
    this.errorMessage = '';

    if (this.open) {
      await this.loadCustomers();

      if (!this.saleDate) this.saleDate = this.todayISO();

      if (this.periodDays == null && this.periodMonths == null) {
        this.periodDays = 30;
      }

      this.refreshCustomerMatches();
      this.recalcCutoffDate();
    }
  }

  // =========================
  // Load customers
  // =========================
  async loadCustomers() {
    this.customersLoading = true;
    try {
      this.customers = await this.customersApi.findAll();
      // no autoseleccionamos (igual que proveedor)
    } catch {
      this.customers = [];
    } finally {
      this.customersLoading = false;
    }
  }

  // =========================
  // Customer typeahead
  // =========================
  onCustomerQueryChange() {
    this.customerDropdownOpen = true;
    this.refreshCustomerMatches();

    // si escribe algo diferente al seleccionado, deselecciona
    const q = this.customerQuery.trim().toLowerCase();
    if (this.customerId) {
      const current = this.customers.find((x: any) => x.id === this.customerId);
      const label = current ? this.getCustomerLabel(current).toLowerCase() : '';
      if (q && !label.includes(q)) this.customerId = null;
    }
  }

  refreshCustomerMatches() {
    const q = this.customerQuery.trim().toLowerCase();
    if (!q) {
      this.customerMatches = [];
      return;
    }

    this.customerMatches = this.customers
      .filter((c: any) => {
        const hay =
          `${c.name ?? ''} ${c.contact ?? ''} ${c.source ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }

  selectCustomer(c: CustomerDTO) {
    this.customerId = (c as any).id;
    this.customerQuery = this.getCustomerLabel(c);
    this.customerDropdownOpen = false;
    this.customerMatches = [];
  }

  onCustomerBlur() {
    setTimeout(() => {
      this.customerDropdownOpen = false;
    }, 120);
  }

  // enter: si hay match, selecciona; si no, crea si procede
  onCustomerEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();

    if (this.creatingCustomer || this.customersLoading) return;

    const q = this.customerQuery.trim();

    // 1) ya seleccionado
    if (this.customerId) {
      this.customerDropdownOpen = false;
      return;
    }

    // 2) hay matches -> seleccionar primero
    if (this.customerMatches.length > 0) {
      this.selectCustomer(this.customerMatches[0]);
      return;
    }

    // 3) no hay match -> crear
    if (q.length >= 2 && this.canCreateCustomerFromQuery()) {
      this.createCustomerFromQuery();
    }
  }

  trackCustomer = (_: number, c: CustomerDTO) => (c as any).id;

  getCustomerLabel(c: any): string {
    const name = (c.name ?? '').trim();
    const contact = (c.contact ?? '').trim();
    const source = (c.source ?? '').trim();

    // muestra igual que proveedor: name · contact (y si hay source, lo añadimos)
    const parts = [name, contact, source].filter(Boolean);

    if (parts.length === 0) return `#${c.id}`;
    return parts.join(' · ');
  }

  getCustomerLabelById(id: number): string {
    const c: any = this.customers.find((x: any) => x.id === id);
    return c ? this.getCustomerLabel(c) : '';
  }

  canCreateCustomerFromQuery(): boolean {
    const q = this.customerQuery.trim();
    if (q.length < 2) return false;

    // si ya existe exacto por name o contact, no crear
    const qq = q.toLowerCase();
    const exact = this.customers.some((c: any) => {
      const name = (c.name ?? '').trim().toLowerCase();
      const contact = (c.contact ?? '').trim().toLowerCase();
      return name === qq || contact === qq;
    });

    return !exact;
  }

  async createCustomerFromQuery() {
    const q = this.customerQuery.trim();
    if (q.length < 2 || this.creatingCustomer) return;

    this.creatingCustomer = true;
    this.errorMessage = '';

    try {
      // name/contact igual al query, y source opcional también lo ponemos
      const created: any = await this.customersApi.create({
        name: q,
        contact: q,
        source: q, // opcional, pero sirve como "proviene"
      });

      // si retorna el cliente creado
      if (created?.id) {
        this.customers = [created, ...this.customers];
        this.selectCustomer(created);
        return;
      }

      // si tu API no retorna el objeto creado, recargamos y buscamos
      await this.loadCustomers();
      const found: any = this.customers.find((c: any) => {
        const name = (c.name ?? '').trim().toLowerCase();
        const contact = (c.contact ?? '').trim().toLowerCase();
        return name === q.toLowerCase() || contact === q.toLowerCase();
      });

      if (found) this.selectCustomer(found);
    } catch (e: any) {
      this.errorMessage = e?.error?.message ?? 'No se pudo crear el cliente.';
    } finally {
      this.creatingCustomer = false;
    }
  }

  // =========================
  // Fecha / periodo
  // =========================
  private todayISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onSaleDateChange(_: any) {
    this.recalcCutoffDate();
  }

  private parseISODate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  private toISODate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  }

  private addMonths(base: Date, months: number): Date {
    const d = new Date(base);
    const day = d.getDate();

    d.setDate(1);
    d.setMonth(d.getMonth() + months);

    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));

    return d;
  }

  private recalcCutoffDate() {
    const base = this.parseISODate(this.saleDate);
    if (!base) {
      this.cutoffDate = '';
      this.daysAssigned = 0;
      return;
    }

    // prioridad: días
    const days = this.periodDays === null ? null : Number(this.periodDays);
    if (Number.isFinite(days as number) && (days as number) >= 1) {
      this.daysAssigned = days as number;
      this.cutoffDate = this.toISODate(this.addDays(base, this.daysAssigned));
      return;
    }

    // si no hay días, usar meses
    if (this.periodMonths !== null) {
      const end = this.addMonths(base, this.periodMonths);
      this.cutoffDate = this.toISODate(end);

      const diff = end.getTime() - base.getTime();
      this.daysAssigned = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      return;
    }

    this.cutoffDate = '';
    this.daysAssigned = 0;
  }

  onPeriodMonthsChange(value: any) {
    const v = value === null ? null : Number(value);
    this.periodMonths =
      v === 1 || v === 3 || v === 6 || v === 12 ? (v as 1 | 3 | 6 | 12) : null;

    // si elige meses, limpia días
    if (this.periodMonths !== null) {
      this.periodDays = null;
    }

    this.recalcCutoffDate();
  }

  onPeriodDaysChange(value: any) {
    const raw = value === '' || value === null ? null : Number(value);

    if (!Number.isFinite(raw as number) || (raw as number) < 1) {
      this.periodDays = null;
      this.recalcCutoffDate();
      return;
    }

    this.periodDays = raw as number;
    this.periodMonths = null;
    this.recalcCutoffDate();
  }

  // =========================
  // Modal helpers
  // =========================
  reset() {
    this.errorMessage = '';
    this.loading = false;

    this.customerId = null;
    this.customerQuery = '';
    this.customerMatches = [];
    this.customerDropdownOpen = false;
    this.creatingCustomer = false;

    this.salePrice = '';
    this.saleDate = this.todayISO();

    this.periodMonths = null;
    this.periodDays = 30;
    this.daysAssigned = 30;
    this.cutoffDate = '';

    this.notes = '';

    this.recalcCutoffDate();
  }

  onClose() {
    this.reset();
    this.close.emit();
  }

  // acepta solo números y coma/punto decimal
  private normalizeDecimal(value: string): string {
    if (value == null) return '';

    let sanitized = value.replace(/[^0-9.,]/g, '');

    if (sanitized.includes(',') && sanitized.includes('.')) {
      sanitized = sanitized.replace(/\./g, '').replace(',', '.');
    }

    if (sanitized.includes(',') && !sanitized.includes('.')) {
      sanitized = sanitized.replace(',', '.');
    }

    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts.shift()! + '.' + parts.join('');
    }

    return sanitized;
  }

  async submit(): Promise<void> {
    this.errorMessage = '';

    if (!this.account) {
      this.errorMessage = 'Cuenta inválida.';
      return;
    }
    if (!this.profile) {
      this.errorMessage = 'Perfil inválido.';
      return;
    }

    // ✅ si no seleccionó cliente pero escribió algo, intenta crearlo automáticamente
    if (!this.customerId && this.customerQuery.trim().length >= 2) {
      if (this.canCreateCustomerFromQuery()) {
        await this.createCustomerFromQuery();
      }
    }

    if (!this.customerId) {
      this.errorMessage = 'Selecciona o crea un cliente.';
      return;
    }

    this.salePrice = this.normalizeDecimal(this.salePrice);

    if (!this.salePrice) {
      this.errorMessage = 'salePrice requerido.';
      return;
    }
    if (!this.saleDate) {
      this.errorMessage = 'saleDate requerido.';
      return;
    }
    if (!Number.isInteger(this.daysAssigned) || this.daysAssigned <= 0) {
      this.errorMessage = 'daysAssigned inválido.';
      return;
    }

    this.loading = true;
    try {
      await this.api.create({
        accountId: this.account.id,
        profileId: this.profile.id,
        customerId: this.customerId,
        salePrice: this.salePrice,
        saleDate: new Date(this.saleDate).toISOString(),
        daysAssigned: this.daysAssigned,
        notes: this.notes?.trim() ? this.notes.trim() : undefined,
      });

      this.created.emit();
      this.onClose();
      return;
    } catch (e: any) {
      this.errorMessage = e?.error?.message ?? 'No se pudo crear la venta.';
      return;
    } finally {
      this.loading = false;
    }
  }
}
