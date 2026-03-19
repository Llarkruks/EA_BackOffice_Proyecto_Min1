import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, concatMap, from, map, of, toArray, expand, reduce, EMPTY  } from 'rxjs';

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
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.api.get<PaginatedResponse<BaseItem>>(`/${type}`, params);
  }

  getAllItems(type: ItemType, limit: number = 50): Observable<BaseItem[]> {
    return this.getItems(type, 1, limit).pipe(
      expand((response, index) => {
        const currentPage = index + 1;
        const pageItems = this.extractItems(response);

        if (pageItems.length < limit) {
          return EMPTY;
        }

        return this.getItems(type, currentPage + 1, limit);
      }),
      map((response) => this.extractItems(response)),
      reduce((allItems, pageItems) => [...allItems, ...pageItems], [] as BaseItem[])
    );
  }

  deleteItem(type: ItemType, id: string): Observable<void> {
    return this.api.delete<void>(`/${type}/${id}`);
  }

  updateItem(type: ItemType, id: string, payload: Record<string, unknown>): Observable<BaseItem> {
    return this.api.put<BaseItem>(`/${type}/${id}`, payload);
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

  private extractItems(response: PaginatedResponse<BaseItem>): BaseItem[] {
  const normalizedResponse = response as PaginatedResponse<BaseItem> & Record<string, unknown>;

  const possibleItems = [
    normalizedResponse.data,
    normalizedResponse['items'],
    normalizedResponse['results'],
    normalizedResponse['docs']
  ];

  for (const value of possibleItems) {
    if (Array.isArray(value)) {
      return value as BaseItem[];
    }
  }

  return [];
}
}
