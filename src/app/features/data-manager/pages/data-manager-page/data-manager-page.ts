import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Sidebar } from '../../components/sidebar/sidebar';
import { DataTable } from '../../components/data-table/data-table';
import { Pagination } from '../../components/pagination/pagination';

import { DataService } from '../../../../core/services/data';
import { BaseItem } from '../../../../core/models/base-item';
import { ItemType, ItemTypeOption } from '../../../../core/models/item-type';
import { PaginatedResponse } from '../../../../core/models/paginated-response';

@Component({
  selector: 'app-data-manager-page',
  imports: [
    CommonModule,
    Sidebar,
    DataTable,
    Pagination
  ],
  templateUrl: './data-manager-page.html',
  styleUrl: './data-manager-page.css'
})
export class DataManagerPage implements OnInit {
  private readonly dataService = inject(DataService);

  readonly typeOptions: ItemTypeOption[] = [
    { value: 'users', label: 'Users' },
    { value: 'routes', label: 'Routes' },
    { value: 'points', label: 'Points' }
  ];

  readonly displayFieldMap: Record<ItemType, string> = {
    users: 'name',
    routes: 'name',
    points: 'name'
  };

  selectedType = signal<ItemType>('users');
  items = signal<BaseItem[]>([]);
  loading = signal(false);

  page = signal(1);
  limit = signal(10);
  total = signal(0);
  totalPages = signal(0);

  readonly currentTypeLabel = computed(() => {
    return this.typeOptions.find(option => option.value === this.selectedType())?.label ?? this.selectedType();
  });

  readonly currentDisplayField = computed(() => {
    return this.displayFieldMap[this.selectedType()];
  });

  ngOnInit(): void {
    this.loadItems();
  }

  onTypeChange(type: ItemType): void {
    this.selectedType.set(type);
    this.page.set(1);
    this.loadItems();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadItems();
  }

  onLimitChange(limit: number): void {
    this.limit.set(limit);
    this.page.set(1);
    this.loadItems();
  }

  onDeleteItem(id: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this item?');
    if (!confirmed) return;

    this.dataService.deleteItem(this.selectedType(), id).subscribe({
      next: () => this.loadItems(),
      error: (error) => console.error('Delete item error:', error)
    });
  }

  onDeleteMany(ids: string[]): void {
    if (!ids.length) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${ids.length} items?`);
    if (!confirmed) return;

    this.dataService.deleteMany(this.selectedType(), ids).subscribe({
      next: () => this.loadItems(),
      error: (error) => console.error('Bulk delete error:', error)
    });
  }

  private loadItems(): void {
    this.loading.set(true);

    const requestedPage = this.page();
    const requestedLimit = this.limit();

    this.dataService.getItems(
      this.selectedType(),
      requestedPage,
      requestedLimit
    ).subscribe({
      next: (response) => {
        const normalizedResponse = response as PaginatedResponse<BaseItem> & Record<string, unknown>;

        const responseItems = this.getArrayValue<BaseItem>(
          [
            normalizedResponse.data,
            normalizedResponse['items'],
            normalizedResponse['results'],
            normalizedResponse['docs']
          ],
          []
        );

        const responseTotal = this.getNumberValue(
          [
            normalizedResponse.total,
            normalizedResponse['totalItems'],
            normalizedResponse['total_count'],
            normalizedResponse['count'],
            normalizedResponse['totalDocs']
          ],
          undefined
        );

        const responseTotalPages = this.getNumberValue(
          [
            normalizedResponse.totalPages,
            normalizedResponse['total_pages'],
            normalizedResponse['pages'],
            normalizedResponse['pageCount']
          ],
          undefined
        );

        const hasKnownTotal = typeof responseTotal === 'number' && responseTotal > 0;
        const hasMorePagesByHeuristic = responseItems.length === requestedLimit;

        const normalizedTotal = hasKnownTotal
          ? responseTotal
          : ((requestedPage - 1) * requestedLimit) + responseItems.length + (hasMorePagesByHeuristic ? 1 : 0);

        const normalizedTotalPages = this.getNumberValue(
          [responseTotalPages],
          hasKnownTotal
            ? Math.max(1, Math.ceil(normalizedTotal / Math.max(requestedLimit, 1)))
            : (hasMorePagesByHeuristic ? requestedPage + 1 : requestedPage)
        ) ?? 1;

        this.items.set(responseItems);
        this.page.set(Math.max(1, requestedPage));
        this.limit.set(Math.max(1, requestedLimit));
        this.total.set(Math.max(0, normalizedTotal));
        this.totalPages.set(Math.max(1, normalizedTotalPages));
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Load items error:', error);
        this.loading.set(false);
      }
    });
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
}