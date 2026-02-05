import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CustomerDTO,
  CustomersService,
} from '../../../services/customers.service';

@Component({
  selector: 'app-edit-customer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-customer.modal.html',
})
export class EditCustomerModal {
  api = inject(CustomersService);

  @Input() open = false;
  @Input() customer: CustomerDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  name = '';
  contact = '';
  source = '';

  ngOnChanges() {
    if (this.open && this.customer) {
      this.name = this.customer.name ?? '';
      this.contact = this.customer.contact ?? '';
      this.source = this.customer.source ?? '';
      this.loading = false;
      this.errorMessage = '';
    }
  }

  onClose() {
    this.close.emit();
  }

  async submit() {
    if (!this.customer || this.loading) return;

    this.errorMessage = '';

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
      await this.api.update(this.customer.id, {
        name: this.name.trim(),
        contact: this.contact.trim(),
        source: this.source.trim().length ? this.source.trim() : '',
      });
      this.updated.emit();
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudo actualizar el cliente.';
    } finally {
      this.loading = false;
    }
  }
}
