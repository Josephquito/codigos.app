import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  StreamingAccountsService,
  StreamingAccountDTO,
} from '../../../services/streaming-accounts.service';
import {
  SuppliersService,
  SupplierDTO,
} from '../../../services/suppliers.service';
import { StreamingPlatformDTO } from '../../../services/streaming-platforms.service';

@Component({
  selector: 'app-edit-account-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-account.modal.html',
})
export class EditAccountModal {
  api = inject(StreamingAccountsService);
  suppliersApi = inject(SuppliersService);

  @Input() open = false;
  @Input() account: StreamingAccountDTO | null = null;
  @Input() platforms: StreamingPlatformDTO[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  suppliers: SupplierDTO[] = [];
  suppliersLoading = false;

  platformId: number | null = null;
  supplierId: number | null = null;

  email = '';
  password = '';
  profilesTotal = 0;

  purchaseDate = '';
  cutoffDate = '';
  totalCost = '';
  notes = '';

  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';

  async ngOnChanges() {
    this.errorMessage = '';
    if (this.open) {
      await this.loadSuppliers();
    }

    if (this.account) {
      this.platformId =
        this.account.platformId ?? this.account.platform?.id ?? null;
      this.supplierId =
        this.account.supplierId ?? this.account.supplier?.id ?? null;

      this.email = this.account.email ?? '';
      this.password = this.account.password ?? '';
      this.profilesTotal = this.account.profilesTotal ?? 0;

      this.purchaseDate = this.toDateInput(this.account.purchaseDate);
      this.cutoffDate = this.toDateInput(this.account.cutoffDate);

      this.totalCost = String(this.account.totalCost ?? '0');
      this.notes = this.account.notes ?? '';
      this.status = (this.account.status as any) ?? 'ACTIVE';
    }
  }

  private toDateInput(v: any) {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async loadSuppliers() {
    this.suppliersLoading = true;
    try {
      this.suppliers = await this.suppliersApi.findAll();
    } catch {
      this.suppliers = [];
    } finally {
      this.suppliersLoading = false;
    }
  }

  onClose() {
    this.errorMessage = '';
    this.close.emit();
  }

  async submit(): Promise<void> {
    if (!this.account) return;

    this.errorMessage = '';

    if (!this.platformId) {
      this.errorMessage = 'Selecciona plataforma.';
      return;
    }
    if (!this.supplierId) {
      this.errorMessage = 'Selecciona proveedor.';
      return;
    }
    if (!this.email.trim()) {
      this.errorMessage = 'Email requerido.';
      return;
    }

    this.loading = true;
    try {
      await this.api.update(this.account.id, {
        platformId: this.platformId,
        supplierId: this.supplierId,
        email: this.email.trim(),
        password: this.password,
        profilesTotal: this.profilesTotal,
        purchaseDate: this.purchaseDate,
        cutoffDate: this.cutoffDate,
        totalCost: this.totalCost,
        notes: this.notes?.trim() ? this.notes.trim() : null,
        status: this.status,
      });

      this.updated.emit();
      this.onClose();
      return;
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudo actualizar la cuenta.';
      return;
    } finally {
      this.loading = false;
    }
  }
}
