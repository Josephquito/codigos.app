import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type KardexItemDTO = {
  id: number;
  companyId: number;
  platformId: number;
  unit: 'PROFILE';
  stock: number;
  avgCost: string;
  platform?: { id: number; name: string };
};

export type KardexMovementDTO = {
  id: number;
  companyId: number;
  itemId: number;
  type: 'IN' | 'OUT' | 'ADJUST';
  refType: string;
  qty: number;
  unitCost: string;
  totalCost: string;
  stockAfter: number;
  avgCostAfter: string;
  createdAt: string;

  item?: {
    id: number;
    platformId: number;
    platform?: { id: number; name: string };
  };
  account?: { id: number; email: string } | null;
  sale?: { id: number; salePrice: string } | null;
};

@Injectable({ providedIn: 'root' })
export class KardexApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/kardex`;

  items(): Promise<KardexItemDTO[]> {
    return firstValueFrom(this.http.get<KardexItemDTO[]>(`${this.base}/items`));
  }

  movements(): Promise<KardexMovementDTO[]> {
    return firstValueFrom(
      this.http.get<KardexMovementDTO[]>(`${this.base}/movements`),
    );
  }

  movementsByPlatform(platformId: number): Promise<KardexMovementDTO[]> {
    return firstValueFrom(
      this.http.get<KardexMovementDTO[]>(`${this.base}/platform/${platformId}`),
    );
  }
}
