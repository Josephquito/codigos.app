import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SupplierDTO,
  SuppliersService,
} from '../../../services/suppliers.service';

@Component({
  selector: 'app-edit-supplier-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-supplier.modal.html',
})
export class EditSupplierModal {
  api = inject(SuppliersService);

  @Input() open = false;
  @Input() supplier: SupplierDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  name = '';
  contact = '';

  ngOnChanges() {
    if (this.open && this.supplier) {
      this.name = this.supplier.name ?? '';
      this.contact = this.supplier.contact ?? '';
      this.errorMessage = '';
      this.loading = false;
    }
  }

  onClose() {
    this.close.emit();
  }

  async submit() {
    this.errorMessage = '';
    if (this.loading || !this.supplier) return;

    if (this.name.trim().length < 2 || this.contact.trim().length < 2) {
      this.errorMessage =
        'Nombre y contacto deben tener al menos 2 caracteres.';
      return;
    }

    this.loading = true;
    try {
      await this.api.update(this.supplier.id, {
        name: this.name.trim(),
        contact: this.contact.trim(),
      });
      this.updated.emit();
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudo actualizar el proveedor.';
    } finally {
      this.loading = false;
    }
  }
}
