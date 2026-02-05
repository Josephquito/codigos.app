import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type CustomerDTO = {
  id: number;
  companyId: number;
  name: string;
  contact: string;
  source: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCustomerDto = {
  name: string;
  contact: string;
  source?: string;
};

export type UpdateCustomerDto = {
  name?: string;
  contact?: string;
  source?: string;
};

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/customers`;

  findAll(): Promise<CustomerDTO[]> {
    return firstValueFrom(this.http.get<CustomerDTO[]>(this.base));
  }

  create(dto: CreateCustomerDto): Promise<CustomerDTO> {
    return firstValueFrom(this.http.post<CustomerDTO>(this.base, dto));
  }

  update(id: number, dto: UpdateCustomerDto): Promise<CustomerDTO> {
    return firstValueFrom(
      this.http.patch<CustomerDTO>(`${this.base}/${id}`, dto),
    );
  }

  remove(id: number): Promise<{ ok: true }> {
    return firstValueFrom(this.http.delete<{ ok: true }>(`${this.base}/${id}`));
  }
}
