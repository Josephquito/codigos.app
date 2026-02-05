import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  StreamingPlatformsService,
  StreamingPlatformDTO,
} from '../../../services/streaming-platforms.service';

@Component({
  selector: 'app-delete-platform-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-platform.modal.html',
})
export class DeletePlatformModal {
  api = inject(StreamingPlatformsService);

  @Input() open = false;
  @Input() platform: StreamingPlatformDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  onClose() {
    this.errorMessage = '';
    this.close.emit();
  }

  async submit() {
    if (!this.platform) return;

    this.errorMessage = '';
    this.loading = true;
    try {
      await this.api.remove(this.platform.id);
      this.deleted.emit();
      this.onClose();
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudo eliminar la plataforma.';
    } finally {
      this.loading = false;
    }
  }
}
