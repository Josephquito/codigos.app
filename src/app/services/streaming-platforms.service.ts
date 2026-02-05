import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type StreamingPlatformDTO = {
  id: number;
  companyId: number;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateStreamingPlatformDto = {
  name: string;
  active?: boolean;
};

export type UpdateStreamingPlatformDto = {
  name?: string;
  active?: boolean;
};

@Injectable({ providedIn: 'root' })
export class StreamingPlatformsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/streaming-platforms`;

  findAll(): Promise<StreamingPlatformDTO[]> {
    return firstValueFrom(this.http.get<StreamingPlatformDTO[]>(this.base));
  }

  create(dto: CreateStreamingPlatformDto): Promise<StreamingPlatformDTO> {
    return firstValueFrom(this.http.post<StreamingPlatformDTO>(this.base, dto));
  }

  update(
    id: number,
    dto: UpdateStreamingPlatformDto,
  ): Promise<StreamingPlatformDTO> {
    return firstValueFrom(
      this.http.patch<StreamingPlatformDTO>(`${this.base}/${id}`, dto),
    );
  }

  remove(id: number): Promise<{ ok: true }> {
    return firstValueFrom(this.http.delete<{ ok: true }>(`${this.base}/${id}`));
  }
}
