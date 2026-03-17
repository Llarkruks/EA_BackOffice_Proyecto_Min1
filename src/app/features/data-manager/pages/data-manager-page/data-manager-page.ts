import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Sidebar } from '../../components/sidebar/sidebar';
import { DataTable } from '../../components/data-table/data-table';
import { Pagination } from '../../components/pagination/pagination';

import { DataService } from '../../../../core/services/data';
import { BaseItem } from '../../../../core/models/base-item';
import { ItemType, ItemTypeOption } from '../../../../core/models/item-type';

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

    this.dataService.getItems(
      this.selectedType(),
      this.page(),
      this.limit()
    ).subscribe({
      next: (response) => {
        this.items.set(response.data);
        this.page.set(response.page);
        this.limit.set(response.limit);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Load items error:', error);
        this.loading.set(false);
      }
    });
  }
}