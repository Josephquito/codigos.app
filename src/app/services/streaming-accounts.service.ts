import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type StreamingAccountStatus = 'ACTIVE' | 'INACTIVE';
export type ProfileStatus = 'AVAILABLE' | 'SOLD' | 'BLOCKED';

export type SupplierDTO = { id: number; name: string; contact: string };
export type PlatformDTO = { id: number; name: string; active: boolean };

export type AccountProfileDTO = {
  id: number;
  accountId: number;
  profileNo: number;
  status: ProfileStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type StreamingAccountDTO = {
  id: number;
  companyId: number;
  platformId: number;
  supplierId: number;
  email: string;
  password: string;
  profilesTotal: number;
  purchaseDate: string;
  cutoffDate: string;
  totalCost: string; // decimal string from backend
  notes: string | null;
  status: StreamingAccountStatus;
  createdAt?: string;
  updatedAt?: string;

  platform?: PlatformDTO;
  supplier?: SupplierDTO;
  profiles?: AccountProfileDTO[];
};

export type CreateStreamingAccountDto = {
  platformId: number;
  supplierId: number;
  email: string;
  password: string;
  profilesTotal: number;
  purchaseDate: string; // ISO
  cutoffDate: string; // ISO
  totalCost: string; // decimal string
  notes?: string;
};

export type UpdateStreamingAccountDto = {
  platformId?: number;
  supplierId?: number;
  email?: string;
  password?: string;
  profilesTotal?: number;
  purchaseDate?: string;
  cutoffDate?: string;
  totalCost?: string;
  notes?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
};

@Injectable({ providedIn: 'root' })
export class StreamingAccountsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/streaming-accounts`;

  findAll(): Promise<StreamingAccountDTO[]> {
    return firstValueFrom(this.http.get<StreamingAccountDTO[]>(this.base));
  }

  findOne(id: number): Promise<StreamingAccountDTO> {
    return firstValueFrom(
      this.http.get<StreamingAccountDTO>(`${this.base}/${id}`),
    );
  }

  create(dto: CreateStreamingAccountDto): Promise<StreamingAccountDTO> {
    return firstValueFrom(this.http.post<StreamingAccountDTO>(this.base, dto));
  }

  update(
    id: number,
    dto: UpdateStreamingAccountDto,
  ): Promise<StreamingAccountDTO> {
    return firstValueFrom(
      this.http.patch<StreamingAccountDTO>(`${this.base}/${id}`, dto),
    );
  }
}
