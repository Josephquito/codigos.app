import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  StreamingAccountsService,
  StreamingAccountDTO,
  AccountProfileDTO,
} from '../../../services/streaming-accounts.service';

import { CreateSaleModal } from '../create-sale/create-sale.modal';

import {
  StreamingSalesService,
  StreamingSaleDTO,
} from '../../../services/streaming-sales.service';

@Component({
  selector: 'app-view-account-modal',
  standalone: true,
  imports: [CommonModule, CreateSaleModal],
  templateUrl: './view-account.modal.html',
})
export class ViewAccountModal {
  accountsApi = inject(StreamingAccountsService);
  salesApi = inject(StreamingSalesService);

  @Input() open = false;
  @Input() account: StreamingAccountDTO | null = null;
  @Input() canSell = false;

  @Output() close = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();
  @Output() saleCreated = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  // venta modal
  createSaleOpen = false;
  selectedProfile: AccountProfileDTO | null = null;

  // ✅ ventas indexadas por profileId
  salesByProfileId = new Map<number, StreamingSaleDTO>();

  // ✅ menú flotante
  menuOpen = false;
  menuProfile: AccountProfileDTO | null = null;
  menuX = 0;
  menuY = 0;

  ngOnChanges() {
    this.errorMessage = '';
    if (this.open && this.account) {
      this.refresh();
    }
  }

  onClose() {
    this.errorMessage = '';
    this.createSaleOpen = false;
    this.selectedProfile = null;

    this.closeMenu();
    this.close.emit();
  }

  async refresh() {
    if (!this.account) return;

    this.loading = true;
    try {
      this.closeMenu();

      // 1) refresca cuenta con perfiles
      const fresh = await this.accountsApi.findOne(this.account.id);
      this.account = fresh;

      // 2) carga ventas y filtra por cuenta
      const allSales = await this.salesApi.findAll();
      const forThisAccount = allSales.filter(
        (s) => s.accountId === this.account!.id,
      );

      // 3) map por profileId (prioriza ACTIVE y la más reciente)
      this.salesByProfileId = this.buildSalesIndex(forThisAccount);
    } catch (e: any) {
      this.errorMessage = e?.error?.message ?? 'No se pudo cargar la cuenta.';
    } finally {
      this.loading = false;
    }
  }

  private buildSalesIndex(
    sales: StreamingSaleDTO[],
  ): Map<number, StreamingSaleDTO> {
    const map = new Map<number, StreamingSaleDTO>();

    const sorted = [...sales].sort((a, b) => {
      const aActive = a.status === 'ACTIVE' ? 0 : 1;
      const bActive = b.status === 'ACTIVE' ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;

      const ad = new Date(a.updatedAt ?? a.createdAt ?? a.saleDate).getTime();
      const bd = new Date(b.updatedAt ?? b.createdAt ?? b.saleDate).getTime();
      return bd - ad;
    });

    for (const s of sorted) {
      if (!map.has(s.profileId)) map.set(s.profileId, s);
    }

    return map;
  }

  getSaleForProfile(p: AccountProfileDTO): StreamingSaleDTO | null {
    return this.salesByProfileId.get(p.id) ?? null;
  }

  // =========================
  // Menú flotante (igual a tu tabla principal)
  // =========================
  toggleProfileMenu(p: AccountProfileDTO, ev: MouseEvent) {
    ev.stopPropagation();

    if (p.status === 'AVAILABLE') return;

    if (this.menuOpen && this.menuProfile?.id === p.id) {
      this.closeMenu();
      return;
    }

    this.menuOpen = true;
    this.menuProfile = p;

    const btn = ev.currentTarget as HTMLElement;

    // ✅ modal-box (contenedor relativo)
    const modalBox = btn.closest('.modal-box') as HTMLElement | null;
    if (!modalBox) {
      // fallback: usa mouse
      this.menuX = ev.clientX;
      this.menuY = ev.clientY;
      return;
    }

    const btnRect = btn.getBoundingClientRect();
    const boxRect = modalBox.getBoundingClientRect();

    // coordenadas relativas al modal-box
    this.menuX = btnRect.right - boxRect.left;
    this.menuY = btnRect.bottom - boxRect.top + 6;
  }

  closeMenu() {
    this.menuOpen = false;
    this.menuProfile = null;
  }

  // ⚠️ En modales, el padre también tiene document:click.
  // Como usamos stopPropagation en botón y menú, este listener no debería “matar” el open.
  @HostListener('document:click')
  onDocClick() {
    this.closeMenu();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.closeMenu();
  }

  // placeholders
  onEditProfile(_p: AccountProfileDTO) {
    // TODO: abrir modal editar
  }

  onEmptyProfile(_p: AccountProfileDTO) {
    // TODO: vaciar/cancelar
  }

  // =========================
  // Venta modal
  // =========================
  openSell(p: AccountProfileDTO) {
    this.closeMenu();

    if (!this.canSell) return;
    if (!this.account) return;
    if (p.status !== 'AVAILABLE') return;

    this.selectedProfile = p;
    this.createSaleOpen = true;
  }

  onSaleDone() {
    this.createSaleOpen = false;
    this.selectedProfile = null;

    this.closeMenu();
    this.saleCreated.emit();
  }

  // =========================
  // Helpers UI
  // =========================
  daysRemaining(cutoffDate?: string | Date | null) {
    if (!cutoffDate) return null;
    const d = new Date(cutoffDate);
    if (Number.isNaN(d.getTime())) return null;

    const now = new Date();
    const diff = d.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  alertBadgeClass(days: number | null) {
    if (days === null) return 'badge-ghost';
    if (days < 0) return 'badge-error';
    if (days <= 3) return 'badge-warning';
    return 'badge-success';
  }
}
