import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '../../../services/customers.service';

@Component({
  selector: 'app-create-customer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-customer.modal.html',
})
export class CreateCustomerModal {
  api = inject(CustomersService);

  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  name = '';
  contact = '';
  source = '';

  onClose() {
    this.reset();
    this.close.emit();
  }

  reset() {
    this.loading = false;
    this.errorMessage = '';
    this.name = '';
    this.contact = '';
    this.source = '';
  }

  async submit() {
    this.errorMessage = '';
    if (this.loading) return;

    if (this.name.trim().length < 2) {
      this.errorMessage = 'El nombre debe tener al menos 2 caracteres.';
      return;
    }
    if (this.contact.trim().length < 2) {
      this.errorMessage = 'El contacto debe tener al menos 2 caracteres.';
      return;
    }

    this.loading = true;
    try {
      await this.api.create({
        name: this.name.trim(),
        contact: this.contact.trim(),
        source: this.source.trim().length ? this.source.trim() : undefined,
      });
      this.reset();
      this.created.emit();
    } catch (e: any) {
      this.errorMessage = e?.error?.message ?? 'No se pudo crear el cliente.';
    } finally {
      this.loading = false;
    }
  }
}
