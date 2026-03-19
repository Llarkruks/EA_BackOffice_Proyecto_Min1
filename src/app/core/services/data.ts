import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, concatMap, from, map, of, toArray } from 'rxjs';

import { ApiService } from './api';
import { BaseItem } from '../models/base-item';
import { ItemType } from '../models/item-type';
import { PaginatedResponse } from '../models/paginated-response';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly api = inject(ApiService);

  getItems(type: ItemType, page: number, limit: number): Observable<PaginatedResponse<BaseItem>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.api.get<PaginatedResponse<BaseItem>>(`/${type}`, params);
  }

  deleteItem(type: ItemType, id: string): Observable<void> {
    return this.api.delete<void>(`/${type}/${id}`);
  }

  deleteMany(type: ItemType, ids: string[]): Observable<void> {
    if (!ids.length) {
      return of(undefined);
    }

    return from(ids).pipe(
      concatMap((id) => this.deleteItem(type, id)),
      toArray(),
      map(() => undefined)
    );
  }
}
