import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SupplierDTO,
  SuppliersService,
} from '../../../services/suppliers.service';

@Component({
  selector: 'app-delete-supplier-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-supplier.modal.html',
})
export class DeleteSupplierModal {
  api = inject(SuppliersService);

  @Input() open = false;
  @Input() supplier: SupplierDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  onClose() {
    this.errorMessage = '';
    this.loading = false;
    this.close.emit();
  }

  async confirm() {
    if (!this.supplier || this.loading) return;

    this.errorMessage = '';
    this.loading = true;

    try {
      await this.api.remove(this.supplier.id);
      this.deleted.emit();
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudo eliminar el proveedor.';
    } finally {
      this.loading = false;
    }
  }
}
