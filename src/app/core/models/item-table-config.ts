import { ItemType } from './item-type';

export interface ItemPreviewColumn {
  key: string;
  label: string;
}

export interface ItemTableConfig {
  previewColumns: ItemPreviewColumn[];
}

export const ITEM_TABLE_CONFIG: Record<ItemType, ItemTableConfig> = {
  users: {
    previewColumns: [
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'enabled', label: 'Status' }
    ]
  },
  routes: {
    previewColumns: [
      { key: 'name', label: 'Name' },
      { key: '_id', label: 'ID' }
    ]
  },
  points: {
    previewColumns: [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'index', label: 'Index' },
      { key: '_id', label: 'ID' }
    ]
  }
};