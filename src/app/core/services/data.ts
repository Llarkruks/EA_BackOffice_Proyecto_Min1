import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, concatMap, from, map, of, toArray, expand, reduce, EMPTY } from 'rxjs';

import { ApiService } from './api';
import { PaginatedResponse } from '../models/paginated-response';
import {
  CreatePayloadByType,
  ItemModelByType,
  ItemType,
  UpdatePayloadByType,
  normalizeItemByType,
  normalizeManyByType
} from '../models/items';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly api = inject(ApiService);

  getItems<TType extends ItemType>(
    type: TType,
    page: number,
    limit: number
  ): Observable<PaginatedResponse<ItemModelByType[TType]>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.api
      .get<Record<string, unknown> | PaginatedResponse<Record<string, unknown>>>(`/${type}`, params)
      .pipe(map((response) => this.normalizePaginatedResponse(type, response, page, limit)));
  }

  createItem<TType extends ItemType>(
    type: TType,
    payload: CreatePayloadByType[TType]
  ): Observable<ItemModelByType[TType]> {
    return this.api
      .post<Record<string, unknown>>(`/${type}`, payload)
      .pipe(map((item) => normalizeItemByType(type, item)));
  }

  getAllItems<TType extends ItemType>(type: TType, limit: number = 50): Observable<ItemModelByType[TType][]> {
    return this.getItems(type, 1, limit).pipe(
      expand((response, index) => {
        const currentPage = index + 1;
        const pageItems = response.data;

        if (pageItems.length < limit) {
          return EMPTY;
        }

        return this.getItems(type, currentPage + 1, limit);
      }),
      map((response) => response.data),
      reduce((allItems, pageItems) => [...allItems, ...pageItems], [] as ItemModelByType[TType][])
    );
  }

  deleteItem<TType extends ItemType>(type: TType, id: string): Observable<void> {
    return this.api.delete<void>(`/${type}/${id}`);
  }

  updateItem<TType extends ItemType>(
    type: TType,
    id: string,
    payload: UpdatePayloadByType[TType]
  ): Observable<ItemModelByType[TType]> {
    return this.api
      .put<Record<string, unknown>>(`/${type}/${id}`, payload)
      .pipe(map((item) => normalizeItemByType(type, item)));
  }

  deleteMany<TType extends ItemType>(type: TType, ids: string[]): Observable<void> {
    if (!ids.length) {
      return of(undefined);
    }

    return from(ids).pipe(
      concatMap((id) => this.deleteItem(type, id)),
      toArray(),
      map(() => undefined)
    );
  }

  private normalizePaginatedResponse<TType extends ItemType>(
    type: TType,
    response: Record<string, unknown> | PaginatedResponse<Record<string, unknown>>,
    requestedPage: number,
    requestedLimit: number
  ): PaginatedResponse<ItemModelByType[TType]> {
    const normalizedResponse = response as Record<string, unknown>;

    const rawItems = this.getArrayValue<Record<string, unknown>>(
      [
      normalizedResponse['data'],
      normalizedResponse['items'],
      normalizedResponse['results'],
      normalizedResponse['docs'],
      this.getValueAtPath(normalizedResponse, ['pagination', 'data']),
      this.getValueAtPath(normalizedResponse, ['meta', 'data'])
      ],
      []
    );

    const items = normalizeManyByType(type, rawItems);

    const page = this.getNumberValue(
      [
        normalizedResponse['page'],
        this.getValueAtPath(normalizedResponse, ['pagination', 'page']),
        this.getValueAtPath(normalizedResponse, ['meta', 'page'])
      ],
      requestedPage
    ) ?? 1;

    const limit = this.getNumberValue(
      [
        normalizedResponse['limit'],
        this.getValueAtPath(normalizedResponse, ['pagination', 'limit']),
        this.getValueAtPath(normalizedResponse, ['meta', 'limit'])
      ],
      requestedLimit
    ) ?? 1;

    const total = this.getNumberValue(
      [
        normalizedResponse['total'],
        normalizedResponse['totalItems'],
        normalizedResponse['totalCount'],
        normalizedResponse['total_count'],
        normalizedResponse['totalDocs'],
        normalizedResponse['total_documents'],
        this.getValueAtPath(normalizedResponse, ['pagination', 'total']),
        this.getValueAtPath(normalizedResponse, ['pagination', 'totalItems']),
        this.getValueAtPath(normalizedResponse, ['pagination', 'totalCount']),
        this.getValueAtPath(normalizedResponse, ['meta', 'total']),
        this.getValueAtPath(normalizedResponse, ['meta', 'totalItems']),
        this.getValueAtPath(normalizedResponse, ['meta', 'totalCount'])
      ],
      undefined
    );

    const hasKnownTotal = typeof total === 'number' && total > 0;
    const hasMorePagesByHeuristic = items.length === limit;

    const normalizedTotal = hasKnownTotal
      ? total
      : ((page - 1) * limit) + items.length + (hasMorePagesByHeuristic ? 1 : 0);

    const totalPages = this.getNumberValue(
      [
        normalizedResponse['totalPages'],
        normalizedResponse['total_pages'],
        normalizedResponse['pages'],
        normalizedResponse['pageCount'],
        this.getValueAtPath(normalizedResponse, ['pagination', 'totalPages']),
        this.getValueAtPath(normalizedResponse, ['pagination', 'pages']),
        this.getValueAtPath(normalizedResponse, ['meta', 'totalPages']),
        this.getValueAtPath(normalizedResponse, ['meta', 'pageCount'])
      ],
      hasKnownTotal
        ? Math.max(1, Math.ceil(normalizedTotal / Math.max(limit, 1)))
        : (hasMorePagesByHeuristic ? page + 1 : page)
    ) ?? 1;

    return {
      data: items,
      page,
      limit,
      total: Math.max(0, normalizedTotal),
      totalPages: Math.max(1, totalPages)
    };
  }

  private getNumberValue(values: unknown[], fallback: number | undefined): number | undefined {
    for (const value of values) {
      const numberValue = typeof value === 'number' ? value : Number(value);

      if (Number.isFinite(numberValue) && numberValue >= 0) {
        return numberValue;
      }
    }

    return fallback;
  }

  private getArrayValue<T>(values: unknown[], fallback: T[]): T[] {
    for (const value of values) {
      if (Array.isArray(value)) {
        return value as T[];
      }
    }

    return fallback;
  }

  private getValueAtPath(source: unknown, path: string[]): unknown {
    let current = source;

    for (const key of path) {
      if (typeof current !== 'object' || current === null || !(key in current)) {
        return undefined;
      }

      current = (current as Record<string, unknown>)[key];
    }

    return current;
  }
}