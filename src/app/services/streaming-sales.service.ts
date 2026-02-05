import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type SaleStatus = 'ACTIVE' | 'CANCELLED';

export type StreamingSaleDTO = {
  id: number;
  companyId: number;
  platformId: number;
  accountId: number;
  profileId: number;
  customerId: number;

  salePrice: string;
  saleDate: string;
  daysAssigned: number;
  cutoffDate: string;

  costAtSale: string;
  notes: string | null;
  status: SaleStatus;

  createdAt?: string;
  updatedAt?: string;

  customer?: {
    id: number;
    name: string;
    contact: string;
    source?: string | null;
  };
  platform?: { id: number; name: string };
  account?: { id: number; email: string };
  profile?: { id: number; profileNo: number; status: string };
};

export type CreateStreamingSaleDto = {
  accountId: number;
  profileId: number;
  customerId: number;
  salePrice: string;
  saleDate: string; // ISO
  daysAssigned: number;
  notes?: string;
};

export type UpdateStreamingSaleDto = {
  notes?: string;
  status?: 'ACTIVE' | 'CANCELLED';
};

@Injectable({ providedIn: 'root' })
export class StreamingSalesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/streaming-sales`;

  findAll(): Promise<StreamingSaleDTO[]> {
    return firstValueFrom(this.http.get<StreamingSaleDTO[]>(this.base));
  }

  create(dto: CreateStreamingSaleDto): Promise<StreamingSaleDTO> {
    return firstValueFrom(this.http.post<StreamingSaleDTO>(this.base, dto));
  }

  update(id: number, dto: UpdateStreamingSaleDto): Promise<StreamingSaleDTO> {
    return firstValueFrom(
      this.http.patch<StreamingSaleDTO>(`${this.base}/${id}`, dto),
    );
  }
}
