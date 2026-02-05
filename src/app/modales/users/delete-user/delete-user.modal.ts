import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService, UserDTO } from '../../../services/users.service';

@Component({
  selector: 'app-delete-user-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-user.modal.html',
  styleUrls: ['./delete-user.modal.css'],
})
export class DeleteUserModal {
  private api = inject(UsersService);

  @Input() open = false;
  @Input() user: UserDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  loading = false;
  error = '';

  onClose() {
    if (this.loading) return;
    this.error = '';
    this.close.emit();
  }

  async confirm() {
    if (!this.user || this.loading) return;

    this.loading = true;
    this.error = '';
    try {
      await this.api.remove(this.user.id);
      this.deleted.emit();
    } catch (e: any) {
      const msg = e?.error?.message;
      this.error = Array.isArray(msg)
        ? msg.join(', ')
        : msg || 'Error eliminando usuario';
    } finally {
      this.loading = false;
    }
  }
}
