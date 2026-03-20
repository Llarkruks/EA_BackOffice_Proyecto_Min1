import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../../components/sidebar/sidebar';
import { DataTable } from '../../components/data-table/data-table';
import { Pagination } from '../../components/pagination/pagination';
import { DataService } from '../../../../core/services/data';
import { BaseItem } from '../../../../core/models/base-item';
import { ItemType, ItemTypeOption } from '../../../../core/models/item-type';
import { ITEM_TABLE_CONFIG } from '../../../../core/models/item-table-config';
import { PaginatedResponse } from '../../../../core/models/paginated-response';

type UserFormValue = {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  enabled: boolean;
};

type RouteFormValue = {
  name: string;
  description: string;
  city: string;
  country: string;
  distance: number | null;
  duration: number | null;
  difficulty: string;
  tags: string;
  userId: string;
};

@Component({
  selector: 'app-data-manager-page',
  imports: [CommonModule, FormsModule, Sidebar, DataTable, Pagination],
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

  selectedType = signal<ItemType>('users');
  items = signal<BaseItem[]>([]);
  allItems = signal<BaseItem[]>([]);
  selectedIds = signal<string[]>([]);
  loading = signal(false);
  isGlobalSearching = signal(false);
  page = signal(1);
  limit = signal(10);
  total = signal(0);
  totalPages = signal(0);
  searchTerm = signal('');

  showUserModal = signal(false);
  editingUserId = signal<string | null>(null);
  savingUser = signal(false);

  showRouteModal = signal(false);
  editingRouteId = signal<string | null>(null);
  savingRoute = signal(false);

  searching = signal(false);

  userForm = signal<UserFormValue>({
    name: '',
    surname: '',
    username: '',
    email: '',
    password: '',
    enabled: true
  });

  routeForm = signal<RouteFormValue>({
    name: '',
    description: '',
    city: '',
    country: '',
    distance: null,
    duration: null,
    difficulty: '',
    tags: '',
    userId: ''
  });

  readonly currentTypeLabel = computed(() => {
    return this.typeOptions.find(option => option.value === this.selectedType())?.label ?? this.selectedType();
  });

  readonly currentTableConfig = computed(() => {
    return ITEM_TABLE_CONFIG[this.selectedType()];
  });

  readonly currentPreviewColumns = computed(() => {
    return this.currentTableConfig().previewColumns;
  });

  readonly showSearch = computed(() => {
    const type = this.selectedType();
    return type === 'users' || type === 'routes';
  });

  readonly searchPlaceholder = computed(() => {
    const type = this.selectedType();

    if (type === 'users') return 'Search users by name...';
    if (type === 'routes') return 'Search routes by city...';

    return 'Search...';
  });

  readonly isUsersType = computed(() => this.selectedType() === 'users');
  readonly isRoutesType = computed(() => this.selectedType() === 'routes');

  readonly isEditingUser = computed(() => this.editingUserId() !== null);
  readonly isEditingRoute = computed(() => this.editingRouteId() !== null);

  readonly modalTitle = computed(() => this.isEditingUser() ? 'Edit user' : 'Add user');
  readonly routeModalTitle = computed(() => this.isEditingRoute() ? 'Edit route' : 'Add route');

  readonly canAddCurrentType = computed(() => {
    const type = this.selectedType();
    return type === 'users' || type === 'routes';
  });

  readonly addButtonLabel = computed(() => {
    if (this.selectedType() === 'users') return 'Add user';
    if (this.selectedType() === 'routes') return 'Add route';
    return 'Add item';
  });

  ngOnInit(): void {
    this.loadItems();
  }

  onTypeChange(type: ItemType): void {
    this.selectedType.set(type);
    this.selectedIds.set([]);
    this.searchTerm.set('');
    this.isGlobalSearching.set(false);
    this.page.set(1);
    this.closeUserModal();
    this.closeRouteModal();
    this.loadItems();
  }

  onPageChange(page: number): void {
    if (this.isGlobalSearching()) {
      return;
    }

    this.page.set(page);
    this.loadItems();
  }

  onLimitChange(limit: number): void {
    this.limit.set(limit);
    this.page.set(1);

    if (this.isGlobalSearching()) {
      if (this.selectedType() === 'users') {
        this.searchUsersAcrossAllPages();
        return;
      }

      if (this.selectedType() === 'routes') {
        this.searchRoutesAcrossAllPages();
        return;
      }

      return;
    }

    this.loadItems();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);

    if (this.selectedType() === 'users') {
      this.searchUsersAcrossAllPages();
      return;
    }

    if (this.selectedType() === 'routes') {
      this.searchRoutesAcrossAllPages();
      return;
    }

    this.applyLocalFilter();
  }

  private searchUsersAcrossAllPages(): void {
  const term = this.searchTerm().trim().toLowerCase();

  if (!term) {
    this.isGlobalSearching.set(false);
    this.searching.set(false);
    this.loadItems();
    return;
  }

  this.searching.set(true);
  this.isGlobalSearching.set(true);

  this.dataService.getAllItems('users', 50).subscribe({
    next: (allUsers) => {
      const normalizedUsers = this.normalizeItems(allUsers as Record<string, unknown>[]);

      const filteredUsers = normalizedUsers.filter((item: BaseItem) => {
        const name = this.valueToSearchText(item['name']);
        return name.includes(term);
      });

      this.allItems.set(normalizedUsers);
      this.items.set(filteredUsers);
      this.total.set(filteredUsers.length);
      this.totalPages.set(1);
      this.page.set(1);
      this.searching.set(false);
    },
    error: (error) => {
      console.error('Global user search error:', error);
      this.searching.set(false);
      this.isGlobalSearching.set(false);
    }
  });
}

  private searchRoutesAcrossAllPages(): void {
  const term = this.searchTerm().trim().toLowerCase();

  if (!term) {
    this.isGlobalSearching.set(false);
    this.searching.set(false);
    this.loadItems();
    return;
  }

  this.searching.set(true);
  this.isGlobalSearching.set(true);

  this.dataService.getAllItems('routes', 50).subscribe({
    next: (allRoutes) => {
      const normalizedRoutes = this.normalizeItems(allRoutes as Record<string, unknown>[]);

      const filteredRoutes = normalizedRoutes.filter((item: BaseItem) => {
        const city = this.valueToSearchText(item['city']);
        return city.includes(term);
      });

      this.allItems.set(normalizedRoutes);
      this.items.set(filteredRoutes);
      this.total.set(filteredRoutes.length);
      this.totalPages.set(1);
      this.page.set(1);
      this.searching.set(false);
    },
    error: (error) => {
      console.error('Global route search error:', error);
      this.searching.set(false);
      this.isGlobalSearching.set(false);
    }
  });
}

  clearSearch(): void {
    this.searchTerm.set('');
    this.isGlobalSearching.set(false);
    this.loadItems();
  }

  onOpenAddItem(): void {
    if (this.selectedType() === 'users') {
      this.onOpenAddUser();
      return;
    }

    if (this.selectedType() === 'routes') {
      this.onOpenAddRoute();
    }
  }

  onOpenEditItem(id: string): void {
    if (this.selectedType() === 'users') {
      this.onOpenEditUser(id);
      return;
    }

    if (this.selectedType() === 'routes') {
      this.onOpenEditRoute(id);
    }
  }

  onOpenAddUser(): void {
    this.editingUserId.set(null);
    this.userForm.set({
      name: '',
      surname: '',
      username: '',
      email: '',
      password: '',
      enabled: true
    });
    this.showUserModal.set(true);
  }

  onOpenEditUser(id: string): void {
    const item = this.items().find(user => user.id === id);
    if (!item) return;

    this.editingUserId.set(id);
    this.userForm.set({
      name: String(item['name'] ?? ''),
      surname: String(item['surname'] ?? ''),
      username: String(item['username'] ?? ''),
      email: String(item['email'] ?? ''),
      password: '',
      enabled: item['enabled'] !== false
    });
    this.showUserModal.set(true);
  }

  onUserFieldChange<K extends keyof UserFormValue>(key: K, value: UserFormValue[K]): void {
    this.userForm.update(current => ({
      ...current,
      [key]: value
    }));
  }

  onCloseUserModal(): void {
    this.closeUserModal();
  }

  onSubmitUser(): void {
    if (!this.isUsersType()) return;

    const form = this.userForm();

    if (this.isEditingUser()) {
      const updatePayload: Record<string, unknown> = {
        name: form.name.trim(),
        surname: form.surname.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        enabled: form.enabled
      };

      if (form.password.trim()) {
        updatePayload['password'] = form.password.trim();
      }

      this.savingUser.set(true);
      this.dataService.updateItem('users', this.editingUserId()!, updatePayload).subscribe({
        next: () => {
          this.savingUser.set(false);
          this.closeUserModal();
          this.loadItems();
        },
        error: (error) => {
          console.error('Update user error:', error);
          this.savingUser.set(false);
        }
      });

      return;
    }

    const createPayload: Record<string, unknown> = {
      name: form.name.trim(),
      surname: form.surname.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password.trim()
    };

    this.savingUser.set(true);
    this.dataService.createItem('users', createPayload).subscribe({
      next: () => {
        this.savingUser.set(false);
        this.closeUserModal();
        this.page.set(1);
        this.loadItems();
      },
      error: (error) => {
        console.error('Create user error:', error);
        this.savingUser.set(false);
      }
    });
  }

  onOpenAddRoute(): void {
    this.editingRouteId.set(null);
    this.routeForm.set({
      name: '',
      description: '',
      city: '',
      country: '',
      distance: null,
      duration: null,
      difficulty: '',
      tags: '',
      userId: ''
    });
    this.showRouteModal.set(true);
  }

  onOpenEditRoute(id: string): void {
    const item = this.items().find(route => route.id === id);
    if (!item) return;

    this.editingRouteId.set(id);
    this.routeForm.set({
      name: String(item['name'] ?? ''),
      description: String(item['description'] ?? ''),
      city: String(item['city'] ?? ''),
      country: String(item['country'] ?? ''),
      distance: typeof item['distance'] === 'number' ? item['distance'] : Number(item['distance'] ?? 0),
      duration: typeof item['duration'] === 'number' ? item['duration'] : Number(item['duration'] ?? 0),
      difficulty: String(item['difficulty'] ?? ''),
      tags: Array.isArray(item['tags']) ? item['tags'].join(', ') : '',
      userId: String(item['userId'] ?? item['user'] ?? '')
    });

    this.showRouteModal.set(true);
  }

  onRouteFieldChange<K extends keyof RouteFormValue>(key: K, value: RouteFormValue[K]): void {
    this.routeForm.update(current => ({
      ...current,
      [key]: value
    }));
  }

  onCloseRouteModal(): void {
    this.closeRouteModal();
  }

  onSubmitRoute(): void {
    if (!this.isRoutesType()) return;

    const form = this.routeForm();

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      distance: form.distance === null ? 0 : Number(form.distance),
      duration: form.duration === null ? 0 : Number(form.duration),
      difficulty: form.difficulty.trim(),
      tags: form.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
      userId: form.userId.trim()
    };

    this.savingRoute.set(true);

    if (this.isEditingRoute()) {
      this.dataService.updateItem('routes', this.editingRouteId()!, payload).subscribe({
        next: () => {
          this.savingRoute.set(false);
          this.closeRouteModal();
          this.loadItems();
        },
        error: (error) => {
          console.error('Update route error:', error);
          this.savingRoute.set(false);
        }
      });

      return;
    }

    this.dataService.createItem('routes', payload).subscribe({
      next: () => {
        this.savingRoute.set(false);
        this.closeRouteModal();
        this.page.set(1);
        this.loadItems();
      },
      error: (error) => {
        console.error('Create route error:', error);
        this.savingRoute.set(false);
      }
    });
  }

  onDeleteItem(id: string): void {
    const confirmed = window.confirm('Are you sure you want to delete this item?');
    if (!confirmed) return;

    this.dataService.deleteItem(this.selectedType(), id).subscribe({
      next: () => {
        this.selectedIds.update((current) => current.filter((selectedId) => selectedId !== id));
        this.loadItems();
      },
      error: (error) => console.error('Delete item error:', error)
    });
  }

  onDeleteMany(ids: string[]): void {
    if (!ids.length) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${ids.length} items?`);
    if (!confirmed) return;

    this.dataService.deleteMany(this.selectedType(), ids).subscribe({
      next: () => {
        this.selectedIds.update((current) => current.filter((selectedId) => !ids.includes(selectedId)));
        this.loadItems();
      },
      error: (error) => console.error('Bulk delete error:', error)
    });
  }

  onSelectedIdsChange(ids: string[]): void {
    this.selectedIds.set(ids);
  }

  onToggleEnabled(itemId: string): void {
    const item = this.items().find(i => i.id === itemId);
    if (item) {
      this.toggleEnabled(item);
    }
  }

  private closeUserModal(): void {
    this.showUserModal.set(false);
    this.editingUserId.set(null);
    this.savingUser.set(false);
  }

  private closeRouteModal(): void {
    this.showRouteModal.set(false);
    this.editingRouteId.set(null);
    this.savingRoute.set(false);
  }

  private loadItems(): void {
    this.loading.set(true);

    const requestedPage = this.page();
    const requestedLimit = this.limit();

    this.dataService.getItems(this.selectedType(), requestedPage, requestedLimit).subscribe({
      next: (response) => {
        const normalizedResponse = response as unknown as PaginatedResponse<Record<string, unknown>> & Record<string, unknown>;

        const rawItems = this.getArrayValue<Record<string, unknown>>(
          [
            normalizedResponse.data,
            normalizedResponse['items'],
            normalizedResponse['results'],
            normalizedResponse['docs'],
            this.getValueAtPath(normalizedResponse, ['pagination', 'data']),
            this.getValueAtPath(normalizedResponse, ['meta', 'data'])
          ],
          []
        );

        const responseItems = this.normalizeItems(rawItems);

        const responseTotal = this.getNumberValue(
          [
            normalizedResponse.total,
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

        const responseTotalPages = this.getNumberValue(
          [
            normalizedResponse.totalPages,
            normalizedResponse['total_pages'],
            normalizedResponse['pages'],
            normalizedResponse['pageCount'],
            this.getValueAtPath(normalizedResponse, ['pagination', 'totalPages']),
            this.getValueAtPath(normalizedResponse, ['pagination', 'pages']),
            this.getValueAtPath(normalizedResponse, ['meta', 'totalPages']),
            this.getValueAtPath(normalizedResponse, ['meta', 'pageCount'])
          ],
          undefined
        );

        const hasKnownTotal = typeof responseTotal === 'number' && responseTotal > 0;
        const hasMorePagesByHeuristic = responseItems.length === requestedLimit;

        const normalizedTotal = hasKnownTotal
          ? responseTotal
          : ((requestedPage - 1) * requestedLimit) + responseItems.length + (hasMorePagesByHeuristic ? 1 : 0);

        const normalizedTotalPages =
          this.getNumberValue(
            [responseTotalPages],
            hasKnownTotal
              ? Math.max(1, Math.ceil(normalizedTotal / Math.max(requestedLimit, 1)))
              : (hasMorePagesByHeuristic ? requestedPage + 1 : requestedPage)
          ) ?? 1;

        this.allItems.set(responseItems);
        this.applyLocalFilter();
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

  private applyLocalFilter(): void {
    const term = this.searchTerm().trim().toLowerCase();
    const type = this.selectedType();
    const sourceItems = this.allItems();

    if (!term || !this.showSearch()) {
      this.items.set(sourceItems);
      return;
    }

    const filteredItems = sourceItems.filter((item) => {
      if (type === 'users') {
        const name = this.valueToSearchText(item['name']);
        return name.includes(term);
      }

      if (type === 'routes') {
        const city = this.valueToSearchText(item['city']);
        return city.includes(term);
      }

      return true;
    });

    this.items.set(filteredItems);
  }

  private valueToSearchText(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.toLowerCase();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value).toLowerCase();
    return '';
  }

  private normalizeItems(values: Record<string, unknown>[]): BaseItem[] {
    return values.map((value) => {
      const id = this.getStringValue([value['_id']], '');
      const name = this.getStringValue([value['name'], value['title'], value['label']], id);

      return {
        ...value,
        id,
        name
      } as BaseItem;
    });
  }

  private toggleEnabled(item: BaseItem): void {
    if (this.selectedType() !== 'users') {
      return;
    }

    const currentEnabled = item['enabled'];
    if (typeof currentEnabled !== 'boolean') {
      return;
    }

    this.dataService.updateItem(this.selectedType(), item.id, {
      enabled: !currentEnabled
    }).subscribe({
      next: () => this.loadItems(),
      error: (error) => console.error('Toggle enabled error:', error)
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

  private getStringValue(values: unknown[], fallback: string): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
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