import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type SupplierDTO = {
  id: number;
  companyId: number;
  name: string;
  contact: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSupplierDto = {
  name: string;
  contact: string;
};

export type UpdateSupplierDto = {
  name?: string;
  contact?: string;
};

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/suppliers`;

  findAll(): Promise<SupplierDTO[]> {
    return firstValueFrom(
      this.http.get<SupplierDTO[]>(this.base, { withCredentials: true }),
    );
  }

  create(dto: CreateSupplierDto): Promise<SupplierDTO> {
    return firstValueFrom(
      this.http.post<SupplierDTO>(this.base, dto, { withCredentials: true }),
    );
  }

  update(id: number, dto: UpdateSupplierDto): Promise<SupplierDTO> {
    return firstValueFrom(
      this.http.patch<SupplierDTO>(`${this.base}/${id}`, dto, {
        withCredentials: true,
      }),
    );
  }

  remove(id: number): Promise<{ ok: true }> {
    return firstValueFrom(
      this.http.delete<{ ok: true }>(`${this.base}/${id}`, {
        withCredentials: true,
      }),
    );
  }
}
