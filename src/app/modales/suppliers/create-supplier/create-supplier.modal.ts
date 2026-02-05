import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuppliersService } from '../../../services/suppliers.service';

@Component({
  selector: 'app-create-supplier-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-supplier.modal.html',
})
export class CreateSupplierModal {
  api = inject(SuppliersService);

  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  name = '';
  contact = '';

  onClose() {
    this.reset();
    this.close.emit();
  }

  reset() {
    this.loading = false;
    this.errorMessage = '';
    this.name = '';
    this.contact = '';
  }

  async submit() {
    this.errorMessage = '';
    if (this.loading) return;

    if (this.name.trim().length < 2 || this.contact.trim().length < 2) {
      this.errorMessage =
        'Nombre y contacto deben tener al menos 2 caracteres.';
      return;
    }

    this.loading = true;
    try {
      await this.api.create({
        name: this.name.trim(),
        contact: this.contact.trim(),
      });
      this.reset();
      this.created.emit();
    } catch (e: any) {
      this.errorMessage = e?.error?.message ?? 'No se pudo crear el proveedor.';
    } finally {
      this.loading = false;
    }
  }
}
