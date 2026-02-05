import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CustomerDTO,
  CustomersService,
} from '../../../services/customers.service';

@Component({
  selector: 'app-delete-customer-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-customer.modal.html',
})
export class DeleteCustomerModal {
  api = inject(CustomersService);

  @Input() open = false;
  @Input() customer: CustomerDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  onClose() {
    this.loading = false;
    this.errorMessage = '';
    this.close.emit();
  }

  async confirm() {
    if (!this.customer || this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.api.remove(this.customer.id);
      this.deleted.emit();
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudo eliminar el cliente.';
    } finally {
      this.loading = false;
    }
  }
}
