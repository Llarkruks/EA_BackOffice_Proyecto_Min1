import { Component, input, output, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemActionConfig, ItemModelBase, ItemPreviewColumn } from '../../../../core/models/items';
import { ItemActionButtons } from '../item-action-buttons/item-action-buttons';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule, ItemActionButtons],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTable {
  items = input<ItemModelBase[]>([]);
  previewColumns = input<ItemPreviewColumn[]>([]);
  actionConfig = input<ItemActionConfig>({
    edit: true,
    delete: true,
    toggleEnabled: false
  });
  previewTextMaxLength = input(30);
  selectedIds = input<string[]>([]);
  canAddItem = input(false);
  addButtonLabel = input('Add item');
  editableFields = input<string[]>([]);
  inlineEditSavingItemId = input<string | null>(null);
  inlineEditCompletedItemId = input<string | null>(null);

  deleteItem = output<string>();
  deleteMany = output<string[]>();
  toggleEnabled = output<string>();
  selectedIdsChange = output<string[]>();
  addItemClick = output<void>();
  inlineEditSubmit = output<{ itemId: string; changes: Record<string, string> }>();

  expandedRowKey: string | null = null;
  editingRowKey: string | null = null;
  editingItemId: string | null = null;
  private editDraft: Record<string, string> = {};
  private originalEditValues: Record<string, string> = {};
  private maxPreviewColumns = 4;

  constructor() {
    effect(() => {
      const completedItemId = this.inlineEditCompletedItemId();
      if (completedItemId && this.editingItemId === completedItemId) {
        this.finishInlineEdit();
      }
    });
  }

  activePreviewColumns = computed(() => {
    return this.previewColumns().slice(0, this.maxPreviewColumns);
  });

  tableGridTemplateColumns = computed(() => {
    const previewCount = Math.max(1, this.activePreviewColumns().length);
    return `52px repeat(${previewCount}, minmax(0, 1fr)) 112px`;
  });

  get selectionMode(): boolean {
    return this.selectedIds().length > 0;
  }

  get selectedCount(): number {
    return this.selectedIds().length;
  }

  getRowKey(itemId: string, index: number): string {
    return `${itemId}::${index}`;
  }

  toggleExpand(itemId: string, index: number): void {
    const rowKey = this.getRowKey(itemId, index);

    if (this.expandedRowKey === rowKey) {
      this.expandedRowKey = null;

      if (this.editingRowKey === rowKey) {
        this.finishInlineEdit();
      }

      return;
    }

    if (this.editingRowKey && this.editingRowKey !== rowKey) {
      this.finishInlineEdit();
    }

    this.expandedRowKey = rowKey;
  }

  isSelected(itemId: string): boolean {
    return this.getSelectedIdSet().has(itemId);
  }

  onCheckboxChange(itemId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set(this.getSelectedIdSet());

    if (checked) {
      next.add(itemId);
    } else {
      next.delete(itemId);
    }

    this.selectedIdsChange.emit(Array.from(next));
  }

  onItemDelete(itemId: string): void {
    this.deleteItem.emit(itemId);
  }

  onItemToggleEnabled(itemId: string): void {
    this.toggleEnabled.emit(itemId);
  }

  onAddItem(): void {
    this.addItemClick.emit();
  }

  startInlineEdit(item: ItemModelBase, rowIndex: number): void {
    const rowKey = this.getRowKey(item._id, rowIndex);
    this.expandedRowKey = rowKey;
    this.editingRowKey = rowKey;
    this.editingItemId = item._id;
    this.originalEditValues = this.buildEditableValueMap(item);
    this.editDraft = { ...this.originalEditValues };
  }

  cancelInlineEdit(): void {
    this.finishInlineEdit();
  }

  submitInlineEdit(): void {
    if (!this.editingItemId || this.inlineEditSavingItemId() === this.editingItemId) {
      return;
    }

    const changes = this.getInlineEditChanges();
    this.inlineEditSubmit.emit({
      itemId: this.editingItemId,
      changes
    });
  }

  isInlineEditingRow(rowKey: string): boolean {
    return this.editingRowKey === rowKey;
  }

  isInlineEditingItem(itemId: string): boolean {
    return this.editingItemId === itemId;
  }

  isInlineEditSaving(itemId: string): boolean {
    return this.inlineEditSavingItemId() === itemId;
  }

  isEditableField(key: string): boolean {
    return this.editableFields().includes(key);
  }

  getInlineInputValue(key: string): string {
    return this.editDraft[key] ?? '';
  }

  onInlineInputChange(key: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.editDraft[key] = target.value;
  }

  isInlineInputChanged(key: string): boolean {
    return (this.editDraft[key] ?? '') !== (this.originalEditValues[key] ?? '');
  }

  getPreviewCellText(item: ItemModelBase, column: ItemPreviewColumn): string {
    const value = this.getPreviewValue(item, column.key);
    return this.truncatePreviewText(value);
  }

  getPreviewValue(item: ItemModelBase, key: string): unknown {
    if (key === '_id') {
      return item._id;
    }

    const value = (item as unknown as Record<string, unknown>)[key];

    if (key === 'enabled') {
      return value === true ? 'Active' : 'Inactive';
    }

    return this.normalizeDetailValue(value);
  }

  isRowDisabled(item: ItemModelBase): boolean {
    return item.enabled === false;
  }

  onBulkDelete(): void {
    this.deleteMany.emit(this.selectedIds());
    this.clearSelection();
  }

  clearSelection(): void {
    this.selectedIdsChange.emit([]);
  }

  getObjectEntries(item: ItemModelBase): Array<{ key: string; value: unknown }> {
    return Object.entries(item).map(([key, value]) => ({
      key,
      value: this.normalizeDetailValue(value)
    }));
  }

  hasInlineChanges(): boolean {
    return Object.keys(this.getInlineEditChanges()).length > 0;
  }

  private buildEditableValueMap(item: ItemModelBase): Record<string, string> {
    const values: Record<string, string> = {};

    for (const key of this.editableFields()) {
      const rawValue = (item as unknown as Record<string, unknown>)[key];
      values[key] = this.toEditableInputText(rawValue);
    }

    return values;
  }

  private toEditableInputText(value: unknown): string {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).join(', ');
    }

    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return '';
  }

  private getInlineEditChanges(): Record<string, string> {
    const changes: Record<string, string> = {};

    for (const key of this.editableFields()) {
      const currentValue = this.editDraft[key] ?? '';
      const initialValue = this.originalEditValues[key] ?? '';

      if (currentValue !== initialValue) {
        changes[key] = currentValue;
      }
    }

    return changes;
  }

  private finishInlineEdit(): void {
    this.editingRowKey = null;
    this.editingItemId = null;
    this.editDraft = {};
    this.originalEditValues = {};
  }

  private normalizeDetailValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      const ids = value
        .map((item) => this.findNestedObjectId(item))
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

      return ids.length > 0 ? ids.join(', ') : '-';
    }

    if (typeof value === 'object') {
      return this.findNestedObjectId(value) ?? '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    return value;
  }

  private truncatePreviewText(value: unknown): string {
    const text = this.valueToText(value);
    const maxLength = Math.max(1, this.previewTextMaxLength());

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength)}...`;
  }

  private valueToText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return String(this.normalizeDetailValue(value));
  }

  private getSelectedIdSet(): Set<string> {
    return new Set(this.selectedIds());
  }

  private findNestedObjectId(value: unknown): string | null {
    if (value === null || value === undefined || typeof value !== 'object') {
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nestedId = this.findNestedObjectId(item);
        if (nestedId) return nestedId;
      }
      return null;
    }

    const objectValue = value as Record<string, unknown>;
    const ownId = objectValue['_id'];

    if (typeof ownId === 'string' && ownId.trim().length > 0) {
      return ownId;
    }

    if (typeof ownId === 'number' && Number.isFinite(ownId)) {
      return String(ownId);
    }

    for (const nestedValue of Object.values(objectValue)) {
      const nestedId = this.findNestedObjectId(nestedValue);
      if (nestedId) return nestedId;
    }

    return null;
  }
}