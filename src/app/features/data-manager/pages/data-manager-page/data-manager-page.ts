import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../components/sidebar/sidebar';
import { DataTable } from '../../components/data-table/data-table';
import { Pagination } from '../../components/pagination/pagination';
import { SearchBar } from '../../components/search-bar/search-bar';
import { UserFormModal } from '../../components/create-forms/user-form-modal/user-form-modal';
import { RouteFormModal } from '../../components/create-forms/route-form-modal/route-form-modal';
import { PointFormModal } from '../../components/create-forms/point-form-modal/point-form-modal';
import { QuestionFormModal } from '../../components/create-forms/question-form-modal/question-form-modal';
import { AnswerFormModal } from '../../components/create-forms/answer-form-modal/answer-form-modal';
import { DataService } from '../../../../core/services/data';
import {
  CreatePointPayload,
  CreateQuestionPayload,
  CreateRoutePayload,
  CreateUserPayload,
  ITEM_TYPE_OPTIONS,
  ITEM_UI_CONFIG,
  ItemActionConfig,
  ItemModel,
  ItemType,
  ItemTypeOption,
  ItemUiConfig,
  PointItem,
  QuestionItem,
  RouteItem,
  UpdateQuestionPayload,
  UpdateUserPayload,
  UserItem
} from '../../../../core/models/items';
import {
  AnswerFormValue,
  PointFormValue,
  QuestionFormValue,
  RouteFormValue,
  UserFormValue
} from '../../models/forms';
import {
  buildPointInlineUpdatePayload,
  buildRouteInlineUpdatePayload,
  buildUserInlineUpdatePayload
} from '../../utils/inline-edit-payloads';

@Component({
  selector: 'app-data-manager-page',
  imports: [
    CommonModule,
    Sidebar,
    DataTable,
    Pagination,
    SearchBar,
    UserFormModal,
    RouteFormModal,
    PointFormModal,
    QuestionFormModal,
    AnswerFormModal
  ],
  templateUrl: './data-manager-page.html',
  styleUrl: './data-manager-page.css'
})
export class DataManagerPage implements OnInit {
  private dataService = inject(DataService);

  typeOptions: ItemTypeOption[] = ITEM_TYPE_OPTIONS;

  selectedType = signal<ItemType>('users');
  items = signal<ItemModel[]>([]);
  allItems = signal<ItemModel[]>([]);
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

  showPointModal = signal(false);
  editingPointId = signal<string | null>(null);
  savingPoint = signal(false);

  showQuestionModal = signal(false);
  editingQuestionId = signal<string | null>(null);
  savingQuestion = signal(false);

  showAnswerModal = signal(false);
  answeringQuestionId = signal<string | null>(null);
  savingAnswer = signal(false);

  searching = signal(false);
  inlineEditSavingItemId = signal<string | null>(null);
  inlineEditCompletedItemId = signal<string | null>(null);

  userForm = signal<UserFormValue>({
    name: '',
    surname: '',
    username: '',
    email: '',
    password: '',
    enabled: true,
    role: 'user'
  });

  routeForm = signal<RouteFormValue>({
    name: '',
    description: '',
    city: '',
    country: '',
    distance: null,
    duration: null,
    difficulty: 'easy',
    tags: '',
    userId: ''
  });

  pointForm = signal<PointFormValue>({
    name: '',
    description: '',
    latitude: null,
    longitude: null,
    image: '',
    routeId: '',
    index: null
  });

  questionForm = signal<QuestionFormValue>({
    title: '',
    description: '',
    pointId: ''
  });

  answerForm = signal<AnswerFormValue>({
    text: '',
    userId: ''
  });

  currentTypeLabel = computed(() => {
    return this.currentTypeConfig().label;
  });

  currentTypeConfig = computed<ItemUiConfig>(() => {
    return ITEM_UI_CONFIG[this.selectedType()];
  });

  currentPreviewColumns = computed(() => {
    return this.currentTypeConfig().previewColumns;
  });

  currentActionConfig = computed<ItemActionConfig>(() => {
    return this.currentTypeConfig().actions;
  });

  currentEditableFields = computed(() => {
    return this.currentTypeConfig().editableFields;
  });

  searchPlaceholder = computed(() => {
    const config = this.currentTypeConfig();
    return config.search.placeholder || 'Search...';
  });

  isUsersType = computed(() => this.selectedType() === 'users');
  isRoutesType = computed(() => this.selectedType() === 'routes');
  isPointsType = computed(() => this.selectedType() === 'points');
  isQuestionsType = computed(() => this.selectedType() === 'questions');

  isEditingUser = computed(() => this.editingUserId() !== null);
  isEditingRoute = computed(() => this.editingRouteId() !== null);
  isEditingPoint = computed(() => this.editingPointId() !== null);
  isEditingQuestion = computed(() => this.editingQuestionId() !== null);

  modalTitle = computed(() => this.isEditingUser() ? 'Edit user' : 'Add user');
  routeModalTitle = computed(() => this.isEditingRoute() ? 'Edit route' : 'Add route');
  pointModalTitle = computed(() => this.isEditingPoint() ? 'Edit point' : 'Add point');
  questionModalTitle = computed(() => this.isEditingQuestion() ? 'Edit question' : 'Add question');

  canAddCurrentType = computed(() => {
    return true;
  });

  addButtonLabel = computed(() => {
    return 'Add';
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
    this.closePointModal();
    this.closeQuestionModal();
    this.closeAnswerModal();
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
      this.searchAcrossAllPages();
      return;
    }

    this.loadItems();
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);

    if (!value.trim()) {
      this.isGlobalSearching.set(false);
      this.searching.set(false);
      this.loadItems();
      return;
    }

    this.searchAcrossAllPages();
  }

  private searchAcrossAllPages(): void {
    const term = this.searchTerm().trim().toLowerCase();
    const searchKey = this.getSearchKey();
    const itemType = this.selectedType();

    if (!term || !searchKey) {
      this.isGlobalSearching.set(false);
      this.searching.set(false);
      this.loadItems();
      return;
    }

    this.searching.set(true);
    this.isGlobalSearching.set(true);

    this.dataService.getAllItems(itemType, 50).subscribe({
      next: (allItems) => {
        const filteredItems = allItems.filter((item) => {
          const value = this.valueToSearchText(this.getItemValueByKey(item, searchKey));
          return value.includes(term);
        });

        this.allItems.set(allItems);
        this.items.set(filteredItems);
        this.total.set(filteredItems.length);
        this.totalPages.set(1);
        this.page.set(1);
        this.searching.set(false);
      },
      error: (error) => {
        console.error('Global search error:', error);
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
      return;
    }

    if (this.selectedType() === 'points') {
      this.onOpenAddPoint();
      return;
    }

    if (this.selectedType() === 'questions') {
      this.onOpenAddQuestion();
    }
  }

  onOpenEditItem(id: string): void {
    if (this.selectedType() === 'users') {
      this.onOpenEditUser(id);
      return;
    }

    if (this.selectedType() === 'routes') {
      this.onOpenEditRoute(id);
      return;
    }

    if (this.selectedType() === 'points') {
      this.onOpenEditPoint(id);
      return;
    }

    if (this.selectedType() === 'questions') {
      this.onOpenEditQuestion(id);
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
      enabled: true,
      role: 'user'
    });
    this.showUserModal.set(true);
  }

  onOpenEditUser(id: string): void {
    const item = this.items().find((user): user is UserItem => user._id === id);
    if (!item) return;

    this.editingUserId.set(id);
    this.userForm.set({
      name: item.name,
      surname: item.surname,
      username: item.username,
      email: item.email,
      password: '',
      enabled: item.enabled,
      role: item.role
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
    if (this.savingUser()) {
      return;
    }

    this.closeUserModal();
  }

  onSubmitUser(): void {
    if (!this.isUsersType()) return;

    const form = this.userForm();

    if (this.isEditingUser()) {
      const updatePayload: UpdateUserPayload = {
        name: form.name.trim(),
        surname: form.surname.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        enabled: form.enabled,
        role: form.role
      };

      if (form.password.trim()) {
        updatePayload.password = form.password.trim();
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

    const createPayload: CreateUserPayload = {
      name: form.name.trim(),
      surname: form.surname.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      enabled: form.enabled,
      role: form.role
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
      difficulty: 'easy',
      tags: '',
      userId: ''
    });
    this.showRouteModal.set(true);
  }

  onOpenEditRoute(id: string): void {
    const item = this.items().find((route): route is RouteItem => route._id === id);
    if (!item) return;

    this.editingRouteId.set(id);
    this.routeForm.set({
      name: item.name,
      description: item.description,
      city: item.city,
      country: item.country,
      distance: item.distance,
      duration: item.duration,
      difficulty: item.difficulty,
      tags: item.tags.join(', '),
      userId: item.userId
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
    if (this.savingRoute()) {
      return;
    }

    this.closeRouteModal();
  }

  onSubmitRoute(): void {
    if (!this.isRoutesType()) return;

    const form = this.routeForm();

    const payload: CreateRoutePayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      distance: form.distance === null ? 0 : Number(form.distance),
      duration: form.duration === null ? 0 : Number(form.duration),
      difficulty: form.difficulty,
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

  onOpenAddPoint(): void {
    this.editingPointId.set(null);

    this.pointForm.set({
      name: '',
      description: '',
      latitude: null,
      longitude: null,
      image: '',
      routeId: '',
      index: null
    });

    this.showPointModal.set(true);
  }

  onOpenEditPoint(id: string): void {
    const item = this.items().find((point): point is PointItem => point._id === id);

    if (!item) return;

    this.editingPointId.set(id);

    this.pointForm.set({
      name: item.name,
      description: item.description ?? '',
      latitude: item.latitude,
      longitude: item.longitude,
      image: item.image ?? '',
      routeId: item.routeId,
      index: item.index
    });

    this.showPointModal.set(true);
  }

  onPointFieldChange<K extends keyof PointFormValue>(
    key: K,
    value: PointFormValue[K]
  ): void {
    this.pointForm.update(current => ({
      ...current,
      [key]: value
    }));
  }

  onClosePointModal(): void {
    if (this.savingPoint()) {
      return;
    }

    this.closePointModal();
  }

  onSubmitPoint(): void {
    if (!this.isPointsType()) return;

    const form = this.pointForm();

    const payload: CreatePointPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      latitude: form.latitude === null ? 0 : Number(form.latitude),
      longitude: form.longitude === null ? 0 : Number(form.longitude),
      image: form.image.trim(),
      routeId: form.routeId.trim(),
      index: form.index === null ? 0 : Number(form.index)
    };

    this.savingPoint.set(true);

    if (this.isEditingPoint()) {
      this.dataService.updateItem('points', this.editingPointId()!, payload).subscribe({
        next: () => {
          this.savingPoint.set(false);
          this.closePointModal();
          this.loadItems();
        },
        error: (error) => {
          console.error('Update point error:', error);
          this.savingPoint.set(false);
        }
      });

      return;
    }

    this.dataService.createItem('points', payload).subscribe({
      next: () => {
        this.savingPoint.set(false);
        this.closePointModal();
        this.page.set(1);
        this.loadItems();
      },
      error: (error) => {
        console.error('Create point error:', error);
        this.savingPoint.set(false);
      }
    });
  }

  onOpenAddQuestion(): void {
    this.editingQuestionId.set(null);
    this.questionForm.set({
      title: '',
      description: '',
      pointId: ''
    });
    this.showQuestionModal.set(true);
  }

  onOpenEditQuestion(id: string): void {
    const item = this.items().find((question): question is QuestionItem => question._id === id);

    if (!item) return;

    this.editingQuestionId.set(id);
    this.questionForm.set({
      title: item.title,
      description: item.description ?? '',
      pointId: item.pointId
    });

    this.showQuestionModal.set(true);
  }

  onQuestionFieldChange<K extends keyof QuestionFormValue>(key: K, value: QuestionFormValue[K]): void {
    this.questionForm.update(current => ({
      ...current,
      [key]: value
    }));
  }

  onCloseQuestionModal(): void {
    if (this.savingQuestion()) {
      return;
    }

    this.closeQuestionModal();
  }

  onSubmitQuestion(): void {
    if (!this.isQuestionsType()) return;

    const form = this.questionForm();

    const payload: CreateQuestionPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      pointId: form.pointId.trim()
    };

    this.savingQuestion.set(true);

    if (this.isEditingQuestion()) {
      const updatePayload: UpdateQuestionPayload = payload;

      this.dataService.updateItem('questions', this.editingQuestionId()!, updatePayload).subscribe({
        next: () => {
          this.savingQuestion.set(false);
          this.closeQuestionModal();
          this.loadItems();
        },
        error: (error) => {
          console.error('Update question error:', error);
          this.savingQuestion.set(false);
        }
      });

      return;
    }

    this.dataService.createItem('questions', payload).subscribe({
      next: () => {
        this.savingQuestion.set(false);
        this.closeQuestionModal();
        this.page.set(1);
        this.loadItems();
      },
      error: (error) => {
        console.error('Create question error:', error);
        this.savingQuestion.set(false);
      }
    });
  }

  onOpenAddAnswer(questionId: string): void {
    this.answeringQuestionId.set(questionId);
    this.answerForm.set({
      text: '',
      userId: ''
    });
    this.showAnswerModal.set(true);
  }

  onAnswerFieldChange<K extends keyof AnswerFormValue>(key: K, value: AnswerFormValue[K]): void {
    this.answerForm.update(current => ({
      ...current,
      [key]: value
    }));
  }

  onCloseAnswerModal(): void {
    if (this.savingAnswer()) {
      return;
    }

    this.closeAnswerModal();
  }

  onSubmitAnswer(): void {
    const questionId = this.answeringQuestionId();

    if (!questionId) {
      return;
    }

    const form = this.answerForm();

    this.savingAnswer.set(true);

    this.dataService.addAnswer(questionId, {
      text: form.text.trim(),
      userId: form.userId.trim()
    }).subscribe({
      next: () => {
        this.savingAnswer.set(false);
        this.closeAnswerModal();
        this.loadItems();
      },
      error: (error) => {
        console.error('Add answer error:', error);
        this.savingAnswer.set(false);
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

  onInlineEditSubmit(event: { itemId: string; changes: Record<string, string> }): void {
    const { itemId, changes } = event;

    if (Object.keys(changes).length === 0) {
      this.inlineEditCompletedItemId.set(itemId);
      return;
    }

    this.inlineEditSavingItemId.set(itemId);
    this.inlineEditCompletedItemId.set(null);

    const type = this.selectedType();

    if (type === 'users') {
      const payload = buildUserInlineUpdatePayload(changes);
      this.dataService.updateItem('users', itemId, payload).subscribe({
        next: () => {
          this.inlineEditSavingItemId.set(null);
          this.inlineEditCompletedItemId.set(itemId);
          this.loadItems();
        },
        error: (error) => {
          console.error('Inline edit user error:', error);
          this.inlineEditSavingItemId.set(null);
        }
      });
      return;
    }

    if (type === 'routes') {
      const payload = buildRouteInlineUpdatePayload(changes);
      this.dataService.updateItem('routes', itemId, payload).subscribe({
        next: () => {
          this.inlineEditSavingItemId.set(null);
          this.inlineEditCompletedItemId.set(itemId);
          this.loadItems();
        },
        error: (error) => {
          console.error('Inline edit route error:', error);
          this.inlineEditSavingItemId.set(null);
        }
      });
      return;
    }

    if (type === 'points') {
      const payload = buildPointInlineUpdatePayload(changes);
      this.dataService.updateItem('points', itemId, payload).subscribe({
        next: () => {
          this.inlineEditSavingItemId.set(null);
          this.inlineEditCompletedItemId.set(itemId);
          this.loadItems();
        },
        error: (error) => {
          console.error('Inline edit point error:', error);
          this.inlineEditSavingItemId.set(null);
        }
      });
      return;
    }

    const payload: UpdateQuestionPayload = {};

    if (typeof changes['title'] === 'string') {
      payload.title = changes['title'].trim();
    }

    if (typeof changes['description'] === 'string') {
      payload.description = changes['description'].trim();
    }

    if (typeof changes['pointId'] === 'string') {
      payload.pointId = changes['pointId'].trim();
    }

    this.dataService.updateItem('questions', itemId, payload).subscribe({
      next: () => {
        this.inlineEditSavingItemId.set(null);
        this.inlineEditCompletedItemId.set(itemId);
        this.loadItems();
      },
      error: (error) => {
        console.error('Inline edit question error:', error);
        this.inlineEditSavingItemId.set(null);
      }
    });
  }

  onToggleEnabled(itemId: string): void {
    const item = this.items().find((i): i is UserItem => i._id === itemId);

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

  private closePointModal(): void {
    this.showPointModal.set(false);
    this.editingPointId.set(null);
    this.savingPoint.set(false);
  }

  private closeQuestionModal(): void {
    this.showQuestionModal.set(false);
    this.editingQuestionId.set(null);
    this.savingQuestion.set(false);
  }

  private closeAnswerModal(): void {
    this.showAnswerModal.set(false);
    this.answeringQuestionId.set(null);
    this.savingAnswer.set(false);
  }

  private loadItems(): void {
    this.loading.set(true);

    const page = this.page();
    const limit = this.limit();

    this.dataService.getItems(this.selectedType(), page, limit).subscribe({
      next: (response) => {
        this.allItems.set(response.data);
        this.applyLocalFilter();
        this.page.set(Math.max(1, response.page));
        this.limit.set(Math.max(1, response.limit));
        this.total.set(Math.max(0, response.total));
        this.totalPages.set(Math.max(1, response.totalPages));
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
    const sourceItems = this.allItems();
    const searchKey = this.getSearchKey();

    if (!term || !searchKey) {
      this.items.set(sourceItems);
      return;
    }

    const filteredItems = sourceItems.filter((item) => {
      const value = this.valueToSearchText(this.getItemValueByKey(item, searchKey));
      return value.includes(term);
    });

    this.items.set(filteredItems);
  }

  private getSearchKey(): string {
    return this.currentTypeConfig().search.key || '';
  }

  private getItemValueByKey(item: ItemModel, key: string): unknown {
    const record = item as unknown as Record<string, unknown>;

    if (key === 'answersCount' && Array.isArray(record['answers'])) {
      return record['answers'].length;
    }

    return record[key];
  }

  private valueToSearchText(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.toLowerCase();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value).toLowerCase();
    return '';
  }

  private toggleEnabled(item: UserItem): void {
    if (this.selectedType() !== 'users') {
      return;
    }

    this.dataService.updateItem('users', item._id, {
      enabled: !item.enabled
    }).subscribe({
      next: () => this.loadItems(),
      error: (error) => console.error('Toggle enabled error:', error)
    });
  }
}